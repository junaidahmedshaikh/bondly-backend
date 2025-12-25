const express = require("express");
const ProfileRoutes = express.Router();
const {
  getProfile,
  getUserById,
  updateProfile,
} = require("../controllers/ProfileController");
const { userAuth } = require("../middlewares/Auth");

ProfileRoutes.get("/", userAuth, getProfile);
ProfileRoutes.get("/:userId", userAuth, getUserById);
ProfileRoutes.put("/", userAuth, updateProfile);

module.exports = ProfileRoutes;
