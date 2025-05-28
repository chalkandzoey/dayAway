// src/middleware/authMiddleware.js

/**
 * Middleware to check if a user is authenticated (logged in).
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ message: 'Unauthorized: Please log in to access this resource.' });
  }
}

/**
 * Middleware to check if a user is an administrator.
 */
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.isAdmin) {
       return next();
    } else if (req.session && req.session.user) {
       return res.status(403).json({ message: 'Forbidden: Administrator access required.' });
    } else {
       return res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }
}

// ---> ADD THIS NEW FUNCTION <---
/**
 * Middleware to check if a user is a manager.
 * Assumes isAuthenticated middleware runs before this.
 */
function isManager(req, res, next) {
    // Check the flag set during login
    if (req.session.user && req.session.user.isManager) {
        // User is logged in AND is a manager
        return next();
    } else if (req.session && req.session.user) {
        // User is logged in, but not a manager
        return res.status(403).json({ message: 'Forbidden: Manager access required.' });
    } else {
        // User is not logged in at all (should have been caught by isAuthenticated)
        // Still good practice to handle it defensively
        return res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }
}
// ---> END OF NEW FUNCTION <---


module.exports = {
  isAuthenticated,
  isAdmin,
  isManager, // <<<--- EXPORT THE NEW FUNCTION
};