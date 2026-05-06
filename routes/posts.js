const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPosts,
  getPost,
  getCategories,
  getTrendingPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  editComment,
  deleteComment,
  addReply,
  bookmarkPost,
  getBookmarkedPosts,
} = require('../controllers/postController');

// --- Public routes ---

// GET /api/posts — List posts (with pagination, search, filters)
router.get('/', getPosts);

// GET /api/posts/categories — Get all unique categories
router.get('/categories', getCategories);

// GET /api/posts/trending — Get top posts by views
router.get('/trending', getTrendingPosts);

// GET /api/posts/search?q=keyword — Search alias (redirects to main with search param)
router.get('/search', (req, res, next) => {
  req.query.search = req.query.q || req.query.search || '';
  return getPosts(req, res, next);
});

// GET /api/posts/bookmarks/me — Get user's bookmarked posts (protected)
router.get('/bookmarks/me', protect, getBookmarkedPosts);

// GET /api/posts/:id — Get single post (increments views)
router.get('/:id', getPost);

// --- Protected routes (logged-in users) ---

// POST /api/posts — Create a new post (author, admin only)
router.post('/', protect, authorize('author', 'admin'), createPost);

// PUT /api/posts/:id — Update a post (owner or admin)
router.put('/:id', protect, updatePost);

// DELETE /api/posts/:id — Delete a post (owner or admin)
router.delete('/:id', protect, deletePost);

// POST /api/posts/:id/like — Toggle like
router.post('/:id/like', protect, toggleLike);

// POST /api/posts/:id/bookmark — Toggle bookmark
router.post('/:id/bookmark', protect, bookmarkPost);

// --- Comment routes (protected) ---

// POST /api/posts/:id/comments — Add a comment
router.post('/:id/comments', protect, addComment);

// PUT /api/posts/:id/comments/:commentId — Edit a comment
router.put('/:id/comments/:commentId', protect, editComment);

// DELETE /api/posts/:id/comments/:commentId — Delete a comment
router.delete('/:id/comments/:commentId', protect, deleteComment);

// POST /api/posts/:id/comments/:commentId/replies — Add a reply to a comment
router.post('/:id/comments/:commentId/replies', protect, addReply);

module.exports = router;
