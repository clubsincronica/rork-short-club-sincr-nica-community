import { Pool } from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_FxzeKrR2h1Nc@ep-weathered-breeze-afhg974f-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkData() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const eventsRes = await pool.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 5');
    console.log('--- RECENT EVENTS ---');
    console.log(JSON.stringify(eventsRes.rows, null, 2));

    const usersRes = await pool.query('SELECT id, email, name, avatar, bio, updated_at FROM users ORDER BY updated_at DESC LIMIT 5');
    console.log('\n--- RECENTLY UPDATED USERS ---');
    console.log(JSON.stringify(usersRes.rows, null, 2));
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    pool.end();
  }
}

checkData();
