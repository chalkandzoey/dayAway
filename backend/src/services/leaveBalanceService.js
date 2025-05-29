// src/services/leaveBalanceService.js
const dateFns = require('date-fns');
const pool = require('../config/db');
const employeeModel = require('../models/employeeModel');
const leaveRequestModel = require('../models/leaveRequestModel');
const leaveBalanceModel = require('../models/leaveBalanceModel');

// --- calculateAnnualLeaveAccrual (Keep As Is) ---
function calculateAnnualLeaveAccrual(employmentStartDate, monthlyAccrualRate, lastAccrualDate) {
    const rate = parseFloat(monthlyAccrualRate) || 0;
    if (!employmentStartDate || !(employmentStartDate instanceof Date) || isNaN(employmentStartDate.valueOf()) || rate <= 0) {
        console.log("[Accrual] Skipping calc: Invalid start date or zero/negative rate.");
        const result = { totalAccrual: 0, newLastAccrualDate: lastAccrualDate };
        console.log("[Accrual] Returning default result:", result);
        return result;
    }
    const today = new Date(); const firstOfThisMonth = dateFns.startOfMonth(today);
    let calculationStartMonth = lastAccrualDate ? dateFns.addMonths(lastAccrualDate, 1) : dateFns.startOfMonth(employmentStartDate);
    const firstPossibleAccrualPostDate = dateFns.startOfMonth(dateFns.addMonths(employmentStartDate, 1));
    calculationStartMonth = dateFns.isBefore(calculationStartMonth, firstPossibleAccrualPostDate) ? firstPossibleAccrualPostDate : calculationStartMonth;
    let totalAccrual = 0; let finalAccrualDate = lastAccrualDate;
    if (!lastAccrualDate) {
        const startDayOfMonth = dateFns.getDate(employmentStartDate);
        if (startDayOfMonth > 1) {
            if (dateFns.isBefore(firstPossibleAccrualPostDate, firstOfThisMonth)) {
                const daysInStartMonth = dateFns.getDaysInMonth(employmentStartDate);
                const fractionOfMonthWorked = (daysInStartMonth - startDayOfMonth + 1) / daysInStartMonth;
                const proRataAmount = rate * fractionOfMonthWorked;
                totalAccrual += proRataAmount; finalAccrualDate = firstPossibleAccrualPostDate;
                console.log(`[Accrual] Applying pro-rata ${proRataAmount.toFixed(2)} for start month ${dateFns.format(employmentStartDate, 'yyyy-MM')}. Effective date: ${dateFns.format(firstPossibleAccrualPostDate, 'yyyy-MM-dd')}`);
                calculationStartMonth = dateFns.addMonths(firstPossibleAccrualPostDate, 1);
            }
        }
    }
    let currentAccrualPostDate = calculationStartMonth;
    while (dateFns.isBefore(currentAccrualPostDate, firstOfThisMonth)) {
        totalAccrual += rate; finalAccrualDate = currentAccrualPostDate;
        console.log(`[Accrual] Accruing full month ${rate} for month starting ${dateFns.format(dateFns.subMonths(currentAccrualPostDate, 1), 'yyyy-MM')}. Effective date: ${dateFns.format(currentAccrualPostDate, 'yyyy-MM-dd')}`);
        currentAccrualPostDate = dateFns.addMonths(currentAccrualPostDate, 1);
    }
    const finalTotalAccrual = parseFloat(totalAccrual.toFixed(2));
    console.log(`[Accrual] Finished calculation. Total: ${finalTotalAccrual}. Last Date: ${finalAccrualDate ? dateFns.format(finalAccrualDate, 'yyyy-MM-dd') : 'None'}`);
    const finalResult = { totalAccrual: finalTotalAccrual, newLastAccrualDate: finalAccrualDate };
    console.log("[Accrual] Returning final calculated result:", finalResult);
    return finalResult;
}

// --- getSystemSetting (Keep As Is) ---
const settingsCache = {};
async function getSystemSetting(key, defaultValue = null) {
    if (settingsCache[key] && settingsCache[key].timestamp > Date.now() - 60000) { // Cache for 1 min
        return settingsCache[key].value;
    }
    console.log(`[Settings] Cache miss or expired for ${key}, querying DB.`);
    try {
        const result = await pool.query('SELECT setting_value FROM system_settings WHERE setting_key = $1', [key]);
        if (result.rows.length > 0) {
            settingsCache[key] = { value: result.rows[0].setting_value, timestamp: Date.now() };
            return settingsCache[key].value;
        }
    } catch (error) {
        console.error(`Error fetching system setting ${key}:`, error);
    }
    return defaultValue;
}

// --- _checkSickLeaveLimit (MODIFIED with full reset logic) ---
async function _checkSickLeaveLimit(employeeId, employmentStartDate, currentBalanceData, leaveRequest, dbClient) {
    const limitDaysStr = await getSystemSetting('sick_leave_days', '30');
    const limitYearsStr = await getSystemSetting('sick_leave_years', '3');
    const limitDays = parseInt(limitDaysStr, 10);
    const limitYears = parseInt(limitYearsStr, 10);

    if (isNaN(limitDays) || isNaN(limitYears) || limitYears <= 0) {
        console.error("[Sick Check] Invalid Sick Leave settings in DB.");
        return { ok: false, message: "System configuration error for sick leave limits." };
    }

    const requestedDuration = parseFloat(leaveRequest.calculated_duration_days);
    let currentBalance = parseFloat(currentBalanceData?.current_balance || '0');
    // Ensure lastResetDate is start of day for comparisons
    const lastResetDate = currentBalanceData?.last_reset_date ? dateFns.startOfDay(new Date(currentBalanceData.last_reset_date)) : null;
    
    const requestStartDateObj = dateFns.startOfDay(new Date(leaveRequest.start_date));
    const empStartDateObj = dateFns.startOfDay(employmentStartDate);

    // Determine the start date of the N-year cycle this request falls into
    let currentCycleStartDate = empStartDateObj;
    while (dateFns.isSameDay(requestStartDateObj, currentCycleStartDate) || dateFns.isAfter(requestStartDateObj, dateFns.addYears(currentCycleStartDate, limitYears))) {
        currentCycleStartDate = dateFns.addYears(currentCycleStartDate, limitYears);
    }
     // If requestStartDate is *before* the calculated next cycle start, it means it belongs to the *previous* cycle.
    if (dateFns.isBefore(requestStartDateObj, currentCycleStartDate) && !dateFns.isSameDay(requestStartDateObj, currentCycleStartDate)) {
        currentCycleStartDate = dateFns.subYears(currentCycleStartDate, limitYears);
    }
    
    console.log(`[Sick Check] Emp Start: ${dateFns.formatISO(empStartDateObj)}, Request Start: ${dateFns.formatISO(requestStartDateObj)}, Current Cycle Start Date: ${dateFns.formatISO(currentCycleStartDate)}`);

    // Reset logic: if last_reset_date is null or before the start of this request's true cycle start, reset.
    if (!lastResetDate || dateFns.isBefore(lastResetDate, currentCycleStartDate)) {
        console.log(`[Sick Check] Reset needed for employee ${employeeId}. Last reset: ${lastResetDate ? dateFns.formatISO(lastResetDate) : 'None'}, Current cycle start: ${dateFns.formatISO(currentCycleStartDate)}`);
        const newResetDateStr = dateFns.format(currentCycleStartDate, 'yyyy-MM-dd');
        await leaveBalanceModel.updateBalanceAndResetDate(employeeId, leaveRequest.leave_type_id, limitDays, newResetDateStr, dbClient);
        currentBalance = limitDays; // Balance is now the full limit
        console.log(`[Sick Check] Balance for ${employeeId} reset to ${currentBalance}, last_reset_date updated to ${newResetDateStr}`);
    } else {
        console.log(`[Sick Check] No reset needed for employee ${employeeId}. Last reset: ${lastResetDate ? dateFns.formatISO(lastResetDate) : 'None'}`);
    }

    // 1. Check current balance (after potential reset)
    if (currentBalance < requestedDuration) {
        return { ok: false, message: `Request exceeds Sick Leave balance (Current: ${currentBalance.toFixed(2)}, Requested: ${requestedDuration}).` };
    }

    // 2. Check usage within the current cycle
    // Usage period is from the start of the current cycle up to the day *before* the new request starts
    const usagePeriodStartStr = dateFns.format(currentCycleStartDate, 'yyyy-MM-dd');
    const usagePeriodEndStr = dateFns.format(dateFns.subDays(requestStartDateObj, 1), 'yyyy-MM-dd');
    
    let usageInCycle = 0;
    // Only calculate usage if the period is valid (start is before end)
    if (dateFns.isBefore(currentCycleStartDate, requestStartDateObj)) {
        usageInCycle = await leaveRequestModel.getApprovedUsageInPeriod(
            employeeId, leaveRequest.leave_type_id, usagePeriodStartStr, usagePeriodEndStr
        );
    }

    console.log(`[Sick Check] Usage in cycle [${usagePeriodStartStr} - ${usagePeriodEndStr}]: ${usageInCycle}, Requesting: ${requestedDuration}, Limit: ${limitDays}`);

    if (usageInCycle + requestedDuration > limitDays) {
        return { ok: false, message: `Request exceeds Sick Leave usage limit for the current ${limitYears}-year cycle (Limit: ${limitDays}, Used in cycle: ${usageInCycle.toFixed(2)}, Requested: ${requestedDuration}).` };
    }

    return { ok: true, message: "Sick leave within limits." };
}

// --- _checkStudyLeaveLimit (Keep As Is - already includes reset) ---
async function _checkStudyLeaveLimit(employeeId, currentBalanceData, leaveRequest, dbClient = pool) { /* ... keep existing correct logic ... */ }

// --- _checkFamilyLeaveLimit (Keep As Is - already includes reset) ---
async function _checkFamilyLeaveLimit(employeeId, employmentStartDate, currentBalanceData, leaveRequest, dbClient) { /* ... keep existing correct logic ... */ }

// --- _checkPerEventLimit (Keep As Is) ---
async function _checkPerEventLimit(currentBalanceData, leaveRequest, limitSettingKey, leaveTypeName) { /* ... keep existing correct logic ... */ }


// --- getProcessedUserBalances (MODIFIED for proactive Sick Leave Reset) ---
async function getProcessedUserBalances(employeeId) {
    console.log(`[Service] getProcessedUserBalances called for ${employeeId}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const employeeData = await employeeModel.findById(employeeId);
        if (!employeeData) throw new Error(`Employee not found: ${employeeId}`);
        let rawBalances = await leaveBalanceModel.getRawUserBalances(employeeId, client);

        // --- Annual Leave Accrual (same as before) ---
        if (employeeData.employmentStartDate && employeeData.annualLeaveAccrualRate > 0) { /* ... */ }

        // --- Study Leave Reset Check (same as before - calls _checkStudyLeaveLimit) ---
        const studyLeaveBalanceData = rawBalances.find(b => b.leave_type_name === 'Study Leave');
        if (studyLeaveBalanceData && studyLeaveBalanceData.leave_type_id) {
            // Call checker function which includes reset, pass dummy request-like object
            // to trigger reset based on today's date if necessary.
            await _checkStudyLeaveLimit(employeeId, studyLeaveBalanceData, { start_date: dateFns.format(new Date(), 'yyyy-MM-dd'), leave_type_id: studyLeaveBalanceData.leave_type_id, calculated_duration_days: 0 }, client);
            // Re-fetch raw balances after potential reset by the checker
            rawBalances = await leaveBalanceModel.getRawUserBalances(employeeId, client);
        }

        // --- Sick Leave Reset Check (NEW) ---
        const sickLeaveBalanceData = rawBalances.find(b => b.leave_type_name === 'Sick Leave');
        if (sickLeaveBalanceData && sickLeaveBalanceData.leave_type_id && employeeData.employmentStartDate) {
            // Call checker function which includes reset, pass dummy request-like object
            await _checkSickLeaveLimit(employeeId, new Date(employeeData.employmentStartDate), sickLeaveBalanceData, { start_date: dateFns.format(new Date(), 'yyyy-MM-dd'), leave_type_id: sickLeaveBalanceData.leave_type_id, calculated_duration_days: 0 }, client);
            rawBalances = await leaveBalanceModel.getRawUserBalances(employeeId, client);
        }

        // --- Family Responsibility Leave Reset Check (same as before - calls _checkFamilyLeaveLimit) ---
        const familyLeaveBalanceData = rawBalances.find(b => b.leave_type_name === 'Family Responsibility Leave');
        if (familyLeaveBalanceData && familyLeaveBalanceData.leave_type_id && employeeData.employmentStartDate) {
             await _checkFamilyLeaveLimit(employeeId, new Date(employeeData.employmentStartDate), familyLeaveBalanceData, { start_date: dateFns.format(new Date(), 'yyyy-MM-dd'), leave_type_id: familyLeaveBalanceData.leave_type_id, calculated_duration_days: 0 }, client);
             rawBalances = await leaveBalanceModel.getRawUserBalances(employeeId, client);
        }

        await client.query('COMMIT');
        return rawBalances.map(b => ({
            leaveTypeId: b.leave_type_id, name: b.leave_type_name, colorCode: b.colorCode,
            currentBalance: parseFloat(b.current_balance || '0').toFixed(2)
        }));
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[Service] Error processing balances for ${employeeId}:`, error);
        throw error;
    } finally {
        client.release();
    }
}


// --- checkLeaveLimit (Dispatcher - Keep As Is, it calls the updated _check... functions) ---
async function checkLeaveLimit(employeeId, leaveRequest) { /* ... keep existing correct logic ... */ }

module.exports = { calculateAnnualLeaveAccrual, getProcessedUserBalances, checkLeaveLimit };