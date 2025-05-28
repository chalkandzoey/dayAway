// src/models/publicHolidayModel.js
const pool = require('../config/db');

/**
 * Fetches public holiday dates within a given date range.
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate - 'YYYY-MM-DD'
 * @returns {Promise<Array<string>>} A promise that resolves to an array of holiday date strings ('YYYY-MM-DD').
 */
async function getHolidaysBetweenDates(startDate, endDate) {
  // ---> ADD LOGGING HERE if still debugging apply leave, otherwise can remove <---
  // console.log('[publicHolidayModel] getHolidaysBetweenDates called with:');
  // console.log('[publicHolidayModel] startDate:', startDate, '(type:', typeof startDate, ')');
  // console.log('[publicHolidayModel] endDate:', endDate, '(type:', typeof endDate, ')');
  // ---> END OF LOGGING <---

  const query = `
    SELECT holiday_date
    FROM public_holidays
    WHERE holiday_date >= $1 AND holiday_date <= $2;
  `;
  try {
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows.map(row => {
      // Ensure date is formatted correctly if it's a Date object
      if (row.holiday_date instanceof Date) {
        return row.holiday_date.toISOString().split('T')[0];
      }
      return row.holiday_date; // Assume it's already a string 'YYYY-MM-DD'
    });
  } catch (error) {
    console.error('Error fetching public holidays:', error);
    throw error;
  }
}

// ---> ADD THIS NEW FUNCTION <---
/**
 * Bulk inserts or updates public holidays.
 * If a holiday on the same date exists, it updates the name.
 * @param {Array<object>} holidaysArray - Array of { holiday_date: 'YYYY-MM-DD', name: 'Holiday Name' }
 * @returns {Promise<{ importedCount: number, updatedCount: number, failedCount: number, errors: Array<string> }>}
 */
async function bulkInsertHolidays(holidaysArray) {
  if (!Array.isArray(holidaysArray) || holidaysArray.length === 0) {
    return { importedCount: 0, updatedCount: 0, failedCount: 0, errors: ['No holidays provided.'] };
  }

  const client = await pool.connect();
  let importedCount = 0;
  let updatedCount = 0;
  const errors = [];

  try {
    await client.query('BEGIN');

    for (const holiday of holidaysArray) {
      if (!holiday.holiday_date || !holiday.name) {
        errors.push(`Skipped invalid record: ${JSON.stringify(holiday)}`);
        continue;
      }
      // Ensure date is in YYYY-MM-DD format (controller should handle this)
      const query = `
        INSERT INTO public_holidays (holiday_date, name)
        VALUES ($1, $2)
        ON CONFLICT (holiday_date) DO UPDATE
        SET name = EXCLUDED.name
        RETURNING (xmax = 0) AS inserted; 
        -- xmax = 0 indicates an INSERT, otherwise it was an UPDATE (or nothing if tuple unchanged by update)
        -- For more precise update count, might need separate SELECT then INSERT/UPDATE logic or more complex CTE.
        -- This simplified version counts any successful upsert.
      `;
      try {
        const res = await client.query(query, [holiday.holiday_date, holiday.name]);
        if (res.rows.length > 0) {
            if (res.rows[0].inserted) {
                importedCount++;
            } else {
                // This counts an UPDATE if the name changed, or if it was an update that resulted in the same values.
                // A more robust way to count updates vs. no-ops would be to compare old and new names.
                // For simplicity, we'll count any ON CONFLICT DO UPDATE as a potential update.
                updatedCount++;
            }
        }
      } catch (err) {
        errors.push(`Failed to insert/update ${holiday.name} on ${holiday.holiday_date}: ${err.message}`);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during bulk holiday insert transaction:', error);
    errors.push('Transaction failed: ' + error.message);
    // Reset counts if transaction fails globally
    importedCount = 0;
    updatedCount = 0;
  } finally {
    client.release();
  }
  return { importedCount, updatedCount, failedCount: errors.length, errors };
}
// ---> END OF NEW FUNCTION <---

module.exports = {
  getHolidaysBetweenDates,
  bulkInsertHolidays, // <<<--- EXPORT THE NEW FUNCTION
};