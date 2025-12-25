const express = require("express");
// const { sendConnectionRequest, getReceivedRequests, getSentRequests, respondToRequest } = require("../controllers/ConnectionController");
const { userAuth } = require("../middlewares/Auth");
const Connection = require("../models/ConnectionModel");
const User = require("../models/UserModel");
const UserModel = require("../models/UserModel");
const sendConnectionRequest = async (req, res) => {
  try {
    const user = req.body;
    console.log("User sending request:", user);
    const { status, toUserId } = req.params;

    // console.log(
    //   `${user?.name} Sending connection request with status: ${status} to user: ${toUserId}`
    // );
    if (status === "ignored") {
      res.status(200).json({ message: "Request ignored" });
    }
    if (status === "interested") {
      const connection = new Connection({
        fromUser: user._id,
        toUser: toUserId,
        status: status,
      });
      await connection.save();
      res.status(200).json({ message: "Connection request sent successfully" });
    }

    if (status === "accepted") {
      const existingConnection = await Connection.findOne({
        fromUser: toUserId,
        toUser: user._id,
        status: status,
      });
      res.status(200).json({ message: "Request accepted" });
    }
    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    console.log("Error in sending connection request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getReceivedRequests = async (req, res) => {
  try {
    const user = req.user;
    // console.log("User fetching received requests:", user);
    const allRequests = await Connection.find({ toUser: user._id }).populate(
      "fromUser",
      "name profileURL age location bio interests profileImages"
    );

    const filteredRequests = allRequests.filter(
      (req) => req.fromUser !== user._id
    );

    // Get all user details for each request
    const requestsWithUserDetails = await Promise.all(
      filteredRequests.map(async (request) => {
        const fromUserDetails = await UserModel.findById(
          request.fromUser
        ).populate("name age location bio interests profileImages");
        return {
          ...request.toObject(),
          fromUserDetails: fromUserDetails,
        };
      })
    );

    // console.log("Requests with user details:", requestsWithUserDetails);

    res.status(200).json({
      message: "Received connection requests fetched successfully",
      data: requestsWithUserDetails,
    });
  } catch (error) {
    console.log("Error in fetching received connection requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const user = req.user;
    const { requestId, action } = req.params;

    // console.log(
    //   `User ${user._id} responding to request ${requestId} with action: ${action}`
    // );

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connection.toUser.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (action === "accept") {
      connection.status = "accepted";
      await connection.save();
      res
        .status(200)
        .json({ message: "Request accepted successfully", data: connection });
    } else if (action === "reject") {
      connection.status = "rejected";
      await connection.save();
      res
        .status(200)
        .json({ message: "Request rejected successfully", data: connection });
    } else {
      res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.log("Error in responding to connection request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  sendConnectionRequest,
  getReceivedRequests,
  respondToRequest,
};
