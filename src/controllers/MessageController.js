const Message = require("../models/MessageModel");
const Conversation = require("../models/ConversationModel");

/**
 * Send a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { conversationId, content, messageType = "text" } = req.body;

    // Validate input
    if (!conversationId || !content || content.trim().length === 0) {
      return res.status(400).json({
        message: "conversationId and content are required",
      });
    }

    // Get conversation and validate
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to send message in this conversation" });
    }

    // Get receiver (other participant)
    const receiverId = conversation.participants.find(
      (id) => id.toString() !== senderId.toString()
    );

    // Create new message
    const message = new Message({
      fromUser: senderId,
      toUser: receiverId,
      content: content.trim(),
      messageType,
    });

    await message.save();

    // Populate sender info
    await message.populate("fromUser", "name profileImages");

    // Update conversation with last message
    conversation.lastMessage = message._id;
    conversation.lastMessageText = content.substring(0, 100); // Store first 100 chars
    conversation.lastMessageSender = senderId;
    await conversation.save();

    // console.log("Message sent:", message._id);

    return res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Edit a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const editMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify ownership
    if (message.fromUser.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this message" });
    }

    // Check if message is too old (can't edit after 15 minutes)
    const messageAge = Date.now() - message.createdAt;
    const fifteenMinutes = 15 * 60 * 1000;

    if (messageAge > fifteenMinutes) {
      return res
        .status(400)
        .json({ message: "Cannot edit message older than 15 minutes" });
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate("fromUser", "name profileImages");

    console.log("Message edited:", messageId);

    return res.status(200).json({
      message: "Message edited successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error editing message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete a message (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify ownership
    if (message.fromUser.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this message" });
    }

    // Soft delete
    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();

    // console.log("Message deleted:", messageId);

    return res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Mark messages as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // Update all unread messages in conversation
    const result = await Message.updateMany(
      {
        toUser: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // console.log("Marked messages as read:", result.modifiedCount);

    return res.status(200).json({
      message: "Messages marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Add reaction to message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addReaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    // Validate input
    if (!emoji || emoji.trim().length === 0) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (reaction) =>
        reaction.emoji === emoji &&
        reaction.userId.toString() === userId.toString()
    );

    if (existingReaction) {
      return res
        .status(400)
        .json({ message: "You already reacted with this emoji" });
    }

    // Add reaction
    message.reactions.push({
      emoji,
      userId,
    });

    await message.save();

    console.log("Reaction added to message:", messageId);

    return res.status(200).json({
      message: "Reaction added successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Remove reaction from message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeReaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId, emoji } = req.params;

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Remove reaction
    message.reactions = message.reactions.filter(
      (reaction) =>
        !(
          reaction.emoji === emoji &&
          reaction.userId.toString() === userId.toString()
        )
    );

    await message.save();

    console.log("Reaction removed from message:", messageId);

    return res.status(200).json({
      message: "Reaction removed successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  addReaction,
  removeReaction,
};
