const { Schema, default: mongoose } = require("mongoose");
const jwt = require("jsonwebtoken");
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      min: 8,
    },
    location: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      required: true,
      max: 50,
    },
    interests: {
      type: [String],
    },
    profileURL: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.signJWT = function (req, res) {
  const token = jwt.sign({ _id: this._id }, "000767");
  return token;
};
module.exports = mongoose.model("UserModel", UserSchema);
