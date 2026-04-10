const express = require("express");
const router  = express.Router();

const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} = require("../controllers/message.controller");

const { protect } = require("../middleware/auth.middleware");

/**
 * @route   GET /api/v1/messages/conversations
 * @desc    Get all conversations with last message and unread count
 * @access  Protected
 */
router.get("/conversations", protect, getConversations);

/**
 * @route   GET /api/v1/messages/:conversationId
 * @desc    Get paginated messages in a conversation
 * @access  Protected
 */
router.get("/:conversationId", protect, getMessages);

/**
 * @route   POST /api/v1/messages
 * @desc    Send a new message (also emits via Socket.io)
 * @access  Protected
 */
router.post("/", protect, sendMessage);

/**
 * @route   PUT /api/v1/messages/:conversationId/read
 * @desc    Mark all messages in a conversation as read
 * @access  Protected
 */
router.put("/:conversationId/read", protect, markAsRead);

module.exports = router;
