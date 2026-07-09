const express = require('express');
const router = express.Router();
const axios = require('axios');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { NotionProvider } = require('../services/providers/notionProvider');
const { SlackProvider } = require('../services/providers/slackProvider');
const { ConfluenceProvider } = require('../services/providers/confluenceProvider');
const { GitHubProvider } = require('../services/providers/githubProvider');
const { withTokenRefresh } = require('../utils/withTokenRefresh');

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
const { createSyncJob } = require('../services/syncService');

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

const CONFLUENCE_CLIENT_ID = process.env.CONFLUENCE_CLIENT_ID;
const CONFLUENCE_CLIENT_SECRET = process.env.CONFLUENCE_CLIENT_SECRET;

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Dynamically construct all redirect URIs using the BACKEND_URL env var
// This ensures they automatically switch between localhost and production without code changes
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const NOTION_REDIRECT_URI = `${BACKEND_URL}/api/integrations/notion/callback`;
const SLACK_REDIRECT_URI = `${BACKEND_URL}/api/integrations/slack/callback`;
const CONFLUENCE_REDIRECT_URI = `${BACKEND_URL}/api/integrations/confluence/callback`;
const GITHUB_REDIRECT_URI = `${BACKEND_URL}/api/integrations/github/callback`;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations
// List all connected integrations for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cacheKey = `cache:integrations:list:user:${req.user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const { data, error } = await supabase
      .from('integrations')
      .select('id, provider, workspace_name, status, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    await setCache(cacheKey, data || [], 60);
    res.json(data || []);
  } catch (err) {
    console.error('GET /integrations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/notion/connect
// Redirects the browser to Notion's OAuth authorization page.
// NOTE: Cannot use authMiddleware here — browser redirects don't send headers.
// The frontend passes userId as a query param, which becomes the OAuth `state`.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/notion/connect', (req, res) => {
  if (!NOTION_CLIENT_ID) {
    return res.status(500).json({ error: 'NOTION_CLIENT_ID not configured in server .env' });
  }

  // userId comes from the frontend (read from Supabase session before redirecting)
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId query param is required' });
  }

  const notionAuthUrl =
    `https://api.notion.com/v1/oauth/authorize` +
    `?client_id=${encodeURIComponent(NOTION_CLIENT_ID)}` +
    `&response_type=code` +
    `&owner=user` +
    `&redirect_uri=${encodeURIComponent(NOTION_REDIRECT_URI)}` +
    `&state=${encodeURIComponent(userId)}`;

  res.redirect(notionAuthUrl);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/notion/callback
// Handles the OAuth callback from Notion after user grants access.
// Exchanges the code for tokens, encrypts them, stores in DB.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/notion/callback', async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query;

  // Handle user denial
  if (oauthError) {
    console.error('Notion OAuth denied:', oauthError);
    return res.redirect(`${CLIENT_URL}/integrations?error=access_denied`);
  }

  if (!code || !userId) {
    return res.redirect(`${CLIENT_URL}/integrations?error=invalid_callback`);
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://api.notion.com/v1/oauth/token',
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: NOTION_REDIRECT_URI
      },
      {
        auth: {
          username: NOTION_CLIENT_ID,
          password: NOTION_CLIENT_SECRET
        },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const { access_token, workspace_id, workspace_name } = tokenResponse.data;

    // 2. Get the user's company_id and workspace_id from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, workspace_id')
      .eq('id', userId)
      .single();

    // 3. Upsert the integration row (allows reconnecting the same workspace)
    let integration;
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'notion')
      .eq('external_workspace_id', workspace_id)
      .maybeSingle();

    if (existing) {
      // Already connected — just update status and timestamp
      const { data: updated, error: updateErr } = await supabase
        .from('integrations')
        .update({ status: 'active', workspace_name: workspace_name || 'Notion Workspace', updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      integration = updated;
    } else {
      // New connection — insert fresh row
      const { data: inserted, error: insertErr } = await supabase
        .from('integrations')
        .insert({
          user_id: userId,
          company_id: profile?.company_id || null,
          workspace_id: profile?.workspace_id || null,
          provider: 'notion',
          external_workspace_id: workspace_id,
          workspace_name: workspace_name || 'Notion Workspace',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      integration = inserted;
    }

    // 4. Store the encrypted token in integration_secrets (separate table)
    await supabase
      .from('integration_secrets')
      .upsert(
        {
          integration_id: integration.id,
          encrypted_access_token: encrypt(access_token),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'integration_id' }
      );

    // 5. Invalidate the integrations list cache
    await deleteCache(`cache:integrations:list:user:${userId}`);

    // 6. Redirect back to frontend with success flag
    res.redirect(`${CLIENT_URL}/integrations?connected=notion`);

  } catch (err) {
    console.error('Notion OAuth callback error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}/integrations?error=oauth_failed`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/slack/connect
// ─────────────────────────────────────────────────────────────────────────────
router.get('/slack/connect', (req, res) => {
  if (!SLACK_CLIENT_ID) return res.status(500).json({ error: 'SLACK_CLIENT_ID missing' });
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const scopes = 'channels:history,channels:read,groups:history,groups:read';
  const url = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=${scopes}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${userId}`;
  res.redirect(url);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/slack/callback
// ─────────────────────────────────────────────────────────────────────────────
router.get('/slack/callback', async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query;
  if (oauthError) return res.redirect(`${CLIENT_URL}/integrations?error=access_denied`);
  if (!code || !userId) return res.redirect(`${CLIENT_URL}/integrations?error=invalid_callback`);

  try {
    const tokenRes = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: { client_id: SLACK_CLIENT_ID, client_secret: SLACK_CLIENT_SECRET, code, redirect_uri: SLACK_REDIRECT_URI }
    });

    if (!tokenRes.data.ok) throw new Error(tokenRes.data.error);

    const token = tokenRes.data.authed_user.access_token;
    const teamId = tokenRes.data.team.id;
    const teamName = tokenRes.data.team.name;

    const { data: profile } = await supabase.from('profiles').select('company_id, workspace_id').eq('id', userId).single();

    let integration;
    const { data: existing } = await supabase.from('integrations').select('id').eq('user_id', userId).eq('provider', 'slack').eq('external_workspace_id', teamId).maybeSingle();

    if (existing) {
      const { data: updated } = await supabase.from('integrations').update({ status: 'active', workspace_name: teamName, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
      integration = updated;
    } else {
      const { data: inserted } = await supabase.from('integrations').insert({ user_id: userId, company_id: profile?.company_id, workspace_id: profile?.workspace_id, provider: 'slack', external_workspace_id: teamId, workspace_name: teamName, status: 'active', updated_at: new Date().toISOString() }).select().single();
      integration = inserted;
    }

    const encryptedToken = encrypt(token);
    await supabase.from('integration_secrets').upsert({ integration_id: integration.id, encrypted_access_token: encryptedToken }, { onConflict: 'integration_id' });

    await deleteCache(`cache:integrations:list:user:${userId}`);
    res.redirect(`${CLIENT_URL}/integrations?success=true&provider=slack`);
  } catch (err) {
    console.error('Slack OAuth error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}/integrations?error=server_error`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/confluence/connect
// ─────────────────────────────────────────────────────────────────────────────
router.get('/confluence/connect', (req, res) => {
  if (!CONFLUENCE_CLIENT_ID) return res.status(500).json({ error: 'CONFLUENCE_CLIENT_ID missing' });
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const scopes = 'read:confluence-space.summary read:page:confluence offline_access';
  const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${CONFLUENCE_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(CONFLUENCE_REDIRECT_URI)}&state=${userId}&response_type=code&prompt=consent`;
  res.redirect(url);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/confluence/callback
// ─────────────────────────────────────────────────────────────────────────────
router.get('/confluence/callback', async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query;
  if (oauthError) return res.redirect(`${CLIENT_URL}/integrations?error=access_denied`);
  if (!code || !userId) return res.redirect(`${CLIENT_URL}/integrations?error=invalid_callback`);

  try {
    const tokenRes = await axios.post('https://auth.atlassian.com/oauth/token', {
      grant_type: 'authorization_code', client_id: CONFLUENCE_CLIENT_ID, client_secret: CONFLUENCE_CLIENT_SECRET, code, redirect_uri: CONFLUENCE_REDIRECT_URI
    }, { headers: { 'Content-Type': 'application/json' } });

    const token = tokenRes.data.access_token;
    
    // Fetch cloud resources to get the site name (workspace_name)
    const resourceRes = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', { headers: { Authorization: `Bearer ${token}` } });
    const confluenceResource = resourceRes.data.find(r => r.scopes.some(s => s.includes('confluence')));
    if (!confluenceResource && resourceRes.data.length === 0) throw new Error('No Atlassian resources found');
    
    const cloudId = confluenceResource ? confluenceResource.id : resourceRes.data[0].id;
    const siteName = confluenceResource ? confluenceResource.name : resourceRes.data[0].name;

    const { data: profile } = await supabase.from('profiles').select('company_id, workspace_id').eq('id', userId).single();

    let integration;
    const { data: existing } = await supabase.from('integrations').select('id').eq('user_id', userId).eq('provider', 'confluence').eq('external_workspace_id', cloudId).maybeSingle();

    if (existing) {
      const { data: updated } = await supabase.from('integrations').update({ status: 'active', workspace_name: siteName, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
      integration = updated;
    } else {
      const { data: inserted } = await supabase.from('integrations').insert({ user_id: userId, company_id: profile?.company_id, workspace_id: profile?.workspace_id, provider: 'confluence', external_workspace_id: cloudId, workspace_name: siteName, status: 'active', updated_at: new Date().toISOString() }).select().single();
      integration = inserted;
    }

    const encryptedToken = encrypt(token);
    await supabase.from('integration_secrets').upsert({ integration_id: integration.id, encrypted_access_token: encryptedToken }, { onConflict: 'integration_id' });

    await deleteCache(`cache:integrations:list:user:${userId}`);
    res.redirect(`${CLIENT_URL}/integrations?success=true&provider=confluence`);
  } catch (err) {
    console.error('Confluence OAuth error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}/integrations?error=server_error`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/github/connect
// Redirects to GitHub OAuth authorization page.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/github/connect', (req, res) => {
  if (!GITHUB_CLIENT_ID) return res.status(500).json({ error: 'GITHUB_CLIENT_ID missing in server .env' });
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // repo scope: read access to code, commit statuses, invitations, collaborators,
  // deployment statuses, and public repository topics
  const scopes = 'repo read:user';
  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(GITHUB_CLIENT_ID)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}` +
    `&state=${encodeURIComponent(userId)}`;

  res.redirect(url);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/github/callback
// Exchanges OAuth code for token, encrypts and stores it.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/github/callback', async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query;
  if (oauthError) return res.redirect(`${CLIENT_URL}/integrations?error=access_denied`);
  if (!code || !userId) return res.redirect(`${CLIENT_URL}/integrations?error=invalid_callback`);

  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI
      },
      { headers: { Accept: 'application/json' } }
    );

    if (tokenRes.data.error) {
      throw new Error(`GitHub token error: ${tokenRes.data.error_description || tokenRes.data.error}`);
    }

    const token = tokenRes.data.access_token;

    // 2. Fetch GitHub user info to get a meaningful workspace_name
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });

    const githubLogin = userRes.data.login;
    const githubId = String(userRes.data.id);
    const displayName = userRes.data.name || githubLogin;

    // 3. Fetch user's company_id and workspace_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, workspace_id')
      .eq('id', userId)
      .single();

    // 4. Upsert integration row (safe to reconnect same GitHub account)
    let integration;
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'github')
      .eq('external_workspace_id', githubId)
      .maybeSingle();

    if (existing) {
      const { data: updated } = await supabase
        .from('integrations')
        .update({ status: 'active', workspace_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      integration = updated;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('integrations')
        .insert({
          user_id: userId,
          company_id: profile?.company_id || null,
          workspace_id: profile?.workspace_id || null,
          provider: 'github',
          external_workspace_id: githubId,
          workspace_name: displayName,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      integration = inserted;
    }

    // 5. Encrypt and store the token
    const encryptedToken = encrypt(token);
    await supabase
      .from('integration_secrets')
      .upsert(
        { integration_id: integration.id, encrypted_access_token: encryptedToken, updated_at: new Date().toISOString() },
        { onConflict: 'integration_id' }
      );

    // 6. Invalidate integrations cache
    await deleteCache(`cache:integrations:list:user:${userId}`);

    // 7. Redirect back to frontend
    res.redirect(`${CLIENT_URL}/integrations?connected=github`);

  } catch (err) {
    console.error('GitHub OAuth callback error:', err.response?.data || err.message);
    res.redirect(`${CLIENT_URL}/integrations?error=oauth_failed`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/:id/items
// Browse pages / channels available in the connected provider workspace.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/items', authMiddleware, async (req, res) => {
  try {
    // Verify integration belongs to this user
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (intError || !integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const cacheKey = `cache:integration:items:${req.params.id}`;
    const cachedItems = await getCache(cacheKey);
    if (cachedItems) {
      return res.json(cachedItems);
    }

    // Get encrypted token
    const { data: secret, error: secretError } = await supabase
      .from('integration_secrets')
      .select('encrypted_access_token')
      .eq('integration_id', integration.id)
      .single();

    if (secretError || !secret) {
      return res.status(400).json({ error: 'Integration token not found. Please reconnect.' });
    }

    const token = decrypt(secret.encrypted_access_token);
    const provider = getProviderInstance(integration.provider, token);

    // Use withTokenRefresh to handle expired/revoked tokens gracefully
    const items = await withTokenRefresh(integration, () => provider.listItems());
    
    await setCache(cacheKey, items, 900); // 15 mins

    res.json(items);
  } catch (err) {
    console.error('GET /integrations/:id/items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/integrations/:id/sync
// Creates sync jobs for the selected items and starts background processing.
// Returns immediately with job IDs — frontend polls /jobs/:jobId for status.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/sync', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items selected for sync' });
    }

    // Verify integration belongs to this user
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (intError || !integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Queue sync jobs and kick off background processing
    const jobIds = await createSyncJob(integration, items, req.user);

    res.json({
      message: `${jobIds.length} sync job(s) queued successfully.`,
      jobIds
    });
  } catch (err) {
    console.error('POST /integrations/:id/sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/jobs/:jobId
// Poll the status of a sync job. Frontend calls this every 2 seconds.
// Returns: { id, status, progress, error, started_at, completed_at }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/jobs/:jobId', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('id, status, progress, error, started_at, completed_at, created_at')
      .eq('id', req.params.jobId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('GET /integrations/jobs/:jobId error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/integrations/:id
// Disconnects an integration. Cascades to integration_secrets and items.
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id); // Security: can only delete own integrations

    if (error) throw error;

    await deleteCache(`cache:integrations:list:user:${req.user.id}`);

    res.json({ message: 'Integration disconnected successfully.' });
  } catch (err) {
    console.error('DELETE /integrations/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
