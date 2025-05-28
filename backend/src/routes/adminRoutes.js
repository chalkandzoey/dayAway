// src/routes/adminRoutes.js
const express = require('express');
// Destructure all needed functions and the upload middleware from adminController
const {
    listEmployees,
    getEmployeeDetails,
    createNewEmployee,
    updateEmployeeDetails,
    importPublicHolidaysCsv, // The controller function for holiday import
    upload                   // The multer instance configured in adminController
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// --- Middleware applied to ALL routes in this file ---
router.use(authMiddleware.isAuthenticated);
router.use(authMiddleware.isAdmin);

// --- User Management Routes --- (/api/admin/users)
router.get('/users', listEmployees);
router.post('/users', createNewEmployee);
router.get('/users/:employeeId', getEmployeeDetails);
router.put('/users/:employeeId', updateEmployeeDetails);
// router.delete('/users/:employeeId', adminController.deleteEmployee); // Future

// --- Public Holiday Management Routes --- (/api/admin/holidays) ADD THIS --->

// POST /api/admin/holidays/import/csv - Import public holidays from CSV
router.post(
    '/holidays/import/csv',
    upload.single('holidayCsv'), // Multer middleware to process single file upload with field name 'holidayCsv'
    importPublicHolidaysCsv      // Our controller function to handle the logic
);
// --- END OF ADDED ROUTE ---


// --- Other Admin Routes (e.g., settings, reports) can be added later ---

module.exports = router;