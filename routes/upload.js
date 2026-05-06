const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

/**
 * POST /api/upload
 * Upload a single image file — protected
 * Returns the URL path to the uploaded image
 */
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  // Return the relative URL to access the uploaded file
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

module.exports = router;
