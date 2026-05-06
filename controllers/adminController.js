const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

/**
 * GET /api/admin/stats
 * Get dashboard statistics — admin only
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalPosts, totalComments, totalNotifications] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.aggregate([
        { $project: { commentCount: { $size: '$comments' } } },
        { $group: { _id: null, total: { $sum: '$commentCount' } } },
      ]),
      Notification.countDocuments(),
    ]);

    // Get role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Get recent users (last 10)
    const recentUsers = await User.find()
      .select('username role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalUsers,
      totalPosts,
      totalComments: totalComments[0]?.total || 0,
      totalNotifications,
      roleDistribution,
      recentUsers,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 * Get all users — admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('username name role avatar createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/posts
 * Get all posts — admin only
 */
const getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .select('title author category views likes comments createdAt')
      .sort({ createdAt: -1 });

    // Add computed fields
    const postsWithStats = posts.map((post) => ({
      ...post.toObject(),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    res.json(postsWithStats);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Update a user's role — admin only
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['reader', 'author', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be reader, author, or admin' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('username role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user and their posts — admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all posts by this user
    await Post.deleteMany({ author: req.params.id });

    // Remove user from all friends lists
    await User.updateMany(
      { friends: req.params.id },
      { $pull: { friends: req.params.id } }
    );

    // Delete notifications for/from this user
    await Notification.deleteMany({
      $or: [{ recipient: req.params.id }, { sender: req.params.id }],
    });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/posts/:id
 * Delete any post — admin only
 */
const deletePostAdmin = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Clean up bookmarks
    await User.updateMany(
      { bookmarks: req.params.id },
      { $pull: { bookmarks: req.params.id } }
    );

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllPosts,
  updateUserRole,
  deleteUser,
  deletePostAdmin,
};
