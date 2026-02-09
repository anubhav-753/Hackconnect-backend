const express = require("express");
const router = express.Router();
const {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  getPublicUserById,        // ✅ import new public controller
  updateUser,
  getRecommendedStudents,
  sendConnectionRequest,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

// ---------------- AUTH ---------------- //
router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/logout", logoutUser);

// ---------------- PROFILE ---------------- //
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// ---------------- RECOMMENDATIONS & CONNECTION REQUESTS ---------------- //
router.get("/recommendations", protect, getRecommendedStudents);
router.post("/:id/request", protect, sendConnectionRequest);
router.get("/requests", protect, getIncomingRequests);
router.post("/requests/:id/accept", protect, acceptRequest);
router.post("/requests/:id/reject", protect, rejectRequest);

// ---------------- PUBLIC PROFILE (NEW) ---------------- //
router.get("/public/:id", getPublicUserById);  // ✅ anyone can view profiles

// ---------------- ADMIN ONLY ---------------- //
router
  .route("/")
  .get(protect, getUsers);

router
  .route("/:id")
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;