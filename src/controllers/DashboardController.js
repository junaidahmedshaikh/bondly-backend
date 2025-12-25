const ConnectionModel = require("../models/ConnectionModel");
const MessageModel = require("../models/MessageModel");
const ConversationModel = require("../models/ConversationModel");
const UserModel = require("../models/UserModel");

/**
 * Calculate percentage growth between two periods
 */
const calculateGrowth = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }
  const growth = ((current - previous) / previous) * 100;
  return growth >= 0 ? `+${growth.toFixed(0)}%` : `${growth.toFixed(0)}%`;
};

/**
 * Format time ago string
 */
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
};

/**
 * Get dashboard data for authenticated user
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const mongoose = require("mongoose");

    // Convert userId to ObjectId if it's a string
    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // console.log("Fetching dashboard for user:", userIdObj);

    // Parallel execution of all aggregations
    const [
      profileViewsStats,
      matchesStats,
      messagesStats,
      likesStats,
      recentMatches,
      recentActivity,
      unreadMessagesCount,
    ] = await Promise.all([
      // 1. Profile Views (using connections as proxy - unique users who interacted)
      Promise.all([
        // Current period (last 7 days)
        ConnectionModel.distinct("fromUser", {
          toUser: userIdObj,
          createdAt: { $gte: sevenDaysAgo },
        }),
        // Previous period (7-14 days ago)
        ConnectionModel.distinct("fromUser", {
          toUser: userIdObj,
          createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        }),
        // Total all time
        ConnectionModel.distinct("fromUser", {
          toUser: userIdObj,
        }),
      ]).then(([currentViews, previousViews, totalViews]) => ({
        current: currentViews.length,
        previous: previousViews.length,
        total: totalViews.length,
      })),

      // 2. Matches (mutual accepted connections)
      Promise.all([
        // Current period matches
        ConnectionModel.aggregate([
          {
            $match: {
              $or: [
                {
                  fromUser: userIdObj,
                  status: "accepted",
                  createdAt: { $gte: sevenDaysAgo },
                },
                {
                  toUser: userIdObj,
                  status: "accepted",
                  createdAt: { $gte: sevenDaysAgo },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "connectionmodels",
              let: {
                fromUser: "$fromUser",
                toUser: "$toUser",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$fromUser", "$$toUser"] },
                        { $eq: ["$toUser", "$$fromUser"] },
                        { $eq: ["$status", "accepted"] },
                      ],
                    },
                  },
                },
              ],
              as: "mutual",
            },
          },
          {
            $match: {
              mutual: { $ne: [] },
            },
          },
          {
            $count: "count",
          },
        ]),
        // Previous period matches
        ConnectionModel.aggregate([
          {
            $match: {
              $or: [
                {
                  fromUser: userIdObj,
                  status: "accepted",
                  createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
                },
                {
                  toUser: userIdObj,
                  status: "accepted",
                  createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "connectionmodels",
              let: {
                fromUser: "$fromUser",
                toUser: "$toUser",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$fromUser", "$$toUser"] },
                        { $eq: ["$toUser", "$$fromUser"] },
                        { $eq: ["$status", "accepted"] },
                      ],
                    },
                  },
                },
              ],
              as: "mutual",
            },
          },
          {
            $match: {
              mutual: { $ne: [] },
            },
          },
          {
            $count: "count",
          },
        ]),
        // Total matches
        ConnectionModel.aggregate([
          {
            $match: {
              $or: [
                { fromUser: userIdObj, status: "accepted" },
                { toUser: userIdObj, status: "accepted" },
              ],
            },
          },
          {
            $lookup: {
              from: "connectionmodels",
              let: {
                fromUser: "$fromUser",
                toUser: "$toUser",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$fromUser", "$$toUser"] },
                        { $eq: ["$toUser", "$$fromUser"] },
                        { $eq: ["$status", "accepted"] },
                      ],
                    },
                  },
                },
              ],
              as: "mutual",
            },
          },
          {
            $match: {
              mutual: { $ne: [] },
            },
          },
          {
            $count: "count",
          },
        ]),
      ]).then(([current, previous, total]) => ({
        current: current[0]?.count || 0,
        previous: previous[0]?.count || 0,
        total: total[0]?.count || 0,
      })),

      // 3. Messages
      Promise.all([
        // Current period
        MessageModel.countDocuments({
          toUser: userIdObj,
          createdAt: { $gte: sevenDaysAgo },
          isDeleted: { $ne: true },
        }),
        // Previous period
        MessageModel.countDocuments({
          toUser: userIdObj,
          createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
          isDeleted: { $ne: true },
        }),
        // Total
        MessageModel.countDocuments({
          toUser: userIdObj,
          isDeleted: { $ne: true },
        }),
      ]).then(([current, previous, total]) => ({
        current,
        previous,
        total,
      })),

      // 4. Likes Received (interested status connections)
      Promise.all([
        // Current period
        ConnectionModel.countDocuments({
          toUser: userIdObj,
          status: "interested",
          createdAt: { $gte: sevenDaysAgo },
        }),
        // Previous period
        ConnectionModel.countDocuments({
          toUser: userIdObj,
          status: "interested",
          createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        }),
        // Total
        ConnectionModel.countDocuments({
          toUser: userIdObj,
          status: "interested",
        }),
      ]).then(([current, previous, total]) => ({
        current,
        previous,
        total,
      })),

      // 5. Recent Matches (last 3 matches with user details)
      // A match is when both users have "interested" or "accepted" status with each other
      ConnectionModel.aggregate([
        {
          $match: {
            $or: [
              {
                fromUser: userIdObj,
                status: { $in: ["interested", "accepted"] },
              },
              {
                toUser: userIdObj,
                status: { $in: ["interested", "accepted"] },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "connectionmodels",
            let: {
              fromUser: "$fromUser",
              toUser: "$toUser",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$fromUser", "$$toUser"] },
                      { $eq: ["$toUser", "$$fromUser"] },
                      { $in: ["$status", ["interested", "accepted"]] },
                    ],
                  },
                },
              },
            ],
            as: "mutual",
          },
        },
        {
          $match: {
            mutual: { $ne: [] },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 3,
        },
        {
          $project: {
            otherUserId: {
              $cond: [
                { $eq: ["$fromUser", userIdObj] },
                "$toUser",
                "$fromUser",
              ],
            },
            createdAt: 1,
          },
        },
        {
          $lookup: {
            from: "usermodels",
            localField: "otherUserId",
            foreignField: "_id",
            as: "otherUser",
          },
        },
        {
          $unwind: "$otherUser",
        },
        {
          $project: {
            _id: "$otherUser._id",
            name: "$otherUser.name",
            age: "$otherUser.age",
            location: "$otherUser.location",
            profileImages: "$otherUser.profileImages",
            profileURL: "$otherUser.profileURL",
            createdAt: 1,
          },
        },
      ]),

      // 6. Recent Activity
      Promise.all([
        // Recent matches
        ConnectionModel.aggregate([
          {
            $match: {
              $or: [
                {
                  fromUser: userIdObj,
                  status: "accepted",
                  createdAt: { $gte: sevenDaysAgo },
                },
                {
                  toUser: userIdObj,
                  status: "accepted",
                  createdAt: { $gte: sevenDaysAgo },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "connectionmodels",
              let: {
                fromUser: "$fromUser",
                toUser: "$toUser",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$fromUser", "$$toUser"] },
                        { $eq: ["$toUser", "$$fromUser"] },
                        { $eq: ["$status", "accepted"] },
                      ],
                    },
                  },
                },
              ],
              as: "mutual",
            },
          },
          {
            $match: {
              mutual: { $ne: [] },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 5,
          },
          {
            $lookup: {
              from: "usermodels",
              localField: "fromUser",
              foreignField: "_id",
              as: "fromUserData",
            },
          },
          {
            $lookup: {
              from: "usermodels",
              localField: "toUser",
              foreignField: "_id",
              as: "toUserData",
            },
          },
          {
            $project: {
              type: "match",
              otherUserName: {
                $cond: [
                  { $eq: ["$fromUser", userIdObj] },
                  { $arrayElemAt: ["$toUserData.name", 0] },
                  { $arrayElemAt: ["$fromUserData.name", 0] },
                ],
              },
              createdAt: 1,
            },
          },
        ]),
        // Recent likes
        ConnectionModel.aggregate([
          {
            $match: {
              toUser: userId,
              status: "interested",
              createdAt: { $gte: sevenDaysAgo },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 5,
          },
          {
            $lookup: {
              from: "usermodels",
              localField: "fromUser",
              foreignField: "_id",
              as: "fromUserData",
            },
          },
          {
            $project: {
              type: "like",
              otherUserName: { $arrayElemAt: ["$fromUserData.name", 0] },
              createdAt: 1,
            },
          },
        ]),
        // Recent messages
        MessageModel.aggregate([
          {
            $match: {
              toUser: userIdObj,
              createdAt: { $gte: sevenDaysAgo },
              isDeleted: { $ne: true },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $group: {
              _id: "$fromUser",
              latestMessage: { $first: "$$ROOT" },
            },
          },
          {
            $limit: 5,
          },
          {
            $lookup: {
              from: "usermodels",
              localField: "latestMessage.fromUser",
              foreignField: "_id",
              as: "fromUserData",
            },
          },
          {
            $project: {
              type: "message",
              otherUserName: { $arrayElemAt: ["$fromUserData.name", 0] },
              createdAt: "$latestMessage.createdAt",
            },
          },
        ]),
      ]).then(([matches, likes, messages]) => {
        const allActivities = [
          ...matches.map((m) => ({
            type: "match",
            message: `You matched with ${m.otherUserName}`,
            createdAt: m.createdAt,
          })),
          ...likes.map((l) => ({
            type: "like",
            message: `${l.otherUserName} liked your profile`,
            createdAt: l.createdAt,
          })),
          ...messages.map((m) => ({
            type: "message",
            message: `New message from ${m.otherUserName}`,
            createdAt: m.createdAt,
          })),
        ];
        return allActivities
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4)
          .map((activity) => ({
            type: activity.type,
            message: activity.message,
            time: formatTimeAgo(activity.createdAt),
            createdAt: activity.createdAt,
          }));
      }),

      // 7. Unread Messages Count
      MessageModel.countDocuments({
        toUser: userIdObj,
        isRead: false,
        isDeleted: { $ne: true },
      }),
    ]);

    // Calculate new matches (matches created in last 7 days)
    const newMatchesCount = matchesStats.current;

    // Format stats with growth percentages
    const stats = [
      {
        label: "Profile Views",
        value: profileViewsStats.total.toString(),
        change: calculateGrowth(
          profileViewsStats.current,
          profileViewsStats.previous
        ),
      },
      {
        label: "Matches",
        value: matchesStats.total.toString(),
        change: calculateGrowth(matchesStats.current, matchesStats.previous),
      },
      {
        label: "Messages",
        value: messagesStats.total.toString(),
        change: calculateGrowth(messagesStats.current, messagesStats.previous),
      },
      {
        label: "Likes Received",
        value: likesStats.total.toString(),
        change: calculateGrowth(likesStats.current, likesStats.previous),
      },
    ];

    // Format recent matches with compatibility (mock for now, can be enhanced)
    const formattedRecentMatches = recentMatches.map((match) => ({
      id: match._id.toString(),
      name: match.name,
      age: match.age,
      location: match.location || "Not specified",
      avatar:
        match.profileImages?.[0] ||
        match.profileURL ||
        "/diverse-user-avatars.png",
      compatibility: Math.floor(Math.random() * 15) + 85, // 85-100% for demo
      _id: match._id.toString(),
    }));

    // Log results for debugging
    // console.log("Dashboard stats:", {
    //   profileViews: profileViewsStats.total,
    //   matches: matchesStats.total,
    //   messages: messagesStats.total,
    //   likes: likesStats.total,
    //   recentMatchesCount: recentMatches.length,
    //   recentActivityCount: recentActivity.length,
    // });

    // Response structure matching UI needs
    res.json({
      message: "Dashboard data fetched successfully",
      data: {
        welcome: {
          name: req.user.name,
          newMatches: newMatchesCount,
          unreadMessages: unreadMessagesCount,
        },
        stats,
        recentMatches: formattedRecentMatches,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

module.exports = { getDashboard };
