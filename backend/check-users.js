require('dotenv').config();
const { Pool } = require('pg');

async function checkUsers() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Checking users table...\n');
    
    const result = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    
    console.log('Users in database:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
