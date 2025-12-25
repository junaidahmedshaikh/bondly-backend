const UserModel = require("../models/UserModel");
const mongoose = require("mongoose");

const getDiscover = async (req, res) => {
  try {
    const user = req.user;

    const users = await UserModel.find(
      { _id: { $ne: user._id } },
      {
        _id: 1,
        name: 1,
        profileURL: 1,
        age: 1,
        location: 1,
        bio: 1,
        interests: 1,
        profileImages: 1,
      }
    );

    res.json({
      message: "Discover fetched successfully",
      users: users,
    });
  } catch (error) {
    console.error("Error fetching discover users:", error);
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};

module.exports = { getDiscover };
