// src/controllers/adminController.js
const employeeModel = require('../models/employeeModel');
const leaveBalanceModel = require('../models/leaveBalanceModel');
const publicHolidayModel = require('../models/publicHolidayModel'); // <<<--- IMPORT publicHolidayModel

const multer = require('multer'); // For handling file uploads
const csv = require('csv-parser');  // For parsing CSV data
const { Readable } = require('stream'); // To create a stream from the uploaded buffer

// Configure multer for in-memory storage (good for small CSV files)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// --- Existing User Management Functions (Keep As Is) ---
async function listEmployees(req, res) { /* ... */ }
async function getEmployeeDetails(req, res) { /* ... */ }
async function createNewEmployee(req, res) { /* ... */ }
async function updateEmployeeDetails(req, res) { /* ... */ }
// Ensure the existing functions from the previous step are here:
async function listEmployees(req, res) {
    try {
        const employees = await employeeModel.getAllEmployees();
        res.status(200).json(employees);
    } catch (error) {
        console.error('Admin Controller: Error listing employees:', error);
        res.status(500).json({ message: 'Failed to retrieve employee list.' });
    }
}
async function getEmployeeDetails(req, res) {
    try {
        const { employeeId } = req.params;
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error(`Admin Controller: Error getting details for employee ${req.params.employeeId}:`, error);
        res.status(500).json({ message: 'Failed to retrieve employee details.' });
    }
}
async function createNewEmployee(req, res) {
    const {
        employeeId, name, email, password, employmentStartDate, managerId, annualLeaveAccrualRate, isAdmin
    } = req.body;
    if (!employeeId || !name || !email || !password || !employmentStartDate || annualLeaveAccrualRate === undefined) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (password.length < 6) {
         return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    try {
        const employeeData = { employeeId, name, email, password, employmentStartDate, managerId, annualLeaveAccrualRate: parseFloat(annualLeaveAccrualRate), isAdmin: !!isAdmin };
        const newEmployee = await employeeModel.createEmployee(employeeData);
        await leaveBalanceModel.initializeBalancesForEmployee(newEmployee.employeeId);
        console.log(`Successfully initialized balances for new employee ${newEmployee.employeeId}`);
        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Admin Controller: Error creating employee:', error);
        if (error.message.includes('already exists')) {
             res.status(409).json({ message: error.message });
        } else {
             res.status(500).json({ message: 'Failed to create employee.' });
        }
    }
}
async function updateEmployeeDetails(req, res) {
    try {
        const { employeeId } = req.params;
        const updateData = req.body;
        if (updateData.password || updateData.passwordHash) {
            return res.status(400).json({ message: 'Password cannot be updated via this endpoint.' });
        }
        const updatedEmployee = await employeeModel.updateEmployee(employeeId, updateData);
        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        res.status(200).json(updatedEmployee);
    } catch (error) {
        console.error(`Admin Controller: Error updating employee ${req.params.employeeId}:`, error);
         if (error.message.includes('already exists')) {
             res.status(409).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Failed to update employee details.' });
        }
    }
}


// ---> ADD THIS NEW FUNCTION for Holiday Import <---
/**
 * [Admin] Imports public holidays from an uploaded CSV file.
 * Expected CSV format: Date (dd-mm-yyyy), Name
 */
async function importPublicHolidaysCsv(req, res) {
    // Check if a file was uploaded by multer
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const holidaysToInsert = [];
    const processingErrors = [];
    let rowCount = 0;

    // Helper to convert dd-mm-yyyy to YYYY-MM-DD
    const convertDateToDBFormat = (dateStr_ddmmyyyy) => {
        if (!dateStr_ddmmyyyy || typeof dateStr_ddmmyyyy !== 'string') return null;
        // Regex to match dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy
        const parts = dateStr_ddmmyyyy.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
        if (parts && parts.length === 4) {
            const day = parts[1].padStart(2, '0');
            const month = parts[2].padStart(2, '0');
            const year = parts[3];
            // Basic validation for date components
            if (parseInt(month) > 0 && parseInt(month) <= 12 && parseInt(day) > 0 && parseInt(day) <= 31) {
                 // Further validation (e.g. for days in month) could be added here
                return `${year}-${month}-${day}`;
            }
        }
        return null; // Invalid format
    };

    // Create a readable stream from the uploaded file's buffer
    const readableFileStream = Readable.from(req.file.buffer);

    readableFileStream
        .pipe(csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase(), // Normalize headers
            // skipLines: 0, // if there's a header row, csv-parser handles it by default
        }))
        .on('data', (row) => {
            rowCount++;
            // Try to find 'date' and 'name' columns (case-insensitive due to mapHeaders)
            const dateValue = row['date'];
            const nameValue = row['name'];

            if (!dateValue || !nameValue) {
                processingErrors.push(`Row ${rowCount}: Missing 'Date' or 'Name' column.`);
                return;
            }

            const formattedDate = convertDateToDBFormat(dateValue.trim());
            if (!formattedDate) {
                processingErrors.push(`Row ${rowCount}: Invalid date format "${dateValue}". Expected dd-mm-yyyy.`);
                return;
            }

            holidaysToInsert.push({
                holiday_date: formattedDate,
                name: nameValue.trim(),
            });
        })
        .on('end', async () => {
            if (holidaysToInsert.length === 0 && processingErrors.length === 0 && rowCount > 0) {
                return res.status(400).json({ message: 'CSV processed, but no valid holiday data found to import (check column names: Date, Name).' });
            }
            if (holidaysToInsert.length === 0 && processingErrors.length > 0) {
                return res.status(400).json({
                    message: 'CSV processed, but no valid holiday data found due to errors.',
                    errors: processingErrors,
                });
            }

            try {
                const result = await publicHolidayModel.bulkInsertHolidays(holidaysToInsert);
                const responseMessage = `CSV processed. ${result.importedCount} holidays newly imported, ${result.updatedCount} holidays updated (name may have changed if date existed).`;
                
                if (processingErrors.length > 0 || result.errors.length > 0) {
                    return res.status(207).json({ // Multi-Status
                        message: responseMessage,
                        processingErrors: processingErrors,
                        databaseErrors: result.errors
                    });
                }
                res.status(200).json({ message: responseMessage, imported: result.importedCount, updated: result.updatedCount });

            } catch (dbError) {
                console.error('Admin Controller: Database error during holiday bulk insert:', dbError);
                res.status(500).json({ message: 'Failed to import holidays due to a database error.', errors: processingErrors });
            }
        })
        .on('error', (streamError) => {
            console.error('Admin Controller: Error streaming CSV:', streamError);
            res.status(500).json({ message: 'Failed to process CSV file.' });
        });
}
// ---> END OF NEW FUNCTION <---

module.exports = {
    listEmployees,
    getEmployeeDetails,
    createNewEmployee,
    updateEmployeeDetails,
    importPublicHolidaysCsv, // <<<--- EXPORT new function
    upload,                  // <<<--- EXPORT multer instance for use in routes
};