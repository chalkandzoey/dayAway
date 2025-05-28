// src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController'); // Import controller functions

const router = express.Router(); // Create a new router instance

// Define Authentication routes
// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout - Using POST as it changes server state (ends session)
router.post('/logout', authController.logout);

// GET /api/auth/me - Check current user session
router.get('/me', authController.getCurrentUser);

// Export the router so it can be used by app.js
module.exports = router;