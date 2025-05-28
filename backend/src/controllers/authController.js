// src/controllers/authController.js
const bcrypt = require('bcrypt');
// Renamed userModel to employeeModel here
const employeeModel = require('../models/employeeModel');
// Removed the debug console.log for the import

/**
 * Handles user login.
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await employeeModel.findByEmail(email);

    if (!user) {
      console.log(`Login attempt failed: User not found for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      console.log(`Login attempt failed: Incorrect password for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // ---> ADD isManager CHECK HERE <---
    const isManager = await employeeModel.checkIsManager(user.employeeId);
    console.log(`User ${user.employeeId} isManager status: ${isManager}`); // Log manager status
    // ---> END OF isManager CHECK <---


    // Store user info in session (including isManager flag)
    const userSessionData = {
      id: user.employeeId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isManager: isManager // <<<--- ADDED isManager FLAG
    };

    req.session.user = userSessionData;

    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: 'Login failed due to server error.' });
        }
        console.log(`User logged in successfully: ${email}`);
        res.status(200).json({ message: 'Login successful', user: userSessionData });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
}

/**
 * Handles user logout.
 */
async function logout(req, res) {
  // ... (keep existing logout function) ...
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed due to server error.' });
    }
    res.clearCookie('connect.sid');
    console.log('User logged out successfully.');
    res.status(200).json({ message: 'Logout successful.' });
  });
}

/**
 * Gets the currently logged-in user's data from the session.
 */
async function getCurrentUser(req, res) {
  // ... (keep existing getCurrentUser function) ...
   if (req.session && req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Not authenticated.', user: null });
  }
}

module.exports = {
  login,
  logout,
  getCurrentUser,
};