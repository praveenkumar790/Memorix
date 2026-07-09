const fs = require('fs');
const pdf = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { pineconeIndex } = require('../config/pinecone');
// Gemini embedding model is no longer needed - using Pinecone's integrated embedding
// const { embeddingModel } = require('../config/gemini');
const supabase = require('../config/supabase');
const { generateNamespace } = require('../utils/namespace');
const { deleteCache } = require('../config/redis');
const { classifyDocument } = require('./classificationService');

const ingestionService = {
  async processFile(file, user, companyId) {
    let documentId = null;
    let storagePath = null;

    try {
      // 1. Upload file to Supabase Storage (for persistence/download)
      // Storage path structure: {workspaceId}/{filename}
      const fileBuffer = fs.readFileSync(file.path);
      storagePath = `${user.workspace_id}/${file.filename}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('memorix') // Storage bucket name
        .upload(storagePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (storageError) throw new Error(`Storage Upload Error: ${storageError.message}`);

      // 2. Create Document Record in DB (Status: Processing)
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          company_id: companyId,
          storage_path: storagePath,
          filename: file.originalname,
          file_type: file.mimetype,
          status: 'processing',
          workspace_id: user.workspace_id  // Store workspace_id
        })
        .select()
        .single();

      if (docError) throw new Error(`DB Insert Error: ${docError.message}`);
      documentId = docData.id;

      // 3a. Extract Text (moved up — needed before classification)
      let text = '';
      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdf(fileBuffer);
        text = pdfData.text;
      } else {
        text = fs.readFileSync(file.path, 'utf8');
      }

      // 3b. Classify document type and technologies via Gemini (single cheap call)
      // Fails silently — never blocks ingestion
      const classification = await classifyDocument(text);
      console.log(`[ingestionService] Classified "${file.originalname}" as: ${classification.doc_type}, techs: [${classification.technologies.join(', ')}]`);

      // 3c. Persist classification back to the document record
      await supabase
        .from('documents')
        .update({
          doc_type: classification.doc_type,
          technologies: classification.technologies
        })
        .eq('id', documentId);

      // 3d. Engineering Wedge: ADR Auto-Detection
      if (classification.doc_type === 'adr') {
         const decisionService = require('./decisionService');
         try {
           await decisionService.createDecision(user, companyId, {
             title: file.originalname.replace(/\.[^/.]+$/, ""), // strip extension
             content: text,
             tags: ['ADR', 'Auto-Detected', ...classification.technologies]
           });
           console.log(`[ingestionService] Auto-promoted ${file.originalname} to an organizational decision.`);
         } catch(e) {
           console.error("[ingestionService] Failed to auto-promote ADR:", e);
         }
      }

      // 4. Chunk Text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await splitter.createDocuments([text]);

      // 5. Prepare Records for Pinecone Integrated Embedding
      // Pinecone will automatically generate embeddings using llama-text-embed-v2
      const records = [];
      const now = new Date().toISOString();

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        records.push({
          _id: `${documentId}_${i}`,        // Use _id for integrated embedding
          text: chunk.pageContent,           // This field maps to the embedding model (configured in Pinecone)
          // --- Rich metadata for citations, filtering, and clean deletion ---
          provider: 'document',              // 'document' | 'notion' | 'slack' | 'confluence'
          sourceId: documentId,              // DB record ID — enables clean vector deletion by doc
          sourceTitle: file.originalname,    // Human-readable name shown in citations
          sourceUrl: storagePath,            // Supabase storage path (for download links)
          author: user.full_name || user.email || 'Unknown',
          createdAt: now,
          updatedAt: now,
          chunkIndex: i,                     // Which chunk within the document
          totalChunks: chunks.length,        // Total chunks — useful for debugging coverage
          // --- Classification metadata ---
          doc_type: classification.doc_type || 'general',
          technologies: classification.technologies.join(','),
          // --- Kept for backward compatibility ---
          filename: file.originalname,
          document_id: documentId,
          company_id: companyId,
          workspace_id: user.workspace_id,
          page_number: chunk.metadata.loc?.lines?.from || 0
        });
      }

      // 6. Store in Pinecone (Namespaced) using Integrated Embedding
      // Pinecone will automatically generate embeddings from the 'text' field
      // Namespace format: ns-{companyName}-{role}
      const namespace = generateNamespace(user);
      
      // Batch Upsert (Max batch size for integrated embedding is ~96)
      const batchSize = 50;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await pineconeIndex.upsertRecords({
          namespace: namespace,
          records: batch
        });
        console.log(`Upserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(records.length / batchSize)}`);
      }

      // 7. Update DB Status
      await supabase
        .from('documents')
        .update({ status: 'indexed' })
        .eq('id', documentId);

      // Invalidate dashboard caches
      await deleteCache(`cache:dashboard:stats:workspace:${user.workspace_id}`);
      await deleteCache(`cache:dashboard:activity:workspace:${user.workspace_id}`);

      // Cleanup local file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return { documentId, chunks: records.length, status: 'indexed' };

    } catch (error) {
      console.error("Ingestion Error:", error);
      
      // Cleanup on failure
      if (documentId) {
        console.log(`Cleaning up failed document record: ${documentId}`);
        await supabase.from('documents').delete().eq('id', documentId);
      }
      
      if (storagePath) {
        console.log(`Cleaning up failed storage file: ${storagePath}`);
        await supabase.storage.from('memorix').remove([storagePath]);
      }

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      throw error;
    }
  }
};

module.exports = ingestionService;
