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

async function fixMatiasEmail() {
    const oldEmail = 'matiascazeaux@gmail.com';
    const newEmail = 'matias.cazeaux@gmail.com';
    const client = await pool.connect();
    try {
        // Check if the new email already exists
        const exists = await client.query('SELECT id FROM users WHERE email = $1', [newEmail]);
        if (exists.rows.length > 0) {
            console.error(`❌ User with email ${newEmail} already exists. Aborting.`);
            process.exit(1);
        }
        // Update the email
        const res = await client.query('UPDATE users SET email = $1 WHERE email = $2 RETURNING id, email, name, role', [newEmail, oldEmail]);
        if (res.rows.length === 0) {
            console.error(`❌ No user found with email ${oldEmail}.`);
        } else {
            const user = res.rows[0];
            console.log('✅ Updated user:');
            console.log(`  ID:   ${user.id}`);
            console.log(`  Email:${user.email}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Role: ${user.role}`);
        }
    } catch (error) {
        console.error('Error updating user email:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixMatiasEmail();
