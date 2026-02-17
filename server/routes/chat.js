const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ragService = require('../services/ragService');

const validate = require('../middleware/validate');
const { chatSchema } = require('../utils/validationSchemas');

router.post('/', authMiddleware, validate(chatSchema), async (req, res) => {
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

// Get all chats for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('company_id', req.user.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
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

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
