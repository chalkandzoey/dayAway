// src/models/leaveRequestModel.js
const pool = require('../config/db');

async function createLeaveRequest(requestData) { /* ... keep existing ... */
    const { employeeId, leaveTypeId, startDate, endDate, isStartHalfDay, isEndHalfDay, calculatedDurationDays, notes, status = 'Pending', } = requestData;
    if (!employeeId || !leaveTypeId || !startDate || !endDate || calculatedDurationDays === undefined) { throw new Error('Missing required fields.'); }
    const query = ` INSERT INTO leave_requests ( employee_id, leave_type_id, start_date, end_date, is_start_half_day, is_end_half_day, calculated_duration_days, notes, status, submission_date ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING request_id AS "requestId", employee_id AS "employeeId", leave_type_id AS "leaveTypeId", start_date AS "startDate", end_date AS "endDate", is_start_half_day AS "isStartHalfDay", is_end_half_day AS "isEndHalfDay", calculated_duration_days AS "calculatedDurationDays", notes, status, submission_date AS "submissionDate"; `;
    const values = [ employeeId, leaveTypeId, startDate, endDate, isStartHalfDay, isEndHalfDay, calculatedDurationDays, notes, status ];
    try { const result = await pool.query(query, values); return result.rows[0]; }
    catch (error) { console.error('Error creating leave request:', error); throw error; }
}

async function getEmployeeLeaveHistory(employeeId) { /* ... keep existing ... */
    if (!employeeId) { throw new Error('Employee ID required.'); }
    const query = ` SELECT lr.request_id AS "requestId", lt.name AS "leaveTypeName", lr.start_date AS "startDate", lr.end_date AS "endDate", lr.is_start_half_day AS "isStartHalfDay", lr.is_end_half_day AS "isEndHalfDay", lr.calculated_duration_days AS "calculatedDurationDays", lr.notes, lr.status, lr.submission_date AS "submissionDate", lr.decision_date AS "decisionDate" FROM leave_requests lr JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id WHERE lr.employee_id = $1 ORDER BY lr.start_date DESC; `;
    try { const result = await pool.query(query, [employeeId]); return result.rows; }
    catch (error) { console.error(`Error fetching leave history for employee ${employeeId}:`, error); throw error; }
}

async function getPendingRequestsForManager(managerId) { /* ... keep existing ... */
    if (!managerId) throw new Error('Manager ID required.');
    const query = ` SELECT lr.request_id AS "requestId", lr.employee_id AS "employeeId", e.name AS "employeeName", lt.name AS "leaveTypeName", lr.start_date AS "startDate", lr.end_date AS "endDate", lr.is_start_half_day AS "isStartHalfDay", lr.is_end_half_day AS "isEndHalfDay", lr.calculated_duration_days AS "calculatedDurationDays", lr.notes, lr.status, lr.submission_date AS "submissionDate" FROM leave_requests lr JOIN employees e ON lr.employee_id = e.employee_id JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id WHERE e.manager_id = $1 AND lr.status = 'Pending' ORDER BY lr.submission_date ASC; `;
    try { const result = await pool.query(query, [managerId]); return result.rows; }
    catch (error) { console.error(`Error fetching pending requests for manager ${managerId}:`, error); throw error; }
}

async function updateRequestStatus(requestId, approverId, newStatus) { /* ... keep existing ... */
    if (!requestId || !approverId || !newStatus) throw new Error('IDs and Status required.');
    if (newStatus !== 'Approved' && newStatus !== 'Denied') throw new Error('Invalid status.');
    const query = ` UPDATE leave_requests SET status = $1, approver_id = $2, decision_date = NOW() WHERE request_id = $3 AND status = 'Pending' RETURNING *; `;
    try { const result = await pool.query(query, [newStatus, approverId, requestId]); return result.rows.length > 0 ? result.rows[0] : null; }
    catch (error) { console.error(`Error updating status for request ${requestId}:`, error); throw error; }
}

async function getRequestById(requestId) { /* ... keep existing ... */
    if (!requestId) throw new Error('Request ID required.');
    const query = ` SELECT lr.*, lt.name AS "leaveTypeName", lt.deducts_balance AS "leaveTypeDeductsBalance", e.manager_id AS "employeeManagerId" FROM leave_requests lr JOIN leave_types lt ON lr.leave_type_id = lt.leave_type_id JOIN employees e ON lr.employee_id = e.employee_id WHERE lr.request_id = $1; `;
    try { const result = await pool.query(query, [requestId]); return result.rows.length > 0 ? result.rows[0] : null; }
    catch (error) { console.error(`Error fetching request ${requestId}:`, error); throw error; }
  }

// ---> ADD THIS NEW FUNCTION <---
/**
 * Calculates the total duration of APPROVED leave requests for a specific type
 * within a given date range (inclusive).
 * @param {string} employeeId
 * @param {number} leaveTypeId
 * @param {string} periodStartDate 'YYYY-MM-DD'
 * @param {string} periodEndDate 'YYYY-MM-DD'
 * @returns {Promise<number>} Total approved days used in the period.
 */
async function getApprovedUsageInPeriod(employeeId, leaveTypeId, periodStartDate, periodEndDate) {
    if (!employeeId || !leaveTypeId || !periodStartDate || !periodEndDate) {
        throw new Error('Employee ID, Leave Type ID, start date, and end date are required for usage calculation.');
    }

    // Query approved leave requests that overlap with the specified period
    // Sum the calculated_duration_days for those requests
    // NOTE: This simple sum assumes requests are fully contained. A more complex calculation
    //       might be needed if requests can span across the period boundaries and only
    //       the portion within the period should be counted. For typical leave limits
    //       (like annual or sick cycles), counting any approved request where the start date
    //       falls within the cycle is often sufficient, but consult specific regulations.
    //       Let's sum requests STARTING within the period for simplicity here.
     const query = `
        SELECT COALESCE(SUM(calculated_duration_days), 0) AS total_usage
        FROM leave_requests
        WHERE employee_id = $1
          AND leave_type_id = $2
          AND status = 'Approved'
          AND start_date >= $3
          AND start_date <= $4; -- Count requests starting within the period
    `;
    // Alternative: Check for any overlap: AND end_date >= $3 AND start_date <= $4; (more complex to sum partial days)

    try {
        const result = await pool.query(query, [employeeId, leaveTypeId, periodStartDate, periodEndDate]);
        // The sum will return a string from postgres, convert to number
        return parseFloat(result.rows[0].total_usage || '0');
    } catch (error) {
        console.error(`Error calculating approved usage for employee ${employeeId}, type ${leaveTypeId}:`, error);
        throw error;
    }
}
// ---> END OF NEW FUNCTION <---

module.exports = {
  createLeaveRequest,
  getEmployeeLeaveHistory,
  getPendingRequestsForManager,
  updateRequestStatus,
  getRequestById,
  getApprovedUsageInPeriod, // <<<--- EXPORT
};