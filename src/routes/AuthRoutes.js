const express = require("express");
const { loginUser, signupUser, logoutUser, verifyToken } = require("../controllers/AuthController");
const { userAuth } = require("../middlewares/Auth");
const upload = require("../configs/multer");
const AuthRoutes = express.Router();

AuthRoutes.post("/login", loginUser);

AuthRoutes.post("/signup", upload.array("photos", 5), signupUser);

AuthRoutes.post("/logout", logoutUser);

AuthRoutes.get("/verify-token", userAuth, verifyToken);

AuthRoutes.put("/forget", async (req, res) => {
  try {
    res.send("forget password");
  } catch (error) {
    console.log("Error: ", error.message);
  }
});

module.exports = AuthRoutes;
