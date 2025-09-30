const express = require('express');
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
  updateUser,
  getRecommendedStudents,
  sendConnectionRequest,
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// ---------------- AUTH ---------------- //
router.post('/register', registerUser);          // Register a user
router.post('/login', authUser);                 // Login user
router.post('/logout', logoutUser);              // Logout user

// ---------------- PROFILE ---------------- //
router
  .route('/profile')
  .get(protect, getUserProfile)                  // Get logged-in user's profile
  .put(protect, updateUserProfile);              // Update logged-in user's profile

// ---------------- RECOMMENDATIONS & CONNECTION REQUESTS ---------------- //
// ⚠️ Must come BEFORE `/:id` dynamic route
router.get('/recommendations', protect, getRecommendedStudents);       // Get recommended students
router.post('/:id/request', protect, sendConnectionRequest);           // Send connection request
router.get('/requests', protect, getIncomingRequests);                 // Get incoming requests
router.post('/requests/:id/accept', protect, acceptRequest);           // Accept connection request
router.post('/requests/:id/reject', protect, rejectRequest);           // Reject connection request

// ---------------- ADMIN ONLY ---------------- //
// Keep these at the bottom so they don’t catch /recommendations accidentally
router.route('/')
  .get(protect, admin, getUsers);                // Admin: get all users

router.route('/:id')
  .delete(protect, admin, deleteUser)            // Admin: delete user by ID
  .get(protect, admin, getUserById)              // Admin: get user by ID
  .put(protect, admin, updateUser);              // Admin: update user by ID

module.exports = router;