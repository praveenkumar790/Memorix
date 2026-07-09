const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ragService = require('../services/ragService');
const { getCache, setCache, deleteCache } = require('../config/redis');

const validate = require('../middleware/validate');
const { chatSchema } = require('../utils/validationSchemas');
const createSlidingRateLimiter = require('../middleware/rateLimit');

const chatRateLimit = createSlidingRateLimiter('chat', 20, 60); // 20 requests per 60 minutes

router.post('/', authMiddleware, chatRateLimit, validate(chatSchema), async (req, res) => {
  const { message, chatId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  await ragService.handleChat(req.user, req.user.company_id, message, res, chatId);
});

// Edit a specific message and branch the conversation
router.post('/edit', authMiddleware, chatRateLimit, async (req, res) => {
  const { chatId, messageId, newText } = req.body;

  if (!chatId || !messageId || !newText) {
    return res.status(400).json({ error: 'chatId, messageId, and newText are required' });
  }

  try {
    const supabase = require('../config/supabase');

    // 1. Verify chat ownership & fetch target message
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const { data: targetMsg, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (msgError || !targetMsg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 2. Update message content in DB
    await supabase
      .from('messages')
      .update({ content: newText })
      .eq('id', messageId);

    // 3. Delete subsequent messages in DB (Branching)
    await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId)
      .gt('created_at', targetMsg.created_at);

    // 4. Rebuild Redis Hot Tail
    const { redis } = require('../config/redis');
    if (redis) {
      try {
        const cacheKey = `cache:chat:messages:${chatId}`;
        await redis.del(cacheKey); // Wipe the corrupted/old cache
        
        // Fetch up to 50 remaining messages to repopulate the Hot Tail properly
        const { data: remainingMsgs } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (remainingMsgs && remainingMsgs.length > 0) {
          // Push them back in reverse order (oldest first) so rpush works right
          const msgsToPush = remainingMsgs.reverse().map(m => JSON.stringify(m));
          await redis.rpush(cacheKey, ...msgsToPush);
        }
      } catch (redisErr) {
        console.error('Failed to rebuild Redis Hot Tail on edit:', redisErr);
      }
    }

    // 5. Setup SSE and trigger RAG
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pass the edited text to RAG and flag it to skip creating a duplicate User message DB row
    await ragService.handleChat(req.user, req.user.company_id, newText, res, chatId, { skipSaveUserMessage: true });

  } catch (err) {
    console.error('Error editing chat message:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Get all chats for the user (Paginated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Only cache the first page (default)
    const isCacheable = (page === 1 && limit === 20);
    const cacheKey = `cache:chats:list:workspace:${req.user.workspace_id}:user:${req.user.id}`;
    
    if (isCacheable) {
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);
    }

    const supabase = require('../config/supabase');
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    if (isCacheable) {
      await setCache(cacheKey, chats, 300); // 5 min TTL
    }
    
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific chat
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    // Verify chat ownership first
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const before = req.query.before;
    const limit = 20;

    // Hot Tail Cache: If no 'before' cursor, try to get from Redis List first
    if (!before) {
      try {
        const { redis } = require('../config/redis');
        const cachedMessages = await redis.lrange(`cache:chat:messages:${req.params.id}`, 0, 19);
        if (cachedMessages && cachedMessages.length > 0) {
          // Parse them, they are stored sequentially
          const parsed = cachedMessages.map(msg => JSON.parse(msg));
          // Usually we want them in chronological order
          // But check if they are stored oldest-first or newest-first.
          return res.json(parsed);
        }
      } catch (err) {
        console.error('Redis List error for messages:', err);
      }
    }

    // Fallback to Supabase, or if 'before' cursor provided
    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_id', req.params.id)
      .order('created_at', { ascending: false }) // Get newest first to apply limit
      .limit(limit);

    if (before) {
      // Find the created_at of the 'before' message
      const { data: beforeMsg } = await supabase.from('messages').select('created_at').eq('id', before).single();
      if (beforeMsg) {
        query = query.lt('created_at', beforeMsg.created_at);
      }
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific chat
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    // Verify chat ownership first
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Delete messages first to satisfy foreign key constraints
    await supabase.from('messages').delete().eq('chat_id', req.params.id);

    // Delete the chat itself
    const { error: deleteError } = await supabase
      .from('chats')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    // Invalidate chat list cache
    await deleteCache(`cache:chats:list:workspace:${req.user.workspace_id}:user:${req.user.id}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
