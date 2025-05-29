// src/controllers/leaveController.js
const leaveTypeModel = require('../models/leaveTypeModel');
const leaveBalanceModel = require('../models/leaveBalanceModel');
const leaveRequestModel = require('../models/leaveRequestModel');
const publicHolidayModel = require('../models/publicHolidayModel');
const { calculateLeaveDuration } = require('../utils/leaveCalculator');
const { checkLeaveLimit, getProcessedUserBalances } = require('../services/leaveBalanceService');
const employeeModel = require('../models/employeeModel');

/**
 * Gets all available leave types.
 */
async function getLeaveTypes(req, res) { // <<<--- CORRECT IMPLEMENTATION
  console.log('[Controller LEAVE_TYPES] Request received for /types'); // Logging
  try {
    console.log('[Controller LEAVE_TYPES] Calling model getAllLeaveTypes...'); // Logging
    const leaveTypes = await leaveTypeModel.getAllLeaveTypes();
    console.log('[Controller LEAVE_TYPES] Model returned:', leaveTypes ? leaveTypes.length : 'null/undefined'); // Logging
    res.status(200).json(leaveTypes);
    console.log('[Controller LEAVE_TYPES] Response sent for /types'); // Logging
  } catch (error) {
    console.error('Controller error fetching leave types:', error);
    res.status(500).json({ message: 'Error retrieving leave types.' });
  }
}

/**
 * Gets leave balances for the currently logged-in user, including accrual processing.
 */
async function getMyBalances(req, res) {
  console.log(`[Controller] START getMyBalances for user ${req.session.user?.id}`);
  try {
    const employeeId = req.session.user.id;
    if (!employeeId) {
      console.log('[Controller] getMyBalances: No employeeId in session.');
      return res.status(401).json({ message: 'Authentication required.' });
    }
    console.log(`[Controller] Calling getProcessedUserBalances for ${employeeId}`);
    const balances = await getProcessedUserBalances(employeeId);
    console.log(`[Controller] Received ${balances?.length} balances from service for ${employeeId}. Sending response.`);
    res.status(200).json(balances);
    console.log(`[Controller] Response sent successfully for ${employeeId}.`);
  } catch (error) {
    console.error('[Controller] ERROR in getMyBalances:', error);
    res.status(500).json({ message: 'Error retrieving leave balances.' });
  }
}

/**
 * Handles applying for leave.
 */
async function applyForLeave(req, res) {
  console.log('[Controller APPLY_LEAVE] Request received');
  try {
    const employeeId = req.session.user.id;
    const { leaveTypeId, startDate, endDate, isStartHalfDay = false, isEndHalfDay = false, notes, } = req.body;
    if (!leaveTypeId || !startDate || !endDate) {
      console.log('[Controller APPLY_LEAVE] Missing required fields');
      return res.status(400).json({ message: 'Missing required fields (leaveTypeId, startDate, endDate).' });
    }
    console.log(`[Controller APPLY_LEAVE] Fetching holidays for ${startDate} to ${endDate}`);
    const holidays = await publicHolidayModel.getHolidaysBetweenDates(startDate, endDate);
    console.log(`[Controller APPLY_LEAVE] Calculating duration`);
    let calculatedDurationDays;
    try {
        calculatedDurationDays = calculateLeaveDuration(startDate, endDate, isStartHalfDay, isEndHalfDay, holidays);
    } catch (calcError) {
        console.error("[Controller APPLY_LEAVE] Leave duration calculation error:", calcError.message);
        return res.status(400).json({ message: `Error calculating leave duration: ${calcError.message}` });
    }
    console.log(`[Controller APPLY_LEAVE] Duration calculated: ${calculatedDurationDays}`);
    const requestData = { employeeId, leaveTypeId: parseInt(leaveTypeId, 10), startDate, endDate, isStartHalfDay: !!isStartHalfDay, isEndHalfDay: !!isEndHalfDay, calculatedDurationDays, notes: notes || null, status: 'Pending', };
    console.log('[Controller APPLY_LEAVE] Creating leave request in DB');
    const newRequest = await leaveRequestModel.createLeaveRequest(requestData);
    console.log('[Controller APPLY_LEAVE] Leave request created:', newRequest);
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Controller error applying for leave:', error);
    res.status(500).json({ message: 'Error submitting leave request.' });
  }
}

/**
 * Gets the leave history for the currently logged-in user.
 */
async function getMyLeaveHistory(req, res) {
  console.log(`[Controller LEAVE_HISTORY] Request received for user ${req.session.user?.id}`);
  try {
    const employeeId = req.session.user.id;
    if (!employeeId) { return res.status(401).json({ message: 'Authentication required.' }); }
    const history = await leaveRequestModel.getEmployeeLeaveHistory(employeeId);
    console.log(`[Controller LEAVE_HISTORY] Found ${history?.length} records for user ${employeeId}`);
    res.status(200).json(history);
  } catch (error) {
    console.error('Controller error fetching user leave history:', error);
    res.status(500).json({ message: 'Error retrieving leave history.' });
  }
}

/**
 * Gets pending leave requests for the logged-in manager's team.
 */
async function getPendingTeamRequests(req, res) {
  console.log(`[Controller PENDING_REQUESTS] Request received for manager ${req.session.user?.id}`);
  try {
    const managerId = req.session.user.id;
    if (!managerId) { return res.status(401).json({ message: 'Authentication required.' }); }
    const pendingRequests = await leaveRequestModel.getPendingRequestsForManager(managerId);
    console.log(`[Controller PENDING_REQUESTS] Found ${pendingRequests?.length} pending requests for manager ${managerId}`);
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Controller error fetching pending team requests:', error);
    res.status(500).json({ message: 'Error retrieving pending requests.' });
  }
}

/**
 * Approves or denies a specific leave request.
 */
async function decideLeaveRequest(req, res) {
  console.log(`[Controller DECIDE_REQUEST] Request received for ID ${req.params.requestId} by user ${req.session.user?.id}`);
  try {
    const approverId = req.session.user.id;
    const requestId = parseInt(req.params.requestId, 10);
    const { approved } = req.body;

    if (isNaN(requestId)) { return res.status(400).json({ message: 'Invalid request ID.' }); }
    if (typeof approved !== 'boolean') { return res.status(400).json({ message: 'Invalid decision payload: "approved" must be true or false.' }); }

    const request = await leaveRequestModel.getRequestById(requestId);
    if (!request) { return res.status(404).json({ message: 'Leave request not found.' }); }
    if (request.employeeManagerId !== approverId) { return res.status(403).json({ message: 'Forbidden: You are not authorized to decide on this request.' }); }
    if (request.status !== 'Pending') { return res.status(409).json({ message: `Request is already ${request.status}. Cannot modify.` }); }

    const newStatus = approved ? 'Approved' : 'Denied';

    if (newStatus === 'Approved') {
        console.log(`[Controller DECIDE_REQUEST] Checking limits for approving request <span class="math-inline">\{requestId\} \(</span>{request.leaveTypeName})`);
        const limitCheckResult = await checkLeaveLimit(request.employee_id, request);
        if (!limitCheckResult.ok) {
            console.log(`[Controller DECIDE_REQUEST] Limit check failed: ${limitCheckResult.message}`);
            return res.status(400).json({ message: limitCheckResult.message });
        }
        console.log(`[Controller DECIDE_REQUEST] Limit check passed for request ${requestId}.`);
    }

    const updatedRequest = await leaveRequestModel.updateRequestStatus(requestId, approverId, newStatus);
    if (!updatedRequest) { return res.status(409).json({ message: 'Request status could not be updated (was not Pending?).' }); }

    if (newStatus === 'Approved' && request.leaveTypeDeductsBalance === true) {
         console.log(`[Controller DECIDE_REQUEST] Attempting to deduct ${updatedRequest.calculated_duration_days} days for request ${requestId}`);
         try {
             await leaveBalanceModel.deductLeaveBalance(updatedRequest.employee_id, updatedRequest.leave_type_id, updatedRequest.calculated_duration_days);
             console.log(`[Controller DECIDE_REQUEST] Balance deducted successfully for request ${requestId}.`);
         } catch (deductionError) {
             console.error(`CRITICAL: Failed to deduct balance for approved request ${requestId}! Manual adjustment needed. Error:`, deductionError);
         }
    } else if (newStatus === 'Approved' && request.leaveTypeDeductsBalance === false) {
         console.log(`[Controller DECIDE_REQUEST] Leave type ${request.leaveTypeName} does not deduct balance.`);
    }
    console.log(`[Controller DECIDE_REQUEST] Request ${requestId} decision processed: ${newStatus}`);
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error(`Controller error deciding leave request ${req.params.requestId}:`, error);
    res.status(500).json({ message: 'Error processing leave request decision.' });
  }
}

module.exports = {
  getLeaveTypes,
  getMyBalances,
  applyForLeave,
  getMyLeaveHistory,
  getPendingTeamRequests,
  decideLeaveRequest,
};