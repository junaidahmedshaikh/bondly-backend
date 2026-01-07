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
      // required: true,
      max: 50,
    },
    interests: {
      type: [String],
    },
    profileURL: {
      type: String,
      // required: true,
    },
    profileImages: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Method to sign JWT
UserSchema.methods.signJWT = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET || "000767");
  return token;
};

// Method to convert user to JSON without password
UserSchema.methods.toJSON = function () {
  const userObject = this?.toObject();
  delete userObject?.password;
  return userObject;
};

module.exports = mongoose.model("UserModel", UserSchema);
