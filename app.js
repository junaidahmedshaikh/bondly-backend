require("dotenv").config();
const express = require("express");
const database = require("./src/configs/database");
const PORT = process.env.PORT || 5000;
const AuthRoutes = require("./src/routes/AuthRoutes");
const DiscoverRoutes = require("./src/routes/DiscoverRoutes");
const ccrRouter = require("./src/routes/CRRRoutes");
const ConversationRoutes = require("./src/routes/ConversationRoutes");
const MessageRoutes = require("./src/routes/MessageRoutes");
const ProfileRoutes = require("./src/routes/ProfileRoutes");
const DashboardRoutes = require("./src/routes/DashboardRoutes");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();
const cors = require("cors");
const socketio = require("socket.io");
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});
// Routes
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Make io accessible in routes
app.set("io", io);

app.use("/", AuthRoutes);
app.use("/discover", DiscoverRoutes);
app.use("/", ccrRouter);
app.use("/conversation", ConversationRoutes);
app.use("/message", MessageRoutes);
app.use("/profile", ProfileRoutes);
app.use("/dashboard", DashboardRoutes);

// socket io connection
io.on("connection", (socket) => {
  console.log("New client connected: ", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);
  });
});
// Database Connection
database()
  .then(async () => {
    httpServer.listen(PORT, async () => {
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
