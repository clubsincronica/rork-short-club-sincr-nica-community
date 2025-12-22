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

async function deleteUser() {
    const email = process.argv[2] || 'matiascazeaux@gmail.com';
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM users WHERE email = $1 RETURNING id, email, name, role', [email]);
        if (result.rowCount === 0) {
            console.log(`❌ No user found for email: ${email}`);
        } else {
            const user = result.rows[0];
            console.log('✅ Deleted user:');
            console.log(`  ID:   ${user.id}`);
            console.log(`  Email:${user.email}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Role: ${user.role}`);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

deleteUser();
