const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const userAuth = async (req, res, next) => {
  const { token } = req.cookie;
  if (!token) return res.send.json({ message: "Invalide token" });

  //   verify token
  const encryptedClient = await jwt.verify(token, "00767");
  const { _id } = encryptedClient;
  const user = await UserModel.findById({ _id });
  req.user = user;
  next();
};
