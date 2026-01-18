// controllers/notificationController.js
const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

/**
 * @desc    Get notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "name avatar")
    .sort({ createdAt: -1 });

  res.json(notifications);
});

/**
 * @desc    Mark all notifications read
 * @route   PUT /api/notifications/mark-read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id },
    { $set: { isRead: true } } // ✅ correct field
  );
  res.json({ message: "Notifications marked as read" });
});

module.exports = { getUserNotifications, markAsRead };