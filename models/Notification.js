const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // User receiving the notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // User who triggered the notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Type of notification
    type: {
      type: String,
      enum: ['like', 'comment', 'reply'],
      required: true,
    },
    // Related post
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    // Human-readable notification message
    message: {
      type: String,
      required: true,
    },
    // Whether the user has read this notification
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries by recipient, sorted by newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
