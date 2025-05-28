// src/controllers/leaveController.js
const leaveTypeModel = require('../models/leaveTypeModel');
const leaveBalanceModel = require('../models/leaveBalanceModel');
const leaveRequestModel = require('../models/leaveRequestModel');
const publicHolidayModel = require('../models/publicHolidayModel');
const { calculateLeaveDuration } = require('../utils/leaveCalculator');
const { checkLeaveLimit, getProcessedUserBalances } = require('../services/leaveBalanceService');
const employeeModel = require('../models/employeeModel');

async function getLeaveTypes(req, res) { /* ... keep existing ... */ }

/**
 * Gets leave balances for the currently logged-in user, including accrual processing.
 */
async function getMyBalances(req, res) { // <<<--- MODIFYING THIS FUNCTION
  console.log(`[Controller] START getMyBalances for user ${req.session.user?.id}`); // <<< LOGGING
  try {
    const employeeId = req.session.user.id;
    if (!employeeId) {
      console.log('[Controller] getMyBalances: No employeeId in session.'); // <<< LOGGING
      return res.status(401).json({ message: 'Authentication required.' });
    }

    console.log(`[Controller] Calling getProcessedUserBalances for ${employeeId}`); // <<< LOGGING
    const balances = await getProcessedUserBalances(employeeId);
    console.log(`[Controller] Received ${balances?.length} balances from service for ${employeeId}. Sending response.`); // <<< LOGGING (Check if balances looks ok)
    // console.log('[Controller] Balances data:', JSON.stringify(balances)); // Optional detailed log

    res.status(200).json(balances); // Send balances on success
    console.log(`[Controller] Response sent successfully for ${employeeId}.`); // <<< LOGGING

  } catch (error) {
    console.error('[Controller] ERROR in getMyBalances:', error); // <<< LOGGING (Ensure error is logged)
    // Ensure error response is sent
    res.status(500).json({ message: 'Error retrieving leave balances.' });
  }
}

async function applyForLeave(req, res) { /* ... keep existing ... */ }
async function getMyLeaveHistory(req, res) { /* ... keep existing ... */ }
async function getPendingTeamRequests(req, res) { /* ... keep existing ... */ }
async function decideLeaveRequest(req, res) { /* ... keep existing ... */ }

module.exports = {
  getLeaveTypes, // <<< Make sure this one is listed
  getMyBalances,
  applyForLeave,
  getMyLeaveHistory,
  getPendingTeamRequests,
  decideLeaveRequest,
};