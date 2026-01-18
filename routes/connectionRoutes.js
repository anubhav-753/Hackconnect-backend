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

// Send a connection request
// POST /api/connections/request
router.post("/request", protect, sendConnectionRequest);

// Accept / reject requests (by connection id)
// PUT /api/connections/:id/accept
router.put("/:id/accept", protect, acceptConnectionRequest);

// PUT /api/connections/:id/reject
router.put("/:id/reject", protect, rejectConnectionRequest);

module.exports = router;