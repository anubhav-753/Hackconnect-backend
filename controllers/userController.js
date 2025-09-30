const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../utils/generatetoken");

// ------------------------------------------------------------
// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
// ------------------------------------------------------------
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      status: user.status,
      bio: user.bio,
      avatar: user.avatar,
      achievements: user.achievements,
      skills: user.skills,
      college: user.college,
      state: user.state,
      branch: user.branch,
      socialLinks: user.socialLinks,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// ------------------------------------------------------------
// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
// ------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      status: user.status,
      bio: user.bio,
      avatar: user.avatar,
      achievements: user.achievements,
      skills: user.skills,
      college: user.college,
      state: user.state,
      branch: user.branch,
      socialLinks: user.socialLinks,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// ------------------------------------------------------------
// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
// ------------------------------------------------------------
const logoutUser = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ------------------------------------------------------------
// @desc    Get logged-in user's profile
// @route   GET /api/users/profile
// @access  Private
// ------------------------------------------------------------
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// ------------------------------------------------------------
// @desc    Update logged-in user's profile
// @route   PUT /api/users/profile
// @access  Private
// ------------------------------------------------------------
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.status = req.body.status || user.status;
    user.bio = req.body.bio || user.bio;
    if (req.body.avatar) user.avatar = req.body.avatar;
    user.achievements = req.body.achievements || user.achievements;
    user.college = req.body.college ? req.body.college.trim() : user.college;
user.state = req.body.state ? req.body.state.trim() : user.state;
user.branch = req.body.branch ? req.body.branch.trim() : user.branch;
if (Array.isArray(req.body.skills)) {
  user.skills = req.body.skills.map((s) => s.trim());
}
    if (Array.isArray(req.body.skills)) user.skills = req.body.skills;
    user.college = req.body.college || user.college;
    user.state = req.body.state || user.state;
    user.branch = req.body.branch || user.branch;

    if (req.body.socialLinks) {
      user.socialLinks = {
        linkedin: req.body.socialLinks.linkedin || user.socialLinks.linkedin,
        github: req.body.socialLinks.github || user.socialLinks.github,
        portfolio: req.body.socialLinks.portfolio || user.socialLinks.portfolio,
      };
    }

    if (req.body.password && req.body.password.trim() !== "") {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// ------------------------------------------------------------
// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
// ------------------------------------------------------------
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// ------------------------------------------------------------
// @desc    Delete user by ID (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
// ------------------------------------------------------------
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.deleteOne();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// ------------------------------------------------------------
// @desc    Get user by ID (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
// ------------------------------------------------------------
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// ------------------------------------------------------------
// @desc    Update user by ID (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
// ------------------------------------------------------------
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin ?? user.isAdmin;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
// ------------------------------------------------------------
// @desc    Get recommended students with filters (+ exclude IDs)
// @route   GET /api/users/recommendations
// @access  Private
// ------------------------------------------------------------
// ------------------------------------------------------------
// @desc    Get recommended students with robust filters (+ exclude IDs)
// @route   GET /api/users/recommendations
// @access  Private
// ------------------------------------------------------------
const mongoose = require("mongoose");

const getRecommendedStudents = asyncHandler(async (req, res) => {
  let { college, state, branch, skills, excludeIds } = req.query;

  // Parse excludeIds -> always array of ObjectIds
  let excluded = [];
  if (excludeIds) {
    try {
      if (typeof excludeIds === "string") {
        excluded = excludeIds.split(",").map((id) => mongoose.Types.ObjectId(id.trim()));
      } else if (Array.isArray(excludeIds)) {
        excluded = excludeIds.map((id) => mongoose.Types.ObjectId(id));
      }
    } catch (err) {
      console.warn("Invalid excludeIds format", err.message);
    }
  }

  // Always exclude current user + optional excluded list
  let query = { _id: { $nin: [req.user._id, ...excluded] } };

  // College filter (ignore "Any")
  if (college && college.trim() && !/^any/i.test(college)) {
    query.college = { $regex: `^\\s*${college.trim()}\\s*$`, $options: "i" };
  }

  // State filter
  if (state && state.trim() && !/^any/i.test(state)) {
    query.state = { $regex: `^\\s*${state.trim()}\\s*$`, $options: "i" };
  }

  // Branch filter
  if (branch && branch.trim() && !/^any/i.test(branch)) {
    query.branch = { $regex: `^\\s*${branch.trim()}\\s*$`, $options: "i" };
  }

  // Skills filter (allow multiple, case-insensitive, trimmed)
  if (skills) {
    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (skillsArray.length > 0) {
      query.skills = {
        $in: skillsArray.map((s) => new RegExp(`^\\s*${s}\\s*$`, "i")),
      };
    }
  }

  const users = await User.find(query).select("-password -isAdmin");
  res.json(users);
});
// ------------------------------------------------------------
// @desc    Send connection request
// @route   POST /api/users/:id/request
// @access  Private
// ------------------------------------------------------------
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    res.status(404);
    throw new Error("Target user not found");
  }

  if (String(targetUser._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot send a request to yourself");
  }

  if (targetUser.requests.includes(req.user._id) || targetUser.friends.includes(req.user._id)) {
    res.status(400);
    throw new Error("Request already sent or you are already friends");
  }

  targetUser.requests.push(req.user._id);
  await targetUser.save();

  res.json({ message: "Request sent successfully" });
});

// ------------------------------------------------------------
// @desc    Get incoming requests
// @route   GET /api/users/requests
// @access  Private
// ------------------------------------------------------------
const getIncomingRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "requests",
    "name email avatar skills college branch"
  );
  res.json(user.requests);
});

// ------------------------------------------------------------
// @desc    Accept request
// @route   POST /api/users/requests/:id/accept
// @access  Private
// ------------------------------------------------------------
const acceptRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  const user = await User.findById(req.user._id);

  if (!user.requests.includes(requesterId)) {
    res.status(400);
    throw new Error("No such request found");
  }

  user.requests = user.requests.filter(r => String(r) !== String(requesterId));
  user.friends.push(requesterId);
  await user.save();

  const requester = await User.findById(requesterId);
  requester.friends.push(req.user._id);
  await requester.save();

  res.json({ message: "Request accepted" });
});

// ------------------------------------------------------------
// @desc    Reject request
// @route   POST /api/users/requests/:id/reject
// @access  Private
// ------------------------------------------------------------
const rejectRequest = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;
  const user = await User.findById(req.user._id);

  if (!user.requests.includes(requesterId)) {
    res.status(400);
    throw new Error("No such request found");
  }

  user.requests = user.requests.filter(r => String(r) !== String(requesterId));
  await user.save();

  res.json({ message: "Request rejected" });
});

module.exports = {
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
};