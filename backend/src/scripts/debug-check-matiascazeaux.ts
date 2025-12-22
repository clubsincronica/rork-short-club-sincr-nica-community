import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function debugCheckUser() {
    const email = 'matiascazeaux@gmail.com';
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.log(`✅ No user found for email: ${email}`);
        } else {
            const user = result.rows[0];
            console.log('❌ User found:');
            console.log(`  ID:   ${user.id}`);
            console.log(`  Email:${user.email}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Role: ${user.role}`);
        }
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

debugCheckUser();
