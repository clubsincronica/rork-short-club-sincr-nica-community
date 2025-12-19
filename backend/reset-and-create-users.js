// reset-and-create-users.js
// Usage: node reset-and-create-users.js
// This script will DELETE all users, conversations, and messages, then re-create only the correct test users.

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_FxzeKrR2h1Nc@ep-weathered-breeze-afhg974f-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const USERS = [
  {
    email: 'tom_weasley@hotmail.com',
    password: 'Ballymote1.',
    name: 'Tomas De La Llosa'
  },
  {
    email: 'matias.cazeaux@gmail.com',
    password: 'password123',
    name: 'Matias Cazeaux'
  },
  {
    email: 'eu.larra@gmail.com',
    password: 'password123',
    name: 'Eu Larra'
  }
];

const bcrypt = require('bcrypt');

async function resetAndCreateUsers() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    console.log('⚠️  Deleting all messages, conversations, and users...');
    await pool.query('DELETE FROM messages');
    await pool.query('DELETE FROM conversations');
    await pool.query('DELETE FROM users');
    await pool.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    console.log('✅ All old data deleted.');

    for (const user of USERS) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const res = await pool.query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id` ,
        [user.email, passwordHash, user.name]
      );
      console.log(`✅ Created user: ${user.name} (${user.email}) with ID ${res.rows[0].id}`);
    // Set location for nearby users testing
    const lat = 40.4168 + Math.random() * 0.01; // Madrid area
    const lng = -3.7038 + Math.random() * 0.01;
    await pool.query(
      'UPDATE users SET latitude = $1, longitude = $2 WHERE email = $3',
      [lat, lng, user.email]
    );
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await pool.end();
    console.log('All done!');
  }
}

resetAndCreateUsers();
