const crypto = require('crypto');
const supabase = require('../config/supabase');
const { pineconeIndex } = require('../config/pinecone');
const { NotionProvider } = require('./providers/notionProvider');
const { SlackProvider } = require('./providers/slackProvider');
const { ConfluenceProvider } = require('./providers/confluenceProvider');
const { GitHubProvider } = require('./providers/githubProvider');
const { decrypt } = require('../utils/encryption');
const { generateNamespace } = require('../utils/namespace');
const { model } = require('../config/gemini');
const decisionService = require('./decisionService');

const pLimit = require('p-limit');

function getProviderInstance(providerName, token) {
  switch (providerName) {
    case 'notion':
      return new NotionProvider(token);
    case 'slack':
      return new SlackProvider(token);
    case 'confluence':
      return new ConfluenceProvider(token);
    case 'github':
      return new GitHubProvider(token);
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

/**
 * Creates sync jobs for a list of selected integration items and kicks off
 * background processing immediately. Returns job IDs so the frontend can poll.
 *
 * This function returns FAST — it queues the jobs and fires processQueue()
 * asynchronously without awaiting it, so the HTTP response goes back to the
 * client in ~100ms even if there are 20 pages to sync.
 *
 * @param {object} integration - Integration row from the DB
 * @param {Array}  items       - Items selected by user from provider (e.g. Notion pages)
 * @param {object} user        - Authenticated user (from auth middleware)
 * @returns {Promise<string[]>} - Array of sync job IDs for frontend polling
 */
async function createSyncJob(integration, items, user) {
  const jobIds = [];

  for (const item of items) {
    // Upsert the integration_items row (idempotent — safe to call multiple times)
    const { data: dbItem, error: itemError } = await supabase
      .from('integration_items')
      .upsert(
        {
          integration_id: integration.id,
          external_id: item.external_id,
          title: item.title,
          item_type: item.item_type || 'page',
          external_updated_at: item.external_updated_at || null,
          status: 'pending'
        },
        { onConflict: 'integration_id,external_id' }
      )
      .select()
      .single();

    if (itemError) {
      console.error('Error upserting integration_item:', itemError);
      continue;
    }

    // Create a queued sync job for this item
    const { data: job, error: jobError } = await supabase
      .from('sync_jobs')
      .insert({ integration_item_id: dbItem.id, status: 'queued' })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating sync_job:', jobError);
      continue;
    }

    jobIds.push(job.id);
  }

  // Kick off background processing — do NOT await this
  // The HTTP response returns immediately with job IDs for polling
  processQueue(integration, user).catch(err =>
    console.error('processQueue background error:', err)
  );

  return jobIds;
}

/**
 * Picks up to 10 queued jobs and processes them concurrently (max 3 at once).
 * Called in the background after createSyncJob() returns.
 * Using p-limit to avoid sequential bottleneck with multiple providers.
 */
async function processQueue(integration, user) {
  const { data: jobs, error } = await supabase
    .from('sync_jobs')
    .select('*, integration_items(*)')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(10); // increased from 5 — processed concurrently now

  if (error) {
    console.error('processQueue fetch error:', error);
    return;
  }

  if (!jobs || jobs.length === 0) return;

  // Process up to 3 jobs concurrently — avoids overwhelming Pinecone/provider APIs
  const limit = pLimit(3);
  await Promise.all(
    jobs.map(job => limit(() => processJob(job, integration, user)))
  );
}

/**
 * Processes a single sync job:
 * 1. Marks job as running
 * 2. Fetches content from provider
 * 3. Checks content hash — skips if unchanged (incremental sync)
 * 4. Deletes old Pinecone vectors for this item
 * 5. Chunks, embeds, and upserts new vectors
 * 6. Updates item status and job as done
 */
async function processJob(job, integration, user) {
  // Helper for ADR Detection
  async function detectAndPromoteADR(content, title) {
    const isLikelyADR = /Architecture Decision Record|ADR|Decision:|Status:\s*(Accepted|Proposed)/i.test(content) || /adr/i.test(title);
    if (!isLikelyADR) return false;

    const prompt = `Is the following document an Architecture Decision Record (ADR)? 
Reply strictly in JSON format: {"isADR": boolean, "title": "Extract or clean the title of the decision", "tags": ["tag1", "tag2"]}

Document Title: ${title}
Content Snippet (first 1000 chars): ${content.slice(0, 1000)}`;

    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(responseText);
      
      if (json.isADR) {
         await decisionService.createDecision(user, integration.company_id, {
           title: json.title || title,
           content: content, // Save full content
           tags: json.tags || ['ADR', 'Engineering']
         });
         return true;
      }
    } catch(e) {
      console.error("ADR detection error:", e);
    }
    return false;
  }

  // Mark as running
  await supabase
    .from('sync_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id);

  try {
    const item = job.integration_items;

    // 1. Get the encrypted access token for this integration
    const { data: secret, error: secretError } = await supabase
      .from('integration_secrets')
      .select('encrypted_access_token')
      .eq('integration_id', integration.id)
      .single();

    if (secretError || !secret) throw new Error('Could not retrieve integration token');

    const token = decrypt(secret.encrypted_access_token);

    // 2. Fetch content from the provider
    const provider = getProviderInstance(integration.provider, token);
    const content = await provider.fetchContent(item.external_id);

    if (!content || content.trim().length === 0) {
      await log(job.id, `"${item.title}" has no readable content — skipping.`, 'warn');
      await supabase
        .from('sync_jobs')
        .update({ status: 'done', progress: 100, completed_at: new Date().toISOString() })
        .eq('id', job.id);
      return;
    }

    // 2.5 Engineering Wedge: ADR Auto-Detection
    // If the integration is GitHub (or Notion engineering spaces), scan for ADRs
    if (integration.provider === 'github') {
      const promoted = await detectAndPromoteADR(content, item.title);
      if (promoted) {
        await log(job.id, `Detected "${item.title}" as an ADR! Promoted to Decisions Log.`, 'info');
      }
    }

    // 3. Incremental sync — skip re-indexing if content hasn't changed
    const newHash = crypto.createHash('sha256').update(content).digest('hex');
    if (newHash === item.content_hash) {
      await log(job.id, `"${item.title}" content is unchanged — skipping re-index.`, 'info');
      await supabase
        .from('sync_jobs')
        .update({ status: 'done', progress: 100, completed_at: new Date().toISOString() })
        .eq('id', job.id);
      return;
    }

    // 4. Delete old Pinecone vectors before re-indexing to avoid stale duplicates
    if (item.pinecone_ids && item.pinecone_ids.length > 0) {
      try {
        const namespace = generateNamespace(user);
        await pineconeIndex.namespace(namespace).deleteMany(item.pinecone_ids);
        await log(job.id, `Deleted ${item.pinecone_ids.length} old vectors from Pinecone.`, 'info');
      } catch (deleteErr) {
        // Log but don't fail — old vectors will be overwritten anyway
        await log(job.id, `Warning: Could not delete old vectors: ${deleteErr.message}`, 'warn');
      }
    }

    // 5. Chunk content using LangChain (same settings as document ingestion)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const chunks = await splitter.createDocuments([content]);

    await log(job.id, `Split "${item.title}" into ${chunks.length} chunks.`, 'info');

    // 6. Prepare records with rich metadata for citations
    const namespace = generateNamespace(user);
    const now = new Date().toISOString();
    const vectorIds = [];

    const records = chunks.map((chunk, i) => {
      const id = `notion_${item.external_id}_chunk_${i}`;
      vectorIds.push(id);
      return {
        _id: id,
        text: chunk.pageContent,
        // Rich metadata matching the same schema as ingestionService.js
        provider: 'notion',
        sourceId: item.external_id || '',
        sourceTitle: item.title || '',
        sourceUrl: '',           // Notion URL not stored here; accessible via Notion directly
        author: 'Notion',
        createdAt: now,
        updatedAt: now,
        chunkIndex: i,
        totalChunks: chunks.length,
        // Legacy fields for backward compat
        filename: item.title || '',
        document_id: item.id || '',
        company_id: integration.company_id || '',
        workspace_id: user.workspace_id || ''
      };
    });

    // 7. Batch upsert to Pinecone (max 50 per batch for integrated embedding)
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await pineconeIndex.upsertRecords({ namespace, records: batch });

      // Update progress percentage
      const progress = Math.round(((i + batch.length) / records.length) * 100);
      await supabase
        .from('sync_jobs')
        .update({ progress })
        .eq('id', job.id);
    }

    // 8. Update integration_items with new hash and vector IDs
    await supabase
      .from('integration_items')
      .update({
        status: 'indexed',
        content_hash: newHash,
        pinecone_ids: vectorIds,
        last_synced_at: now
      })
      .eq('id', item.id);

    // 9. Mark job as done
    await supabase
      .from('sync_jobs')
      .update({ status: 'done', progress: 100, completed_at: now })
      .eq('id', job.id);

    await log(job.id, `Successfully indexed ${records.length} chunks from "${item.title}".`, 'info');

  } catch (err) {
    console.error(`processJob error for job ${job.id}:`, err);

    await supabase
      .from('sync_jobs')
      .update({ status: 'failed', error: err.message })
      .eq('id', job.id);

    // Update the item status too
    if (job.integration_items?.id) {
      await supabase
        .from('integration_items')
        .update({ status: 'failed' })
        .eq('id', job.integration_items.id);
    }

    await log(job.id, err.message, 'error');
  }
}

/**
 * Appends a message to the sync_logs table for a given job.
 * @param {string} jobId
 * @param {string} message
 * @param {'info'|'warn'|'error'} level
 */
async function log(jobId, message, level = 'info') {
  await supabase.from('sync_logs').insert({ job_id: jobId, message, level });
  console.log(`[syncService][${level.toUpperCase()}] ${message}`);
}

module.exports = { createSyncJob };
