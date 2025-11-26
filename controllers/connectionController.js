const asyncHandler = require("express-async-handler");
const Connection = require("../models/connectionModel");
const Notification = require("../models/notificationModel");

/**
 * @desc    Send a connection / follow request
 * @route   POST /api/connections/:id
 * @access  Private
 */
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  if (String(targetId) === String(req.user._id)) {
    res.status(400);
    throw new Error("You can't send a request to yourself");
  }

  const existing = await Connection.findOne({
    from: req.user._id,
    to: targetId,
  });

  if (existing) {
    res.status(400);
    throw new Error("Request already sent or connection already exists");
  }

  const connection = await Connection.create({
    from: req.user._id,
    to: targetId,
    status: "pending",
  });

  // Create notification for recipient
  await Notification.create({
    recipient: targetId,
    sender: req.user._id,
    type: "request-sent",
    message: `${req.user.name} sent you a follow request.`,
  });

  res.status(201).json({
    message: "Request sent successfully",
    connection,
  });
});

/**
 * @desc    Accept connection request
 * @route   PUT /api/connections/:id/accept
 * @access  Private
 */
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;

  const connection = await Connection.findOne({
    from: requesterId,
    to: req.user._id,
    status: "pending",
  });

  if (!connection) {
    res.status(404);
    throw new Error("No pending request found");
  }

  connection.status = "accepted";
  await connection.save();

  // Notify sender of acceptance
  await Notification.create({
    recipient: requesterId,
    sender: req.user._id,
    type: "request-accepted",
    message: `${req.user.name} accepted your request. You are now friends!`,
  });

  res.json({
    message: "Connection accepted successfully",
    connection,
  });
});

/**
 * @desc    Reject connection request
 * @route   PUT /api/connections/:id/reject
 * @access  Private
 */
const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;

  const connection = await Connection.findOne({
    from: requesterId,
    to: req.user._id,
    status: "pending",
  });

  if (!connection) {
    res.status(404);
    throw new Error("No pending request found");
  }

  connection.status = "rejected";
  await connection.save();

  res.json({ message: "Request rejected", connection });
});

/**
 * @desc    Get current user's connections list
 * @route   GET /api/connections
 * @access  Private
 */
const getConnections = asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const connections = await Connection.find({
    $or: [{ from: myId }, { to: myId }],
    status: "accepted",
  })
    .populate("from", "name avatar email")
    .populate("to", "name avatar email")
    .sort({ updatedAt: -1 });

  res.json(connections);
});

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections,
};