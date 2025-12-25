// - Post /request/send/:status/:toUserId - Send a connection request
// - Get /request/received - Get received connection requests
// - Get /request/sent - Get sent connection requests
// - Post /request/respond/:requestId/:action - Respond to a connection request (accept/reject)

// Status: ignored, interested, accepted, rejected

const express = require("express");
const { userAuth } = require("../middlewares/Auth");
const {
  sendConnectionRequest,
  getReceivedRequests,
  respondToRequest,
} = require("../controllers/ConnectionController");
const ccrRouter = express.Router();

ccrRouter.post("/request/send/:status/:toUserId", sendConnectionRequest);

ccrRouter.get("/request/received", userAuth, getReceivedRequests);

ccrRouter.post(
  "/request/respond/:requestId/:action",
  userAuth,
  respondToRequest
);

module.exports = ccrRouter;
