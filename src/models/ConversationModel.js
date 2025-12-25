const { Schema, model, models } = require("mongoose");

const ConversationSchema = new Schema(
  {
    // Participants in the conversation
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
        required: true,
      },
    ],

    // Last message in the conversation
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    // Last message text (denormalized for quick display)
    lastMessageText: {
      type: String,
    },

    // User who sent the last message
    lastMessageSender: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
    },

    // Unread message count
    unreadCount: {
      user1: {
        type: Number,
        default: 0,
      },
      user2: {
        type: Number,
        default: 0,
      },
    },

    // Muted status for notifications
    mutedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],

    // Blocked status
    blockedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],

    // Whether conversation is archived
    archivedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
      },
    ],

    // Custom conversation name (futuqre feature)
    conversationName: {
      type: String,
    },

    // Conversation avatar (future feature)
    conversationAvatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Create and export model if it doesn't exist
module.exports =
  models.Conversation || model("Conversation", ConversationSchema);
