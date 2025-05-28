// src/config/db.js
const { Pool } = require('pg');

// Ensure environment variables are loaded
// NOTE: require('dotenv').config() should have already run in app.js
// If running this file standalone for tests, you might need:
// require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

console.log(`Attempting to connect to DB host: ${process.env.DB_HOST}`); // Log host being used

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, // Should be 'dayaway_db' from docker-compose/env_file
  database: process.env.PGDATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10), // Default to 5432 if not set
  // Optional settings for the pool:
  // max: 10, // Max number of connections in the pool
  // idleTimeoutMillis: 30000, // How long a connection can be idle before being closed
  // connectionTimeoutMillis: 5000, // How long to wait for a connection attempt (ms)
});

// Let's add an event listener for errors on idle clients
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle database client', err);
  // Recommended action: exit the process for robustness
  process.exit(-1);
});

// Test the connection by getting the current time from the DB
// We'll export a function to do this so it can be called on startup
async function testConnection() {
  let client; // Define client outside try block
  try {
    // Get a client from the pool
    client = await pool.connect();
    console.log('Attempting test query...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database Connected Successfully. Current time from DB:', result.rows[0].now);
  } catch (err) {
    console.error('❌ Database Connection Failed!', err.stack);
  } finally {
    // Make sure to release the client connection back to the pool
    if (client) {
      client.release();
      console.log('Test connection client released.');
    }
  }
}

// Call the test function immediately when the module loads
// (Alternatively, you could call this function from app.js after importing the pool)
testConnection();

// Export the pool itself so other parts of the app can use it to run queries
module.exports = pool;

// If you prefer to export a query function:
// module.exports = {
//   query: (text, params) => pool.query(text, params),
// };