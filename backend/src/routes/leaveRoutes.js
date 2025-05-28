// src/routes/leaveRoutes.js
const express = require('express');
const leaveController = require('../controllers/leaveController');
// Import all middleware functions (or just the object)
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// --- Employee Routes ---
router.get('/types', authMiddleware.isAuthenticated, leaveController.getLeaveTypes);
router.get('/balances/me', authMiddleware.isAuthenticated, leaveController.getMyBalances);
router.post('/apply', authMiddleware.isAuthenticated, leaveController.applyForLeave);
router.get('/history/me', authMiddleware.isAuthenticated, leaveController.getMyLeaveHistory);


// --- Manager Routes --- Use isManager middleware --->

// GET /api/leave/requests/pending/my-team
router.get(
    '/requests/pending/my-team',
    authMiddleware.isAuthenticated, // 1. Must be logged in
    authMiddleware.isManager,       // 2. Must be a manager <<<--- ADDED
    leaveController.getPendingTeamRequests
);

// POST /api/leave/requests/:requestId/decide
router.post(
    '/requests/:requestId/decide',
    authMiddleware.isAuthenticated, // 1. Must be logged in
    authMiddleware.isManager,       // 2. Must be a manager <<<--- ADDED
    // Note: We still need controller-level check that *this specific manager*
    // can decide on *this specific request* for better security.
    leaveController.decideLeaveRequest
);
// --- END OF MANAGER ROUTES ---


// --- Admin Routes (Example - Add later) ---
// router.get('/admin/all', authMiddleware.isAuthenticated, authMiddleware.isAdmin, leaveController.getAllLeaveAdmin);


module.exports = router;