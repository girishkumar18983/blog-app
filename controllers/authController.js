const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');

/**
 * Generate JWT token for a user
 * @param {string} userId - MongoDB user ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * [DISABLED] POST /api/auth/register
 * Register a new user account logic has been replaced by IBM App ID.
 */
// const register = async (req, res, next) => { ... };

/**
 * [DISABLED] POST /api/auth/login
 * Internal login logic has been replaced by IBM App ID.
 */
// const login = async (req, res, next) => { ... };

/**
 * PUT /api/auth/username
 * Change username and cascade update across posts, likes, and comments
 */
const changeUsername = async (req, res, next) => {
  try {
    const { userId, newUsername } = req.body;

    if (!newUsername || !newUsername.trim()) {
      return res.status(400).json({ message: 'Username cannot be empty' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldUsername = user.username;
    if (oldUsername === newUsername) {
      return res.status(400).json({ message: 'New username is the same as the old one' });
    }

    // Check if new username is taken
    const userExists = await User.findOne({ username: newUsername });
    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Update the user's username
    user.username = newUsername;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error('Username Update Error:', err);
    next(err);
  }
};

module.exports = { changeUsername };
