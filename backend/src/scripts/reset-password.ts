import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || '';
const email = 'matias.cazeaux@gmail.com';
const newPassword = 'Ballymote1';

if (!connectionString) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
    const client = await pool.connect();
    try {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        const result = await client.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name',
            [passwordHash, email]
        );
        if (result.rowCount === 0) {
            console.log(`❌ No user found for email: ${email}`);
        } else {
            const user = result.rows[0];
            console.log('✅ Password reset for user:');
            console.log(`  ID:   ${user.id}`);
            console.log(`  Email:${user.email}`);
            console.log(`  Name: ${user.name}`);
        }
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

resetPassword();
