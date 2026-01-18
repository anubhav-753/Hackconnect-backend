// models/notificationModel.js
const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "connection_request",
        "connection_accepted",
        "connection_rejected", // ✅ added
        "hackathon_alert",
      ],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;