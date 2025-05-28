// src/models/leaveTypeModel.js
const pool = require('../config/db');

/**
 * Fetches all available leave types.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of leave type objects.
 */
async function getAllLeaveTypes() {
  const query = `
    SELECT
      leave_type_id AS "leaveTypeId",
      name,
      color_code AS "colorCode"
    FROM leave_types
    ORDER BY name;
  `;
  // Using aliases like "leaveTypeId" to return camelCase directly from SQL

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching leave types:', error);
    throw error;
  }
}

module.exports = {
  getAllLeaveTypes,
};