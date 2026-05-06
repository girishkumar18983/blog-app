const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchUsers, getProfile, updateProfile, addFriend } = require('../controllers/userController');

// GET /api/users — Search users by username
router.get('/', searchUsers);

// GET /api/users/:id — Get user profile
router.get('/:id', getProfile);

// POST /api/users/add-friend/:id — Add friend (protected)
router.post('/add-friend/:id', protect, addFriend);

// PUT /api/users/profile/:id — Update profile (protected)
router.put('/profile/:id', protect, updateProfile);

module.exports = router;
