const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to protect routes (optional here, but good practice)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const jwt = require('jsonwebtoken');
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'No token, not authorized' });
  }
};

// GET /api/users - Search users by username
router.get('/', async (req, res) => {
  try {
    const { username } = req.query;
    const users = await User.find({ 
      username: { $regex: username, $options: 'i' } 
    }).select('username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users' });
  }
});

// GET /api/users/:id - Get user profile and friends
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username name bio avatar friends')
      .populate('friends', 'username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// POST /api/users/add-friend/:id - Add a friend
router.post('/add-friend/:id', protect, async (req, res) => {
  try {
    const userToFriend = await User.findById(req.params.id);
    if (!userToFriend) return res.status(404).json({ message: 'User not found' });

    if (req.user.friends.includes(userToFriend._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    if (req.user._id.toString() === userToFriend._id.toString()) {
      return res.status(400).json({ message: 'You cannot friend yourself' });
    }

    req.user.friends.push(userToFriend._id);
    await req.user.save();

    res.json({ message: 'Friend added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding friend' });
  }
});

// PUT /api/users/profile/:id - Update user profile (name, bio, avatar)
router.put('/profile/:id', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { name, bio, avatar } = req.body;
    
    // Only update fields that are provided
    if (name !== undefined) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    if (avatar !== undefined) req.user.avatar = avatar;

    await req.user.save();

    res.json({
      _id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      bio: req.user.bio,
      avatar: req.user.avatar
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

module.exports = router;
