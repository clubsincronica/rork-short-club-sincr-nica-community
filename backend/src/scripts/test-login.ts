import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL || '';
const email = 'matias.cazeaux@gmail.com';
const passwordToTest = process.argv[2] || 'Ballymote1';

if (!connectionString) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function testLogin() {
    const client = await pool.connect();
    try {
        console.log(`🔍 Testing login for: ${email}`);
        console.log(`🔑 Testing password: ${passwordToTest}`);

        const result = await client.query(
            'SELECT id, email, name, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log(`❌ User not found for email: ${email}`);
            return;
        }

        const user = result.rows[0];
        console.log(`\n✅ User found:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Has password hash: ${user.password_hash ? 'YES' : 'NO'}`);
        console.log(`  Hash length: ${user.password_hash ? user.password_hash.length : 0}`);

        if (!user.password_hash) {
            console.log(`\n❌ User has no password set!`);
            return;
        }

        const isMatch = await bcrypt.compare(passwordToTest, user.password_hash);

        if (isMatch) {
            console.log(`\n✅ PASSWORD MATCHES! Login would succeed.`);
        } else {
            console.log(`\n❌ PASSWORD DOES NOT MATCH! Login would fail.`);
            console.log(`\nTry running the reset-password script again.`);
        }

    } catch (error) {
        console.error('Error testing login:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

testLogin();
