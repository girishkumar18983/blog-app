const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  getAllPosts,
  updateUserRole,
  deleteUser,
  deletePostAdmin,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/admin/users — List all users
router.get('/users', getAllUsers);

// GET /api/admin/posts — List all posts
router.get('/posts', getAllPosts);

// PUT /api/admin/users/:id/role — Change a user's role
router.put('/users/:id/role', updateUserRole);

// DELETE /api/admin/users/:id — Delete a user
router.delete('/users/:id', deleteUser);

// DELETE /api/admin/posts/:id — Delete a post
router.delete('/posts/:id', deletePostAdmin);

module.exports = router;
