/**
 * Messaging Routes
 * ACCURATE & PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

// All messaging routes require authentication
router.use(verifyToken);

/**
 * Conversation Management
 */
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:doctorId', messageController.getConversation);
router.put('/conversations/:conversationId/read', messageController.markAsRead);

/**
 * Message Management
 */
router.post('/send', messageController.sendMessage);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;