const asyncHandler = require("express-async-handler");
const Connection = require("../models/connectionModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

/**
 * @desc Send a connection request and notify recipient
 * @route POST /api/connections/request
 */
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user._id;

  if (!recipientId) {
    res.status(400);
    throw new Error("recipientId is required");
  }

  if (senderId.toString() === recipientId) {
    res.status(400);
    throw new Error("You cannot send a request to yourself");
  }

  // Check if connection already exists
  const existingConnection = await Connection.findOne({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
    ],
  });

  if (existingConnection) {
    res.status(400);
    throw new Error(
      "Connection request already exists or you are already connected"
    );
  }

  // Create the connection record
  const connection = await Connection.create({
    sender: senderId,
    recipient: recipientId,
    status: "pending",
  });

  // Create database notification
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: "connection_request",
    message: `${req.user.name} sent you a friend request.`,
  });

  // Trigger real-time Socket.IO notification (if socketio is configured)
  const io = req.app.get("socketio");
  if (io) {
    io.to(recipientId.toString()).emit("newNotification", {
      _id: notification._id,
      type: "connection_request",
      message: notification.message,
      senderName: req.user.name,
      createdAt: notification.createdAt,
    });
  }

  res.status(201).json({
    message: "Connection request sent successfully",
    connection,
  });
});

/**
 * @desc Accept a connection request
 * @route PUT /api/connections/:id/accept
 */
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);

  if (
    !connection ||
    connection.recipient.toString() !== req.user._id.toString()
  ) {
    res.status(404);
    throw new Error("Request not found or unauthorized");
  }

  connection.status = "accepted";
  await connection.save();

  // Notify the sender that the request was accepted
  const io = req.app.get("socketio");
  const notification = await Notification.create({
    recipient: connection.sender,
    sender: req.user._id,
    type: "connection_accepted",
    message: `${req.user.name} accepted your friend request.`,
  });

  if (io) {
    io.to(connection.sender.toString()).emit("newNotification", {
      type: "connection_accepted",
      message: notification.message,
    });
  }

  res.json({ message: "Connection request accepted" });
});

/**
 * @desc Reject a connection request
 * @route PUT /api/connections/:id/reject
 */
const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await Connection.findById(req.params.id);

  if (
    !connection ||
    connection.recipient.toString() !== req.user._id.toString()
  ) {
    res.status(404);
    throw new Error("Request not found or unauthorized");
  }

  connection.status = "rejected";
  await connection.save();

  // Notify the sender that the request was rejected
  const io = req.app.get("socketio");
  const notification = await Notification.create({
    recipient: connection.sender,
    sender: req.user._id,
    type: "connection_rejected",
    message: `${req.user.name} rejected your friend request.`,
  });

  if (io) {
    io.to(connection.sender.toString()).emit("newNotification", {
      type: "connection_rejected",
      message: notification.message,
    });
  }

  res.json({ message: "Connection request rejected" });
});

/**
 * @desc Get all accepted connections for the logged in user
 * @route GET /api/connections
 */
const getConnections = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all accepted connections where the current user is either sender or recipient
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .populate("sender", "name email avatar")
    .populate("recipient", "name email avatar");

  // Optionally map to "other user" for convenience
  const formatted = connections.map((conn) => {
    const isSender = conn.sender._id.toString() === userId.toString();
    const otherUser = isSender ? conn.recipient : conn.sender;

    return {
      _id: conn._id,
      user: otherUser,
      status: conn.status,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
    };
  });

  res.json(formatted);
});

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections,
};