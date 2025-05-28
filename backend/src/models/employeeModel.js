// src/models/employeeModel.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

async function findByEmail(email) {
    if (!email) return null;
    const query = `SELECT employee_id, name, email, password_hash, is_admin, manager_id FROM employees WHERE email = $1;`;
    try { const result = await pool.query(query, [email]); if (result.rows.length > 0) { const user = result.rows[0]; return { employeeId: user.employee_id, name: user.name, email: user.email, passwordHash: user.password_hash, isAdmin: user.is_admin, managerId: user.manager_id }; } else { return null; } } catch (error) { console.error('Error fetching user by email:', error); throw error; }
 }
async function checkIsManager(employeeId) {
     if (!employeeId) return false; const query = `SELECT 1 FROM employees WHERE manager_id = $1 LIMIT 1;`; try { const result = await pool.query(query, [employeeId]); return result.rows.length > 0; } catch (error) { console.error(`Error checking manager status for employee ${employeeId}:`, error); throw error; }
 }
async function getAllEmployees() {
    const query = ` SELECT e.employee_id AS "employeeId", e.name, e.email, e.employment_start_date AS "employmentStartDate", e.manager_id AS "managerId", m.name AS "managerName", e.annual_leave_accrual_rate AS "annualLeaveAccrualRate", e.is_admin AS "isAdmin" FROM employees e LEFT JOIN employees m ON e.manager_id = m.employee_id ORDER BY e.name; `; try { const result = await pool.query(query); return result.rows; } catch (error) { console.error('Error fetching all employees:', error); throw error; }
}
async function findById(employeeId) {
    const query = ` SELECT e.employee_id AS "employeeId", e.name, e.email, e.employment_start_date AS "employmentStartDate", e.manager_id AS "managerId", m.name AS "managerName", e.annual_leave_accrual_rate AS "annualLeaveAccrualRate", e.is_admin AS "isAdmin" FROM employees e LEFT JOIN employees m ON e.manager_id = m.employee_id WHERE e.employee_id = $1; `; try { const result = await pool.query(query, [employeeId]); return result.rows.length > 0 ? result.rows[0] : null; } catch (error) { console.error(`Error fetching employee by ID ${employeeId}:`, error); throw error; }
}
async function createEmployee(employeeData) {
    const { employeeId, name, email, password, employmentStartDate, managerId, annualLeaveAccrualRate, isAdmin = false } = employeeData; if (!employeeId || !name || !email || !password || !employmentStartDate || annualLeaveAccrualRate === undefined) { throw new Error('Missing required fields.'); } const passwordHash = await bcrypt.hash(password, saltRounds); const query = ` INSERT INTO employees ( employee_id, name, email, password_hash, employment_start_date, manager_id, annual_leave_accrual_rate, is_admin ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING employee_id AS "employeeId", name, email, employment_start_date AS "employmentStartDate", manager_id AS "managerId", annual_leave_accrual_rate AS "annualLeaveAccrualRate", is_admin AS "isAdmin"; `; const values = [ employeeId, name, email, passwordHash, employmentStartDate, managerId || null, annualLeaveAccrualRate, isAdmin ]; try { const result = await pool.query(query, values); return result.rows[0]; } catch (error) { console.error('Error creating employee:', error); if (error.code === '23505') { throw new Error(`Employee ID or Email already exists.`); } throw error; }
}
async function updateEmployee(employeeId, updateData) {
    const { name, email, employmentStartDate, managerId, annualLeaveAccrualRate, isAdmin } = updateData; const fields = []; const values = []; let queryIndex = 1; if (name !== undefined) { fields.push(`name = $${queryIndex++}`); values.push(name); } if (email !== undefined) { fields.push(`email = $${queryIndex++}`); values.push(email); } if (employmentStartDate !== undefined) { fields.push(`employment_start_date = $${queryIndex++}`); values.push(employmentStartDate); } if (managerId !== undefined) { fields.push(`manager_id = $${queryIndex++}`); values.push(managerId || null); } if (annualLeaveAccrualRate !== undefined) { fields.push(`annual_leave_accrual_rate = $${queryIndex++}`); values.push(annualLeaveAccrualRate); } if (isAdmin !== undefined) { fields.push(`is_admin = $${queryIndex++}`); values.push(isAdmin); } if (fields.length === 0) { return findById(employeeId); } fields.push(`updated_at = NOW()`); const query = ` UPDATE employees SET ${fields.join(', ')} WHERE employee_id = $${queryIndex} RETURNING employee_id AS "employeeId", name, email, employment_start_date AS "employmentStartDate", manager_id AS "managerId", annual_leave_accrual_rate AS "annualLeaveAccrualRate", is_admin AS "isAdmin"; `; values.push(employeeId); try { const result = await pool.query(query, values); return result.rows.length > 0 ? result.rows[0] : null; } catch (error) { console.error(`Error updating employee ${employeeId}:`, error); if (error.code === '23505') { throw new Error(`Email already exists for another user.`); } throw error; }
 }

module.exports = { findByEmail, checkIsManager, getAllEmployees, findById, createEmployee, updateEmployee };