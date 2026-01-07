const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required!" });
    }

    // Find user by email only
    const user = await UserModel.findOne({ emailId: emailId });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const token = await user.signJWT();

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({ message: "Login successful", user });
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const signupUser = async (req, res, next) => {
  try {
    const userData = req.body;

    if (!userData) {
      return res.status(400).json({ message: "Please fill the details" });
    }

    const existingUser = await UserModel.findOne({ emailId: userData.emailId });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email!" });
    }

    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Build image URLs from uploaded files
    const profileImages =
      req.files?.map((file) => `/uploads/${file.filename}`) || [];

    let interests = [];
    if (userData.interests) {
      try {
        interests =
          typeof userData.interests === "string"
            ? JSON.parse(userData.interests)
            : userData.interests;
      } catch (error) {
        console.error("Error parsing interests:", error);
        interests = [];
      }
    }
    // console.log("interests: ", interests);

    const user = new UserModel({
      name: userData?.name,
      age: userData?.age,
      emailId: userData?.email,
      password: hashedPassword,
      location: userData?.location || null,
      bio: userData?.bio || null,
      interests: interests || null,
      profileURL: userData?.profileURL,
      profileImages: profileImages,
    });

    await user.save();

    const token = await user.signJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(201).json({ message: "User added successfully!", user });
    // next();
  } catch (error) {
    console.log("Error: ", error.message);

    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        message: `A user with this ${field} already exists. Please try another one.`,
        error: "DUPLICATE_KEY",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({
        message: `Validation error: ${messages}`,
        error: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  // Update user profile
};

const logoutUser = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyToken = async (req, res) => {
  try {
    // This endpoint requires the Auth middleware
    // If the token is valid and the user exists, we'll have req.user
    const user = req.user;
    res.json({ message: "Token is valid", user });
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { loginUser, signupUser, updateUser, logoutUser, verifyToken };
