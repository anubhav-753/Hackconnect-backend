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
  getRecommendedStudents,// now correctly exists in controller
} = require('../controllers/userController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

router.route('/register').post(registerUser);
router.route('/').get(protect, admin, getUsers);

router.post('/logout', logoutUser);
router.post('/login', authUser);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router
  .route('/recommendations').get(protect, getRecommendedStudents);

router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;