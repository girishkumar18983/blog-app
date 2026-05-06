const express = require('express');
const router = express.Router();
const passport = require('passport');

// GET /api/auth/login — IBM App ID Login
router.get('/login', passport.authenticate('appid'));

// GET /api/auth/callback — IBM App ID Callback
router.get('/callback', (req, res, next) => {
  passport.authenticate('appid', (err, user, info) => {
    // Production frontend fallback
    const frontendUrl = process.env.FRONTEND_URL || 'https://blog-pg57fwahn-girishkumar18983s-projects.vercel.app';
    
    if (err) {
      console.error('❌ Passport Auth Error:', err);
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
    if (!user) {
      console.error('❌ No user returned from IBM App ID:', info);
      return res.redirect(`${frontendUrl}/login?error=no_user`);
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('❌ Login Session Error:', err);
        return next(err);
      }
      
      console.log('✅ Auth Successful. Redirecting to:', frontendUrl);
      res.redirect(frontendUrl);
    });
  })(req, res, next);
});

// GET /api/auth/logout — Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    const frontendUrl = process.env.FRONTEND_URL || 'https://blog-pg57fwahn-girishkumar18983s-projects.vercel.app';
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
