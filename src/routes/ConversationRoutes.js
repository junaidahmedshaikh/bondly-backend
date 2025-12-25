const express = require("express");
const { userAuth } = require("../middlewares/Auth");
const {
  initiateConversation,
  getAllConversations,
  getConversationMessages,
  muteConversation,
  unmuteConversation,
  archiveConversation,
} = require("../controllers/ConversationController");

const ConversationRoutes = express.Router();

/**
 * GET /conversation/all - Get all conversations for current user
 */
ConversationRoutes.get("/all", userAuth, getAllConversations);

/**
 * POST /conversation/initiate/:otherUserId - Initiate or get existing conversation
 */
ConversationRoutes.post("/initiate/:otherUserId", userAuth, initiateConversation);

/**
 * GET /conversation/:conversationId/messages - Get messages for a conversation
 */
ConversationRoutes.get(
  "/:conversationId/messages",
  userAuth,
  getConversationMessages
);

/**
 * POST /conversation/:conversationId/mute - Mute a conversation
 */
ConversationRoutes.post(
  "/:conversationId/mute",
  userAuth,
  muteConversation
);

/**
 * POST /conversation/:conversationId/unmute - Unmute a conversation
 */
ConversationRoutes.post(
  "/:conversationId/unmute",
  userAuth,
  unmuteConversation
);

/**
 * POST /conversation/:conversationId/archive - Archive a conversation
 */
ConversationRoutes.post(
  "/:conversationId/archive",
  userAuth,
  archiveConversation
);

module.exports = ConversationRoutes;
