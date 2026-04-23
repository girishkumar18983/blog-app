const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET /api/posts — List all posts (newest first)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts', error: err.message });
  }
});

// GET /api/posts/:id — Get a single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } }, 
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch post', error: err.message });
  }
});

// POST /api/posts — Create a new post
router.post('/', async (req, res) => {
  try {
    const { title, content, author, tags, coverImage } = req.body;
    const post = new Post({ title, content, author, tags, coverImage });
    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
});

// PUT /api/posts/:id — Update a post
router.put('/:id', async (req, res) => {
  try {
    const { title, content, author, tags, coverImage } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, author, tags, coverImage },
      { new: true, runValidators: true }
    );
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ message: 'Failed to update post', error: err.message });
  }
});

// DELETE /api/posts/:id — Delete a post
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post', error: err.message });
  }
});

// POST /api/posts/:id/like — Toggle a like on a post
router.post('/:id/like', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(username);
    if (index === -1) {
      post.likes.push(username);
    } else {
      post.likes.splice(index, 1);
    }
    
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle like', error: err.message });
  }
});

// POST /api/posts/:id/comments — Add a comment to a post
router.post('/:id/comments', async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text || !author) return res.status(400).json({ message: 'Text and author are required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ text, author });
    await post.save();
    
    res.status(201).json(post.comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment', error: err.message });
  }
});

module.exports = router;
