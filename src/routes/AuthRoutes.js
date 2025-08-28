const express = require("express");
const { loginUser, signupUser } = require("../controllers/AuthController");
const AuthRoutes = express.Router();

AuthRoutes.post("/login", loginUser);

AuthRoutes.post("/signup", signupUser, async (req, res) => {
  const { token } = req.body;
  // console.log(token);
  res.send("token");
});
AuthRoutes.post("/logout", async (req, res) => {
  try {
    res.send("Logout");
  } catch (error) {
    console.log("Error: ", error.message);
  }
});
AuthRoutes.put("/forget", async (req, res) => {
  try {
    res.send("forget password");
  } catch (error) {
    console.log("Error: ", error.message);
  }
});

module.exports = AuthRoutes;
