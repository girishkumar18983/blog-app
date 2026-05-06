const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const WebAppStrategy = require('ibmcloud-appid').WebAppStrategy;
const User = require('./models/User');


const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS — allow both local dev and production frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview deployment from the same project
    if (origin.endsWith('.vercel.app') && origin.includes('girishkumar18983')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Trust proxy for Render (required for secure cookies behind a reverse proxy)
app.set('trust proxy', 1);

// Session and Passport setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser(async (obj, cb) => {
  try {
    // Bridge to MongoDB User model
    let user = await User.findOne({ username: obj.email || obj.name || obj.username });
    if (!user && (obj.email || obj.name)) {
      user = await User.create({
        username: obj.email || obj.name,
        password: 'password_not_used',
        role: 'author'
      });
    }
    cb(null, user || obj);
  } catch (err) {
    cb(err);
  }
});

passport.use('appid', new WebAppStrategy({
  tenantId: process.env.APPID_TENANT_ID,
  clientId: process.env.APPID_CLIENT_ID,
  secret: process.env.APPID_SECRET,
  oauthServerUrl: process.env.APPID_OAUTH_SERVER_URL,
  redirectUri: process.env.APPID_REDIRECT_URI || "http://localhost:5000/api/auth/callback"
}));


// Serve uploaded files as static assets
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Dashboard route for post-login landing
app.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    // In production, redirect to the frontend app
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(frontendUrl);
  } else {
    res.redirect('/api/auth/login');
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Blog API is running' });
});

// Global error handler (must be AFTER all routes)
app.use(errorHandler);

// Start server first so Render detects the open port
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Connect to MongoDB without crashing the server if it fails
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is missing!');
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      // Removed process.exit(1) so the app stays alive for Render health checks
    });
}
