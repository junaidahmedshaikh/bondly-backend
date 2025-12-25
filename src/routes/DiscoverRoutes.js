const express = require("express");
const DiscoverRoutes = express.Router();
const { getDiscover } = require("../controllers/DiscoverController");
const { userAuth } = require("../middlewares/Auth");
console.log(userAuth);

DiscoverRoutes.get("/", userAuth, getDiscover);
module.exports = DiscoverRoutes;
