const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * GET /api/posts
 * List posts with pagination, search, and filters
 * Query params: page, limit, search, category, tag
 */
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { search, category, tag } = req.query;

    // Build filter object
    const filter = {};

    // Search by title or content using regex (case-insensitive, no index required)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: { $regex: regex } },
        { content: { $regex: regex } },
        { tags: { $in: [regex] } },
      ];
    }

    // Filter by category
    if (category && category.trim() && category !== 'All') {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Filter by tag
    if (tag && tag.trim()) {
      filter.tags = { $in: [new RegExp(tag.trim(), 'i')] };
    }

    // Get total count for pagination
    const total = await Post.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Fetch posts with author populated
    const posts = await Post.find(filter)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      posts,
      page,
      totalPages,
      total,
      hasMore: page < totalPages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/categories
 * Get list of all unique categories
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Post.distinct('category');
    res.json(categories.filter(Boolean).sort());
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/:id
 * Get a single post with view count increment
 */
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar')
      .populate('comments.replies.author', 'username avatar')
      .populate('likes', 'username');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts
 * Create a new post — protected (author, admin)
 */
const createPost = async (req, res, next) => {
  try {
    const { title, content, tags, coverImage, category } = req.body;

    const post = new Post({
      title,
      content,
      author: req.user._id,
      tags: tags || [],
      coverImage: coverImage || '',
      category: category || 'General',
    });

    const savedPost = await post.save();
    const populated = await savedPost.populate('author', 'username avatar');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/posts/:id
 * Update a post — protected (owner or admin)
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only author or admin can edit
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const { title, content, tags, coverImage, category } = req.body;
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (tags !== undefined) post.tags = tags;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (category !== undefined) post.category = category;

    const updated = await post.save();
    const populated = await updated.populate('author', 'username avatar');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/posts/:id
 * Delete a post — protected (owner or admin)
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only author or admin can delete
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Clean up: remove this post from all users' bookmarks
    await User.updateMany(
      { bookmarks: req.params.id },
      { $pull: { bookmarks: req.params.id } }
    );

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts/:id/like
 * Toggle like on a post — protected
 */
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    // Use findIndex with toString() to correctly compare ObjectIds
    const index = post.likes.findIndex((id) => id.toString() === userId);

    if (index === -1) {
      // Add like
      post.likes.push(req.user._id);

      // Send notification to post author (if not liking own post)
      if (post.author.toString() !== userId) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id,
          message: `${req.user.username} liked your post "${post.title}"`,
        });
      }
    } else {
      // Remove like (unlike)
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json({ likes: post.likes, likesCount: post.likes.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/trending
 * Get top 10 posts sorted by views (descending)
 */
const getTrendingPosts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const posts = await Post.find({ views: { $gt: 0 } })
      .populate('author', 'username avatar')
      .sort({ views: -1 })
      .limit(limit)
      .select('title author category views likes comments coverImage createdAt tags');

    res.json(posts);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts/:id/comments
 * Add a comment to a post — protected
 */
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({ author: req.user._id, text: text.trim() });
    await post.save();

    // Send notification to post author (if not commenting on own post)
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        message: `${req.user.username} commented on your post "${post.title}"`,
      });
    }

    // Re-fetch with populated authors
    const updated = await Post.findById(req.params.id)
      .populate('comments.author', 'username avatar')
      .populate('comments.replies.author', 'username avatar');

    res.status(201).json(updated.comments);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/posts/:id/comments/:commentId
 * Edit a comment — protected (comment author only)
 */
const editComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment author can edit
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await post.save();

    const updated = await Post.findById(req.params.id)
      .populate('comments.author', 'username avatar')
      .populate('comments.replies.author', 'username avatar');

    res.json(updated.comments);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/posts/:id/comments/:commentId
 * Delete a comment — protected (comment author or post author or admin)
 */
const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Comment author, post author, or admin can delete
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isPostAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    post.comments.pull(req.params.commentId);
    await post.save();

    const updated = await Post.findById(req.params.id)
      .populate('comments.author', 'username avatar')
      .populate('comments.replies.author', 'username avatar');

    res.json(updated.comments);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts/:id/comments/:commentId/replies
 * Add a reply to a comment — protected
 */
const addReply = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.replies.push({ author: req.user._id, text: text.trim() });
    await post.save();

    // Send notification to comment author (if not replying to own comment)
    if (comment.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: comment.author,
        sender: req.user._id,
        type: 'reply',
        post: post._id,
        message: `${req.user.username} replied to your comment on "${post.title}"`,
      });
    }

    const updated = await Post.findById(req.params.id)
      .populate('comments.author', 'username avatar')
      .populate('comments.replies.author', 'username avatar');

    res.status(201).json(updated.comments);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts/:id/bookmark
 * Toggle bookmark on a post — protected
 */
const bookmarkPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user._id);
    const index = user.bookmarks.indexOf(post._id);

    if (index === -1) {
      user.bookmarks.push(post._id);
    } else {
      user.bookmarks.splice(index, 1);
    }

    await user.save();
    res.json({ bookmarks: user.bookmarks });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/bookmarks/me
 * Get current user's bookmarked posts — protected
 */
const getBookmarkedPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'author', select: 'username avatar' },
    });
    res.json(user.bookmarks || []);
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
