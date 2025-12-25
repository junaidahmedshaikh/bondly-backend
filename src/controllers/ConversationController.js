const Conversation = require("../models/ConversationModel");
const Message = require("../models/MessageModel");
const User = require("../models/UserModel");

/**
 * Initiate or get existing conversation between two users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const initiateConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.params;

    // Validate input
    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    if (currentUserId.toString() === otherUserId) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    })
      .populate("participants", "name profileImages age location")
      .populate("lastMessageSender", "name");

    // If not, create new conversation
    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, otherUserId],
      });
      await conversation.save();
      
      // Populate after saving
      await conversation.populate("participants", "name profileImages age location");
    }

    console.log("Conversation initiated/retrieved:", conversation._id);
    
    return res.status(200).json({
      message: "Conversation initiated successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Error initiating conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all conversations for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all conversations for the user, sorted by latest message
    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: { $ne: userId }, // Exclude archived conversations
    })
      .populate("participants", "name profileImages age location emailId")
      .populate("lastMessageSender", "name")
      .sort({ updatedAt: -1 })
      .lean();

    // Format conversations and get other user details
    const formattedConversations = conversations.map((conversation) => {
      const otherUser = conversation.participants.find(
        (participant) => participant._id.toString() !== userId.toString()
      );

      return {
        _id: conversation._id,
        otherUser: otherUser,
        lastMessage: conversation.lastMessageText,
        lastMessageSender: conversation.lastMessageSender,
        lastMessageTime: conversation.updatedAt,
        unreadCount: conversation.unreadCount,
        isMuted: conversation.mutedBy.includes(userId),
        isBlocked: conversation.blockedBy.some((blocker) =>
          blocker.equals(otherUser._id)
        ),
      };
    });

    return res.status(200).json({
      message: "Conversations fetched successfully",
      data: formattedConversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get messages for a specific conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to access this conversation" });
    }

    // Fetch messages with pagination
    const skip = (page - 1) * limit;
    const messages = await Message.find({
      $or: [
        { fromUser: userId, toUser: { $in: conversation.participants } },
        { toUser: userId, fromUser: { $in: conversation.participants } },
      ],
      isDeleted: false,
    })
      .populate("fromUser", "name profileImages")
      .populate("toUser", "name profileImages")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        toUser: userId,
        fromUser: { $in: conversation.participants },
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      message: "Messages fetched successfully",
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Mark conversation as muted
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const muteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { mutedBy: userId } },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    return res.status(200).json({
      message: "Conversation muted successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Error muting conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Unm ute conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const unmuteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { mutedBy: userId } },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    return res.status(200).json({
      message: "Conversation unmuted successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Error unmuting conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Archive conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const archiveConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { archivedBy: userId } },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    return res.status(200).json({
      message: "Conversation archived successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  initiateConversation,
  getAllConversations,
  getConversationMessages,
  muteConversation,
  unmuteConversation,
  archiveConversation,
};
