const db = require('../db');
const { generateAgriculturalAdvice } = require('../services/gemini.service');
const { success, error } = require('../utils/response');

async function chat(req, res) {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return error(res, 'Message text is required', 400);
    }

    let activeConvId = conversationId;
    let conv = null;

    if (activeConvId) {
      conv = await db.getConversationWithMessages(activeConvId, userId);
    }

    const title = message.trim().slice(0, 34) + (message.trim().length > 34 ? '…' : '');

    if (!conv) {
      activeConvId = activeConvId || 'c_' + Date.now();
      conv = await db.createConversation(activeConvId, userId, title);
    }

    // 1. Save user message to database
    await db.saveMessage(activeConvId, 'user', message.trim());

    // 2. Fetch recent conversation history for Gemini context
    const currentConv = await db.getConversationWithMessages(activeConvId, userId);
    const history = (currentConv && currentConv.messages) || [];

    // 3. Call Gemini with agricultural profile context
    const answer = await generateAgriculturalAdvice({
      message: message.trim(),
      profile: req.profile,
      history: history.slice(0, -1) // exclude the just-added user message from history array since message is passed separately
    });

    // 4. Save AI response to database
    await db.saveMessage(activeConvId, 'ai', answer);

    return success(res, {
      conversationId: activeConvId,
      title: (conv && conv.title) || title,
      answer,
      message: {
        role: 'ai',
        text: answer
      }
    });
  } catch (err) {
    console.error('[AAHAR Chat Controller Error]:', err);
    return error(res, 'Failed to process agricultural advice query', 500);
  }
}

async function getConversations(req, res) {
  try {
    const convos = await db.getConversations(req.user.id);
    return success(res, convos);
  } catch (err) {
    console.error('[AAHAR GetConversations Error]:', err);
    return error(res, 'Failed to fetch conversations', 500);
  }
}

async function getConversation(req, res) {
  try {
    const { id } = req.params;
    const conv = await db.getConversationWithMessages(id, req.user.id);
    if (!conv) {
      return error(res, 'Conversation not found', 404);
    }
    return success(res, conv);
  } catch (err) {
    console.error('[AAHAR GetConversation Error]:', err);
    return error(res, 'Failed to fetch conversation', 500);
  }
}

async function createConversation(req, res) {
  try {
    const { title } = req.body;
    const id = 'c_' + Date.now();
    const conv = await db.createConversation(id, req.user.id, title || 'New conversation');
    return success(res, conv, 201);
  } catch (err) {
    console.error('[AAHAR CreateConversation Error]:', err);
    return error(res, 'Failed to create conversation', 500);
  }
}

async function clearConversation(req, res) {
  try {
    const { id } = req.params;
    await db.clearConversationMessages(id, req.user.id);
    return success(res, { message: 'Conversation cleared' });
  } catch (err) {
    console.error('[AAHAR ClearConversation Error]:', err);
    return error(res, 'Failed to clear conversation', 500);
  }
}

async function deleteConversation(req, res) {
  try {
    const { id } = req.params;
    await db.deleteConversation(id, req.user.id);
    return success(res, { message: 'Conversation deleted' });
  } catch (err) {
    console.error('[AAHAR DeleteConversation Error]:', err);
    return error(res, 'Failed to delete conversation', 500);
  }
}

async function wipeConversations(req, res) {
  try {
    await db.wipeConversations(req.user.id);
    return success(res, { message: 'All conversations wiped' });
  } catch (err) {
    console.error('[AAHAR WipeConversations Error]:', err);
    return error(res, 'Failed to wipe conversations', 500);
  }
}

module.exports = {
  chat,
  getConversations,
  getConversation,
  createConversation,
  clearConversation,
  deleteConversation,
  wipeConversations
};
