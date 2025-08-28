require("dotenv").config();
const express = require("express");
const database = require("./src/configs/database");
const PORT = process.env.PORT || 5000;
const AuthRoutes = require("./src/routes/AuthRoutes");
const cookieParser = require("cookie-parser");
const app = express();

// Routes
app.use(express.json());
app.use(cookieParser());
app.use("/", AuthRoutes);
// Database Connection
database()
  .then(async () => {
    app.listen(PORT, async () => {
      try {
        console.log("Database Establish | ", PORT);
      } catch (error) {
        console.log("Database: ", error.message);
      }
    });
  })
  .catch((error) => {
    console.log("Database not connect");
  });
