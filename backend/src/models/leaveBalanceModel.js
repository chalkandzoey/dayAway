// src/models/leaveBalanceModel.js
const pool = require('../config/db');
// NOTE: Removed employeeModel require, not needed directly in this refactored model
// NOTE: Removed leaveBalanceService require, breaking circular dependency

/**
 * Fetches raw leave balances for a specific employee JOINED with leave type info.
 */
async function getRawUserBalances(employeeId, dbClient = pool) {
  if (!employeeId) throw new Error('Employee ID is required.');
  // Fetch current balances including necessary fields for accrual check later
  const balanceQuery = `
    SELECT
      lb.leave_type_id,
      lb.current_balance,
      lb.last_accrual_date,
      lb.last_reset_date,
      lt.name AS leave_type_name,
      lt.color_code AS "colorCode"
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
    WHERE lb.employee_id = $1;
  `;
  try {
    // Ensure this line uses the correct variable name 'balanceQuery'
    const balanceResult = await dbClient.query(balanceQuery, [employeeId]);
    // Return raw rows - service layer will format/process
    return balanceResult.rows;
  } catch (error) {
    console.error(`Error fetching raw balances for employee ${employeeId}:`, error);
    throw error;
  }
}

/**
 * Updates the Annual Leave balance and last accrual date after calculation.
 */
async function updateAnnualLeaveAccrual(employeeId, leaveTypeId, amountToAdd, newLastAccrualDateStr, dbClient = pool) {
   if (!employeeId || !leaveTypeId || amountToAdd === undefined || !newLastAccrualDateStr) throw new Error('Missing required parameters.');
   console.log(`[updateAnnualLeaveAccrual] Updating DB for ${employeeId}, Type ${leaveTypeId}. Adding: ${amountToAdd}, New Date: ${newLastAccrualDateStr}`);
   const updateQuery = ` UPDATE leave_balances SET current_balance = current_balance + $1, last_accrual_date = $2 WHERE employee_id = $3 AND leave_type_id = $4; `;
   try { await dbClient.query(updateQuery, [amountToAdd, newLastAccrualDateStr, employeeId, leaveTypeId]); }
   catch(error) { console.error(`Error updating annual leave accrual for ${employeeId}:`, error); throw error; }
}

/**
 * Deducts leave duration from an employee's balance for a specific leave type.
 */
async function deductLeaveBalance(employeeId, leaveTypeId, durationToDeduct) {
   if (!employeeId || !leaveTypeId || durationToDeduct === undefined || durationToDeduct <= 0) throw new Error('Valid Employee ID, Leave Type ID, and positive Duration required.');
   const query = ` UPDATE leave_balances SET current_balance = current_balance - $1 WHERE employee_id = $2 AND leave_type_id = $3 RETURNING *; `;
   try { const result = await pool.query(query, [durationToDeduct, employeeId, leaveTypeId]); if (result.rows.length > 0) return result.rows[0]; else { console.warn(`No balance record found to deduct from for employee ${employeeId}, type ${leaveTypeId}.`); return null; } }
   catch (error) { console.error(`Error deducting leave balance for employee ${employeeId}, type ${leaveTypeId}:`, error); throw error; }
}

/**
 * Creates initial zero-balance records for all applicable leave types for a new employee.
 */
async function initializeBalancesForEmployee(employeeId) {
    if (!employeeId) throw new Error('Employee ID required'); const getTypesQuery = 'SELECT leave_type_id FROM leave_types WHERE is_system_type = TRUE;'; const client = await pool.connect(); try { await client.query('BEGIN'); const typesResult = await client.query(getTypesQuery); const leaveTypeIds = typesResult.rows.map(row => row.leave_type_id); if (leaveTypeIds.length === 0) { console.warn("No leave types found"); await client.query('COMMIT'); return; } const insertPromises = leaveTypeIds.map(typeId => { const insertQuery = ` INSERT INTO leave_balances (employee_id, leave_type_id, current_balance) VALUES ($1, $2, 0.0) ON CONFLICT (employee_id, leave_type_id) DO NOTHING; `; return client.query(insertQuery, [employeeId, typeId]); }); await Promise.all(insertPromises); await client.query('COMMIT'); console.log(`Initialized balances for employee ${employeeId} for ${leaveTypeIds.length} leave types.`); } catch (error) { await client.query('ROLLBACK'); console.error(`Error initializing balances for employee ${employeeId}:`, error); throw error; } finally { client.release(); }
 }

// ---> ADD THIS NEW FUNCTION <---
/**
 * Updates a specific leave balance AND its last reset date.
 * Used for leave types that reset periodically (Study, Sick, Family).
 * @param {string} employeeId
 * @param {number} leaveTypeId
 * @param {number} newBalance - The balance to reset to (usually the limit).
 * @param {string} newResetDateStr - The date the reset occurred ('YYYY-MM-DD').
 * @param {object} [dbClient=pool] - Optional database client for transactions.
 * @returns {Promise<void>}
 */
async function updateBalanceAndResetDate(employeeId, leaveTypeId, newBalance, newResetDateStr, dbClient = pool) {
    if (!employeeId || !leaveTypeId || newBalance === undefined || !newResetDateStr) {
        throw new Error('Missing required parameters for balance reset.');
    }
    console.log(`[updateBalanceAndResetDate] Resetting balance for ${employeeId}, Type ${leaveTypeId} to ${newBalance}. New Reset Date: ${newResetDateStr}`);
    const query = `
        UPDATE leave_balances
        SET
          current_balance = $1,
          last_reset_date = $2
        WHERE employee_id = $3 AND leave_type_id = $4;
    `;
    try {
        const result = await dbClient.query(query, [newBalance, newResetDateStr, employeeId, leaveTypeId]);
        if (result.rowCount === 0) {
            console.warn(`[updateBalanceAndResetDate] No balance record found for employee ${employeeId}, leave type ${leaveTypeId}. Could not apply reset.`);
            // Optionally, insert a record here? For now, just warn.
        }
    } catch (error) {
        console.error(`Error resetting balance for employee ${employeeId}, type ${leaveTypeId}:`, error);
        throw error;
    }
}
// ---> END OF NEW FUNCTION <---

module.exports = {
  getRawUserBalances,
  updateAnnualLeaveAccrual,
  deductLeaveBalance,
  initializeBalancesForEmployee,
  updateBalanceAndResetDate, // <<<--- EXPORT
};