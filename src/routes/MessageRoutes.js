const express = require("express");
const { userAuth } = require("../middlewares/Auth");
const {
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  addReaction,
  removeReaction,
} = require("../controllers/MessageController");

const MessageRoutes = express.Router();

/**
 * POST /message/send - Send a new message
 */
MessageRoutes.post("/send", userAuth, sendMessage);

/**
 * PUT /message/:messageId - Edit a message
 */
MessageRoutes.put("/:messageId", userAuth, editMessage);

/**
 * DELETE /message/:messageId - Delete a message
 */
MessageRoutes.delete("/:messageId", userAuth, deleteMessage);

/**
 * POST /message/:conversationId/mark-read - Mark messages as read
 */
MessageRoutes.post("/:conversationId/mark-read", userAuth, markAsRead);

/**
 * POST /message/:messageId/reaction/:emoji - Add reaction to message
 */
MessageRoutes.post("/:messageId/reaction", userAuth, addReaction);

/**
 * DELETE /message/:messageId/reaction/:emoji - Remove reaction from message
 */
MessageRoutes.delete("/:messageId/reaction/:emoji", userAuth, removeReaction);

module.exports = MessageRoutes;
