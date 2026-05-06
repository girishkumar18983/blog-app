const User = require('../models/User');

/**
 * GET /api/users?username=xxx
 * Search users by username (partial match)
 */
const searchUsers = async (req, res, next) => {
  try {
    const { username } = req.query;
    const users = await User.find({
      username: { $regex: username || '', $options: 'i' },
    }).select('username _id avatar');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Get user profile with friends populated
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username name bio avatar friends role bookmarks')
      .populate('friends', 'username avatar');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/profile/:id
 * Update user profile (name, bio, avatar) — protected
 */
const updateProfile = async (req, res, next) => {
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
      avatar: req.user.avatar,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/add-friend/:id
 * Add another user as a friend — protected
 */
const addFriend = async (req, res, next) => {
  try {
    const userToFriend = await User.findById(req.params.id);
    if (!userToFriend) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    next(err);
  }
};

module.exports = { searchUsers, getProfile, updateProfile, addFriend };
