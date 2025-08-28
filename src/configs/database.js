const mongoose = require("mongoose");
require("dotenv").config();

const database = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
};

module.exports = database;
