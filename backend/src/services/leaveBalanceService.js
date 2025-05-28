// src/services/leaveBalanceService.js
const dateFns = require('date-fns');
const pool = require('../config/db');
const employeeModel = require('../models/employeeModel');
const leaveRequestModel = require('../models/leaveRequestModel');
const leaveBalanceModel = require('../models/leaveBalanceModel');

// --- calculateAnnualLeaveAccrual (Keep As Is) ---
// Replace ONLY this function in leaveBalanceService.js
function calculateAnnualLeaveAccrual(employmentStartDate, monthlyAccrualRate, lastAccrualDate) {
    const rate = parseFloat(monthlyAccrualRate) || 0;
  
    if (!employmentStartDate || !(employmentStartDate instanceof Date) || isNaN(employmentStartDate.valueOf()) || rate <= 0) {
      console.log("[Accrual] Skipping calc: Invalid start date or zero/negative rate.");
      // Ensure we ALWAYS return the object structure
      const result = { totalAccrual: 0, newLastAccrualDate: lastAccrualDate };
      console.log("[Accrual] Returning default result:", result); // Add log here
      return result;
    }
  
    const today = new Date();
    const firstOfThisMonth = dateFns.startOfMonth(today);
    let calculationStartMonth = lastAccrualDate ? dateFns.addMonths(lastAccrualDate, 1) : dateFns.startOfMonth(employmentStartDate);
    const firstPossibleAccrualPostDate = dateFns.startOfMonth(dateFns.addMonths(employmentStartDate, 1));
    calculationStartMonth = dateFns.isBefore(calculationStartMonth, firstPossibleAccrualPostDate) ? firstPossibleAccrualPostDate : calculationStartMonth;
  
    let totalAccrual = 0;
    let finalAccrualDate = lastAccrualDate;
  
    if (!lastAccrualDate) { /* ... keep pro-rata logic as is ... */ }
  
    let currentAccrualPostDate = calculationStartMonth;
    while (dateFns.isBefore(currentAccrualPostDate, firstOfThisMonth)) { /* ... keep loop logic as is ... */ }
  
    const finalTotalAccrual = parseFloat(totalAccrual.toFixed(2));
    console.log(`[Accrual] Finished calculation. Total: ${finalTotalAccrual}. Last Date: ${finalAccrualDate ? dateFns.format(finalAccrualDate, 'yyyy-MM-dd') : 'None'}`);
  
    const finalResult = { totalAccrual: finalTotalAccrual, newLastAccrualDate: finalAccrualDate };
    console.log("[Accrual] Returning final calculated result:", finalResult); // Add log here
    return finalResult;
  }
  // Keep the rest of leaveBalanceService.js the same

// --- getSystemSetting (Keep As Is) ---
const settingsCache = {}; async function getSystemSetting(key, defaultValue = null) { /* ... keep existing ... */ }

// --- _checkSickLeaveLimit (Keep As Is) ---
async function _checkSickLeaveLimit(employeeId, employmentStartDate, currentBalanceData, leaveRequest, dbClient = pool) { /* ... keep existing ... */ }

// --- _checkStudyLeaveLimit (Keep As Is) ---
async function _checkStudyLeaveLimit(employeeId, currentBalanceData, leaveRequest, dbClient = pool) { /* ... keep existing ... */ }

/**
 * Fetches user balances and processes Annual Leave accrual AND Study Leave Reset.
 */
async function getProcessedUserBalances(employeeId) {
    console.log(`[SERVICE_BALANCE] START getProcessedUserBalances for ${employeeId}`); // <<< LOGGING
    const client = await pool.connect();
    console.log(`[SERVICE_BALANCE] DB client connected for ${employeeId}`); // <<< LOGGING
    try {
        await client.query('BEGIN');
        console.log(`[SERVICE_BALANCE] Transaction BEGIN for ${employeeId}`); // <<< LOGGING

        console.log(`[SERVICE_BALANCE] Fetching employee data for ${employeeId}`); // <<< LOGGING
        const employeeData = await employeeModel.findById(employeeId);
        if (!employeeData) throw new Error(`Employee not found: ${employeeId}`);
        console.log(`[SERVICE_BALANCE] Fetched employee data for ${employeeId}`); // <<< LOGGING

        console.log(`[SERVICE_BALANCE] Fetching raw balances for ${employeeId}`); // <<< LOGGING
        let rawBalances = await leaveBalanceModel.getRawUserBalances(employeeId, client);
        console.log(`[SERVICE_BALANCE] Fetched ${rawBalances.length} raw balances for ${employeeId}`); // <<< LOGGING

        // --- Annual Leave Accrual ---
        console.log(`[SERVICE_BALANCE] Checking Annual Leave accrual for ${employeeId}`); // <<< LOGGING
        if (employeeData.employmentStartDate && employeeData.annualLeaveAccrualRate > 0) {
            const annualLeaveBalance = rawBalances.find(b => b.leave_type_name === 'Annual Leave');
            if (annualLeaveBalance) {
                const lastAccrualDate = annualLeaveBalance.last_accrual_date ? new Date(annualLeaveBalance.last_accrual_date) : null;
                const employmentStartDate = employeeData.employmentStartDate instanceof Date ? employeeData.employmentStartDate : new Date(employeeData.employmentStartDate);
                const accrualResult = calculateAnnualLeaveAccrual(employmentStartDate, employeeData.annualLeaveAccrualRate, lastAccrualDate); // CALL accrual calc

                console.log(`[SERVICE_BALANCE] Accrual calc result for ${employeeId}:`, accrualResult); // <<< LOGGING

                if (accrualResult && accrualResult.totalAccrual > 0 && accrualResult.newLastAccrualDate) {
                    const newLastAccrualDateStr = accrualResult.newLastAccrualDate.toISOString().split('T')[0];
                    console.log(`[SERVICE_BALANCE] Updating Annual Leave accrual in DB for ${employeeId}`); // <<< LOGGING
                    await leaveBalanceModel.updateAnnualLeaveAccrual(employeeId, annualLeaveBalance.leave_type_id, accrualResult.totalAccrual, newLastAccrualDateStr, client); // CALL DB update
                    console.log(`[SERVICE_BALANCE] DB Update for Annual accrual complete for ${employeeId}`); // <<< LOGGING
                    rawBalances = rawBalances.map(b => { /* ... update balance in memory ... */ });
                }
            }
        } // --- End Annual Accrual ---

        // --- Study Leave Reset Check ---
        console.log(`[SERVICE_BALANCE] Checking Study Leave reset for ${employeeId}`); // <<< LOGGING
        const studyLeaveBalance = rawBalances.find(b => b.leave_type_name === 'Study Leave');
        if (studyLeaveBalance) {
             const lastResetDate = studyLeaveBalance.last_reset_date ? dateFns.startOfDay(new Date(studyLeaveBalance.last_reset_date)) : null;
             const currentYearStart = dateFns.startOfYear(new Date());
             if (!lastResetDate || dateFns.isBefore(lastResetDate, currentYearStart)) {
                 console.log(`[SERVICE_BALANCE] Study Leave Reset needed for ${employeeId}`); // <<< LOGGING
                 const limitDaysStr = await getSystemSetting('study_leave_days', '10'); // CALL DB setting
                 const limitDays = parseInt(limitDaysStr, 10);
                 if (!isNaN(limitDays)) {
                     const newResetDateStr = dateFns.format(currentYearStart, 'yyyy-MM-dd');
                     console.log(`[SERVICE_BALANCE] Updating Study Leave reset in DB for ${employeeId}`); // <<< LOGGING
                     await leaveBalanceModel.updateBalanceAndResetDate(employeeId, studyLeaveBalance.leave_type_id, limitDays, newResetDateStr, client); // CALL DB update
                     console.log(`[SERVICE_BALANCE] DB Update for Study reset complete for ${employeeId}`); // <<< LOGGING
                     rawBalances = rawBalances.map(b => { /* ... update balance in memory ... */ });
                 }
             }
        } // --- End Study Reset Check ---

        // --- TODO: Add Sick Leave Reset Check Here ---

        console.log(`[SERVICE_BALANCE] Committing transaction for ${employeeId}`); // <<< LOGGING
        await client.query('COMMIT'); // Commit transaction
        console.log(`[SERVICE_BALANCE] Transaction COMMIT complete for ${employeeId}`); // <<< LOGGING

        // Format final balances
         const formattedBalances = rawBalances.map(b => ({
            leaveTypeId: b.leave_type_id, name: b.leave_type_name, colorCode: b.colorCode,
            currentBalance: parseFloat(b.current_balance || '0').toFixed(2)
        }));
        console.log(`[SERVICE_BALANCE] Returning ${formattedBalances.length} processed balances for ${employeeId}`); // <<< LOGGING
        return formattedBalances; // <<< SUCCESSFUL RETURN

    } catch (error) {
        console.log(`[SERVICE_BALANCE] Entering CATCH block for ${employeeId}`); // <<< LOGGING
        await client.query('ROLLBACK');
        console.error(`[Service] Error processing balances for ${employeeId}:`, error);
        throw error; // Rethrow for controller
    } finally {
        console.log(`[SERVICE_BALANCE] Entering FINALLY block for ${employeeId}, releasing client.`); // <<< LOGGING
        client.release(); // Ensure client is always released
    }
}


/**
 * Main dispatcher function to check leave limits before approval.
 */
async function checkLeaveLimit(employeeId, leaveRequest) { /* ... keep existing correct version ... */ }

module.exports = {
  calculateAnnualLeaveAccrual,
  getProcessedUserBalances, // Export the orchestrator function
  checkLeaveLimit,
};