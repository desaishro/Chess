const express = require('express');
const User = require('../models/User');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const newUser = new User({ username, password });
  try {
    const user = await newUser.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Upload avatar
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: req.file.path }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add friend
router.post('/add-friend/:friendId', async (req, res) => {
  try {
    const friend = await User.findById(req.params.friendId);
    if (!friend) return res.status(404).json({ message: 'User not found' });

    const user = await User.findByIdAndUpdate(req.user.id, { $addToSet: { friends: friend._id } }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ rating: -1 }).limit(10);
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
