const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections,
} = require("../controllers/connectionController");

// Get all accepted connections for logged in user
router.get("/", protect, getConnections);

// Send, accept, reject requests
router.post("/:id", protect, sendConnectionRequest);
router.put("/:id/accept", protect, acceptConnectionRequest);
router.put("/:id/reject", protect, rejectConnectionRequest);

module.exports = router;