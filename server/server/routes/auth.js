const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // Create token
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      _id: savedUser._id,
      username: savedUser.username,
      token,
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      _id: user._id,
      username: user.username,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

// PUT /api/auth/username
router.put('/username', async (req, res) => {
  try {
    const { userId, newUsername } = req.body;
    if (!newUsername || !newUsername.trim()) {
      return res.status(400).json({ message: 'Username cannot be empty' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldUsername = user.username;
    if (oldUsername === newUsername) {
      return res.status(400).json({ message: 'New username is the same as the old one' });
    }

    const userExists = await User.findOne({ username: newUsername });
    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // 1. Update User
    user.username = newUsername;
    await user.save();

    // 2. Cascade Update Posts (Author)
    await Post.updateMany(
      { author: oldUsername },
      { $set: { author: newUsername } }
    );

    // 3. Cascade Update Likes
    await Post.updateMany(
      { likes: oldUsername },
      { $set: { "likes.$": newUsername } }
    );

    // 4. Cascade Update Comments
    // We have to use array filters to update the author of specific comments
    await Post.updateMany(
      { "comments.author": oldUsername },
      { $set: { "comments.$[elem].author": newUsername } },
      { arrayFilters: [{ "elem.author": oldUsername }] }
    );

    // Generate new token so the frontend stays logged in
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      _id: user._id,
      username: user.username,
      token,
    });
  } catch (err) {
    console.error('Username Update Error:', err);
    res.status(500).json({ message: 'Failed to update username', error: err.message });
  }
});

module.exports = router;
