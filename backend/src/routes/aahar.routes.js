const express = require('express');
const router = express.Router();
const aaharController = require('../controllers/aahar.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All AAHAR chat & history endpoints require valid Krushi authentication
router.post('/aahar/chat', authenticate, aaharController.chat);
router.get('/aahar/conversations', authenticate, aaharController.getConversations);
router.get('/aahar/conversations/:id', authenticate, aaharController.getConversation);
router.post('/aahar/conversations', authenticate, aaharController.createConversation);
router.post('/aahar/conversations/:id/clear', authenticate, aaharController.clearConversation);
router.delete('/aahar/conversations/:id', authenticate, aaharController.deleteConversation);
router.delete('/aahar/conversations', authenticate, aaharController.wipeConversations);

module.exports = router;
