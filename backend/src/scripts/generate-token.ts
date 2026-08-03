import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const connectionString = process.env.DATABASE_URL || '';
const JWT_SECRET = process.env.JWT_SECRET;

if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET must be set. Refusing to sign a token with a known fallback secret.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function generateToken() {
    const client = await pool.connect();

    try {
        console.log('🔍 Looking up matias.cazeaux@gmail.com in database...\n');

        const result = await client.query(
            'SELECT id, email, name, role FROM users WHERE email = $1',
            ['matias.cazeaux@gmail.com']
        );

        if (result.rows.length === 0) {
            console.error('❌ User not found');
            process.exit(1);
        }

        const user = result.rows[0];
        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}\n`);

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        console.log('='.repeat(80));
        console.log('JWT TOKEN:');
        console.log('='.repeat(80));
        console.log(token);
        console.log('='.repeat(80));
        console.log('\n📋 Copy the token above and paste it into admin-api-tester.html');
        console.log('\nOr run this command to test all endpoints:');
        console.log(`node scripts/quick-admin-test.js ${token}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

generateToken();
