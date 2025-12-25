const { Schema, model, models } = require("mongoose");

const MessageSchema = new Schema(
  {
    // Direct reference to sender user
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    // Direct reference to receiver user
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    // Message content
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Message type (text, image, etc. for future extensions)
    messageType: {
      type: String,
      enum: ["text", "image", "file", "emoji"],
      default: "text",
    },
    // Image URL if messageType is 'image'
    imageUrl: {
      type: String,
      // optional, only for image messages
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    // Timestamp when message was read (if isRead is true)
    readAt: {
      type: Date,
      // optional
    },
    // For editing messages
    isEdited: {
      type: Boolean,
      default: false,
    },
    // Keep track of original message for edits
    editedAt: {
      type: Date,
      // optional
    },
    // Emoji reactions (future feature)
    reactions: [
      {
        emoji: String,
        userId: Schema.Types.ObjectId,
      },
    ],
    // For deleted messages (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for faster queries
MessageSchema.index({ fromUser: 1, toUser: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ isRead: 1 });

// Create and export model if it doesn't exist
module.exports = models.Message || model("Message", MessageSchema);
