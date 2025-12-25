const express = require("express");
const DashboardRoutes = express.Router();
const { getDashboard } = require("../controllers/DashboardController");
const { userAuth } = require("../middlewares/Auth");

DashboardRoutes.get("/", userAuth, getDashboard);

module.exports = DashboardRoutes;

