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

async function listMatiasUsers() {
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT id, email, name FROM users WHERE email LIKE '%matias%'");
        if (result.rows.length === 0) {
            console.log('No users found with email containing "matias".');
        } else {
            console.log('Users with email containing "matias":');
            result.rows.forEach(user => {
                console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
            });
        }
    } catch (error) {
        console.error('Error querying users:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

listMatiasUsers();
