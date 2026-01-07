const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const encryptedClient = await jwt.verify(token, process.env.JWT_SECRET || "000767");
    const { _id } = encryptedClient;

    const user = await UserModel.findById({ _id });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token. User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    } else {
      return res
        .status(500)
        .json({ message: "Internal server error during authentication." });
    }
  }
};

module.exports = { userAuth };
