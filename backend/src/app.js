// src/app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const dbPool = require('./config/db.js');

// Import Routers
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <<<--- IMPORT ADMIN ROUTES

const app = express();
const PORT = process.env.PORT || 3001;

// --- Core Middleware ---
app.use(express.json()); // Parse JSON bodies
app.use(session({
  store: new pgSession({
    pool: dbPool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    // sameSite: 'lax'
  }
}));

// --- API Routes ---
app.use('/api/auth', authRoutes);   // Authentication routes
app.use('/api/leave', leaveRoutes); // Leave management routes
app.use('/api/admin', adminRoutes); // <<<--- USE ADMIN ROUTES (prefix /api/admin)


// --- Basic Root Route (Optional) ---
app.get('/', (req, res) => {
  // console.log('Root route handler in app.js was executed!'); // Keep if needed for debug
  res.send('Leave Management Backend is Running!');
});


// --- Error Handling Middleware (Add later if needed) ---
// app.use((err, req, res, next) => { ... });


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;