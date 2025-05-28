// src/utils/leaveCalculator.js

/**
 * Calculates the duration of leave in working days, excluding weekends and public holidays.
 * Handles half days on start/end dates.
 * @param {string} startDateStr - Start date 'YYYY-MM-DD'
 * @param {string} endDateStr - End date 'YYYY-MM-DD'
 * @param {boolean} isStartHalfDay - True if start date is a half day
 * @param {boolean} isEndHalfDay - True if end date is a half day
 * @param {Array<string>} holidayDateStrings - Array of public holiday dates ['YYYY-MM-DD']
 * @returns {number} The calculated duration in days (e.g., 4.5)
 */
function calculateLeaveDuration(startDateStr, endDateStr, isStartHalfDay, isEndHalfDay, holidayDateStrings = []) {
    let duration = 0;
    const holidays = new Set(holidayDateStrings); // Use a Set for efficient lookup
    const start = new Date(startDateStr + 'T00:00:00Z'); // Use UTC to avoid timezone issues
    const end = new Date(endDateStr + 'T00:00:00Z');
  
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      throw new Error('Invalid start or end date.');
    }
  
    let currentDate = new Date(start);
  
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
      const currentDateStr = currentDate.toISOString().split('T')[0];
  
      // Check if it's a weekend or a public holiday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.has(currentDateStr);
  
      if (!isWeekend && !isHoliday) {
        // It's a working day
        let dayValue = 1.0;
  
        // Handle half days ONLY if they fall on this specific working day
        if (currentDateStr === startDateStr && isStartHalfDay) {
          dayValue -= 0.5;
        }
        // Check end half day ONLY if start/end are different dates OR if it's the same date
        if (currentDateStr === endDateStr && isEndHalfDay && startDateStr !== endDateStr) {
            dayValue -= 0.5;
        }
        // If start/end same date and BOTH half days, result is 0 for that day (1.0 - 0.5 - 0.5)
        else if (currentDateStr === endDateStr && isEndHalfDay && startDateStr === endDateStr && isStartHalfDay) {
           dayValue -= 0.5; // Already subtracted 0.5 for start half day
        }
  
  
        // Ensure dayValue doesn't go below zero if both flags are true on the same day
        duration += Math.max(0, dayValue);
      }
  
      // Move to the next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  
    return duration;
  }
  
  module.exports = {
    calculateLeaveDuration,
  };