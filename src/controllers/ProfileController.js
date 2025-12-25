const UserModel = require("../models/UserModel");

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({ message: "Profile fetched successfully", user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await UserModel.findById(userId).select("-password -emailId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Fields that can be updated
    const allowedFields = [
      "name",
      "age",
      "location",
      "bio",
      "interests",
      "profileURL",
      "profileImages",
    ];
    const updates = {};

    // Only include allowed fields
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // Validate age if provided
    if (updates.age !== undefined && (updates.age < 18 || updates.age > 100)) {
      return res.status(400).json({
        message: "Age must be between 18 and 100",
      });
    }

    // Validate bio length if provided
    if (updates.bio !== undefined && updates.bio.length > 50) {
      return res.status(400).json({
        message: "Bio must be 50 characters or less",
      });
    }

    // Update user in database
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -emailId");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
};

module.exports = { getProfile, getUserById, updateProfile };
