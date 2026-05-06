const User = require('../models/User');

/**
 * Middleware: Verify JWT token and attach user to request
 * Usage: router.get('/protected', protect, handler)
 */
const protect = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authorized, please login via IBM App ID' });
};

/**
 * Middleware: Restrict access to specific roles
 * Usage: router.delete('/admin-only', protect, authorize('admin'), handler)
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'author')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
