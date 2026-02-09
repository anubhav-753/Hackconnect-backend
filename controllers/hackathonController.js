const asyncHandler = require('express-async-handler');
const Hackathon = require('../models/hackathonModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

// @desc    Get all hackathons with search and sorting
// @route   GET /api/hackathons
// @access  Public
// @desc    Get all hackathons with search, sorting, and status filtering
// @route   GET /api/hackathons
// @access  Public
const getAllHackathons = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
      $or: [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ],
    }
    : {};

  let dateFilter = {};
  const now = new Date();

  if (req.query.status === 'upcoming') {
    dateFilter = { startDate: { $gt: now } };
  } else if (req.query.status === 'ongoing') {
    dateFilter = { startDate: { $lte: now }, endDate: { $gte: now } };
  } else if (req.query.status === 'completed' || req.query.status === 'past') {
    dateFilter = { endDate: { $lt: now } };
  }

  const hackathons = await Hackathon.find({ ...keyword, ...dateFilter }).sort({ startDate: 'asc' });
  res.json(hackathons);
});

// @desc    Get a single hackathon by ID
// @route   GET /api/hackathons/:id
// @access  Public
const getHackathonById = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);

  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  res.json(hackathon);
});

// @desc    Create a hackathon
// @route   POST /api/hackathons
// @access  Private
const createHackathon = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, location, website, themes } = req.body;

  if (!title || !description || !startDate || !endDate) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  const hackathon = await Hackathon.create({
    title,
    description,
    startDate,
    endDate,
    location: location || 'Online',
    website,
    themes,
    createdBy: req.user._id,
  });

  // Notify all users about the new hackathon
  const users = await User.find({}, '_id');
  const notifications = users.map(user => ({
    recipient: user._id,
    sender: req.user._id, // The admin/creator
    type: 'hackathon_alert',
    message: `New Hackathon Alert: ${hackathon.title}`,
    isRead: false,
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // Real-time notification
  const io = req.app.get('socketio');
  if (io) {
    io.emit('newNotification', {
      type: 'hackathon_alert',
      message: `New Hackathon Alert: ${hackathon.title}`,
      hackathonId: hackathon._id,
    });
  }

  res.status(201).json(hackathon);
});

// @desc    Update a hackathon
// @route   PUT /api/hackathons/:id
// @access  Private/Admin
const updateHackathon = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, location, website, themes } = req.body;

  const hackathon = await Hackathon.findById(req.params.id);

  if (hackathon) {
    hackathon.title = title || hackathon.title;
    hackathon.description = description || hackathon.description;
    hackathon.startDate = startDate || hackathon.startDate;
    hackathon.endDate = endDate || hackathon.endDate;
    hackathon.location = location || hackathon.location;
    hackathon.website = website || hackathon.website;
    hackathon.themes = themes || hackathon.themes;

    const updatedHackathon = await hackathon.save();
    res.json(updatedHackathon);
  } else {
    res.status(404);
    throw new Error('Hackathon not found');
  }
});

// @desc    Delete a hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private/Admin
const deleteHackathon = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);

  if (hackathon) {
    await hackathon.remove();
    res.json({ message: 'Hackathon removed' });
  } else {
    res.status(404);
    throw new Error('Hackathon not found');
  }
});
module.exports = {
  getAllHackathons, // <-- UPDATED THE EXPORT NAME
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
};