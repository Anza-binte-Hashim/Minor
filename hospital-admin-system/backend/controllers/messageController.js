/**
 * Message Controller
 * Handles messaging and conversation functionality
 * ACCURATE & PRODUCTION-READY
 */

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// ============ CONVERSATION MANAGEMENT ============

/**
 * Get all conversations for user
 * GET /api/messages/conversations
 */
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user. id;
        const { page = 1, limit = 10 } = req.query;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Get conversations for user
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'name username email role')
            .populate({
                path: 'lastMessage',
                select: 'message createdAt'
            })
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            . limit(limitNum);

        // Get total count
        const total = await Conversation.countDocuments({
            participants: userId
        });

        res.json({
            success: true,
            message: 'Conversations retrieved successfully',
            data: conversations,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
                hasNextPage: skip + limitNum < total,
                hasPrevPage: pageNum > 1
            }
        });

        console. log(`✓ Retrieved ${conversations.length} conversations for user ${userId}`);
    } catch (error) {
        console. error('Get conversations error:', error);
        res.status(500). json({
            success: false,
            message: 'Failed to retrieve conversations',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get conversation with specific user/doctor
 * GET /api/messages/conversations/:userId
 */
exports.getConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Validate user ID format
        if (!userId. match(/^[0-9a-fA-F]{24}$/)) {
            return res. status(400).json({
                success: false,
                message: 'Invalid user ID format',
                code: 'INVALID_USER_ID'
            });
        }

        // Verify other user exists
        const otherUserExists = await User.exists({ _id: userId });
        if (!otherUserExists) {
            return res.status(404). json({
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, userId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [currentUserId, userId]
            });
            await conversation. save();
        }

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
        const skip = (pageNum - 1) * limitNum;

        // Get messages
        const messages = await Message.find({
            conversationId: conversation._id
        })
            .select('senderId recipientId message isRead createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Reverse to show in chronological order
        messages.reverse();

        // Get total count
        const total = await Message.countDocuments({
            conversationId: conversation._id
        });

        res.json({
            success: true,
            message: 'Conversation retrieved successfully',
            data: {
                conversationId: conversation._id,
                participants: conversation.participants,
                messages: messages,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });

        console.log(`✓ Retrieved conversation between ${currentUserId} and ${userId}`);
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve conversation',
            code: 'FETCH_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============ MESSAGE MANAGEMENT ============

/**
 * Send message
 * POST /api/messages/send
 */
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { recipientId, message } = req. body;

        // Validate inputs
        if (!recipientId || !message) {
            return res.status(400).json({
                success: false,
                message: 'Recipient ID and message are required',
                code: 'MISSING_FIELDS'
            });
        }

        // Validate recipient ID format
        if (!recipientId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recipient ID format',
                code: 'INVALID_RECIPIENT_ID'
            });
        }

        // Validate message
        const trimmedMessage = message.trim();
        if (trimmedMessage.length === 0 || trimmedMessage.length > 2000) {
            return res. status(400).json({
                success: false,
                message: 'Message must be between 1 and 2000 characters',
                code: 'INVALID_MESSAGE'
            });
        }

        // Prevent self-messaging
        if (senderId === recipientId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send message to yourself',
                code: 'SELF_MESSAGE'
            });
        }

        // Verify recipient exists
        const recipient = await User.exists({ _id: recipientId });
        if (!recipient) {
            return res.status(404). json({
                success: false,
                message: 'Recipient not found',
                code: 'RECIPIENT_NOT_FOUND'
            });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId]
            });
            await conversation.save();
        }

        // Create and save message
        const newMessage = new Message({
            conversationId: conversation._id,
            senderId,
            recipientId,
            message: trimmedMessage,
            isRead: false
        });

        await newMessage.save();

        // Update conversation's last message
        conversation.lastMessage = newMessage._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: newMessage._id,
                conversationId: conversation._id,
                message: newMessage.message,
                sentAt: newMessage.createdAt
            }
        });

        console.log(`✓ Message sent from ${senderId} to ${recipientId}`);
    } catch (error) {
        console.error('Send message error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors). map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to send message',
            code: 'SEND_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Mark message as read
 * PUT /api/messages/:messageId/read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { messageId } = req. params;
        const userId = req.user.id;

        // Validate message ID format
        if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID format',
                code: 'INVALID_MESSAGE_ID'
            });
        }

        // Find message
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
                code: 'NOT_FOUND'
            });
        }

        // Verify user is the recipient
        if (message.recipientId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only mark your own messages as read',
                code: 'FORBIDDEN'
            });
        }

        // Mark as read
        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        res. json({
            success: true,
            message: 'Message marked as read',
            data: {
                messageId: message._id,
                isRead: message.isRead,
                readAt: message.readAt
            }
        });

        console.log(`✓ Message ${messageId} marked as read`);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark message as read',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Mark entire conversation as read
 * PUT /api/messages/conversations/:conversationId/read
 */
exports.markConversationAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Validate conversation ID format
        if (!conversationId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid conversation ID format',
                code: 'INVALID_CONVERSATION_ID'
            });
        }

        // Find conversation
        const conversation = await Conversation. findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
                code: 'NOT_FOUND'
            });
        }

        // Verify user is participant
        if (! conversation.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation',
                code: 'FORBIDDEN'
            });
        }

        // Mark all unread messages as read
        const result = await Message.updateMany(
            {
                conversationId,
                recipientId: userId,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        res.json({
            success: true,
            message: 'Conversation marked as read',
            data: {
                conversationId,
                messagesMarkedAsRead: result.modifiedCount
            }
        });

        console.log(`✓ Conversation ${conversationId} marked as read (${result.modifiedCount} messages)`);
    } catch (error) {
        console.error('Mark conversation as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark conversation as read',
            code: 'UPDATE_ERROR',
            error: process.env.NODE_ENV === 'development' ? error. message : undefined
        });
    }
};

/**
 * Delete message
 * DELETE /api/messages/:messageId
 */
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Validate message ID format
        if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID format',
                code: 'INVALID_MESSAGE_ID'
            });
        }

        // Find message
        const message = await Message.findById(messageId);

        if (! message) {
            return res. status(404).json({
                success: false,
                message: 'Message not found',
                code: 'NOT_FOUND'
            });
        }

        // Verify user is the sender
        if (message.senderId.toString() !== userId) {
            return res.status(403). json({
                success: false,
                message: 'You can only delete your own messages',
                code: 'FORBIDDEN'
            });
        }

        // Delete message
        await Message.findByIdAndDelete(messageId);

        res.json({
            success: true,
            message: 'Message deleted successfully',
            data: {
                messageId
            }
        });

        console.log(`✓ Message ${messageId} deleted`);
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            code: 'DELETE_ERROR',
            error: process.env.NODE_ENV === 'development' ?  error.message : undefined
        });
    }
};