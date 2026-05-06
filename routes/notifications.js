const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

// GET /api/notifications — Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count — Get unread count
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/read-all — Mark all as read
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read — Mark one as read
router.put('/:id/read', markAsRead);

module.exports = router;
