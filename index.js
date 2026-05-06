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
  'https://girishjha.vercel.app',
  'https://blog-pg57fwahn-girishkumar18983s-projects.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
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

// Trust proxy for Render
app.set('trust proxy', 1);

// Session and Passport setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser(async (obj, cb) => {
  try {
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

// Production-first Redirect URI
const redirectUri = process.env.APPID_REDIRECT_URI || "https://blog-app-mkbw.onrender.com/api/auth/callback";
console.log('🔗 Active Redirect URI:', redirectUri);

passport.use('appid', new WebAppStrategy({
  tenantId: process.env.APPID_TENANT_ID,
  clientId: process.env.APPID_CLIENT_ID,
  secret: process.env.APPID_SECRET,
  oauthServerUrl: process.env.APPID_OAUTH_SERVER_URL,
  redirectUri: redirectUri
}));

app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Blog API is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

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
    });
}
