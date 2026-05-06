const express = require('express');
const router = express.Router();
const passport = require('passport');

// GET /api/auth/login — IBM App ID Login
router.get('/login', passport.authenticate('appid'));

// GET /api/auth/callback — IBM App ID Callback
router.get('/callback', passport.authenticate('appid', { 
  successRedirect: '/dashboard', 
  failureRedirect: '/' 
}));

// GET /api/auth/logout — Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(frontendUrl);
  });
});

// GET /api/auth/me — Get current user info
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = router;
