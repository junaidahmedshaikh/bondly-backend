const { Schema, model } = require("mongoose");

const ConnectionSchema = new Schema({
  fromUser: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  toUser: {
    type: Schema.Types.ObjectId,
    // ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["ignored", "interested", "accepted", "rejected"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("ConnectionModel", ConnectionSchema);
