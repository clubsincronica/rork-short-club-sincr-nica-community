require('dotenv').config();
const { Pool } = require('pg');

async function fixUserIds() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    console.log('Make sure you run this from the backend directory with a .env file');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Current users in database:');
    const before = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    console.table(before.rows);
    
    console.log('\n🔄 Swapping user IDs...');
    console.log('   Tomas (currently ID 1) → will become ID 2');
    console.log('   Matias (currently ID 2) → will become ID 1');
    
    // Use a transaction to swap IDs safely
    await pool.query('BEGIN');
    
    // Temporarily set IDs to negative to avoid conflicts
    await pool.query('UPDATE users SET id = -1 WHERE id = 1');
    await pool.query('UPDATE users SET id = -2 WHERE id = 2');
    
    // Now swap them
    await pool.query('UPDATE users SET id = 2 WHERE id = -1');
    await pool.query('UPDATE users SET id = 1 WHERE id = -2');
    
    // Reset the sequence to continue from 3
    await pool.query("SELECT setval('users_id_seq', 2, true)");
    
    await pool.query('COMMIT');
    
    console.log('\n✅ User IDs swapped successfully!');
    
    console.log('\nNew users in database:');
    const after = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    console.table(after.rows);
    
    console.log('\n📝 Now the database matches the frontend:');
    console.log('   ID 1: Tomas De La Llosa (tom_weasley@hotmail.com)');
    console.log('   ID 2: Matias Cazeaux (matias.cazeaux@gmail.com)');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixUserIds();
