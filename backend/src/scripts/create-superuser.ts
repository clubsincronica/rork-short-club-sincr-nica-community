import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
    console.error('❌ DATABASE_URL not set. Cannot create superuser.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const SUPERUSER_EMAIL = 'matias.cazeaux@gmail.com';

async function createSuperUser() {
    const client = await pool.connect();

    try {
        console.log(`🔍 Looking for user: ${SUPERUSER_EMAIL}...`);

        // Check if user exists
        const result = await client.query(
            'SELECT id, email, name, role FROM users WHERE email = $1',
            [SUPERUSER_EMAIL]
        );

        if (result.rows.length === 0) {
            console.error(`❌ User ${SUPERUSER_EMAIL} not found in database.`);
            console.log('💡 Please ensure this user has registered in the app first.');
            process.exit(1);
        }

        const user = result.rows[0];
        console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);

        // Update role to superuser
        console.log('🔄 Elevating to superuser...');
        await client.query(
            'UPDATE users SET role = $1 WHERE id = $2',
            ['superuser', user.id]
        );

        console.log('✅ Successfully elevated to superuser!');
        console.log(`📊 User Details:`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Role: superuser`);

    } catch (error) {
        console.error('❌ Failed to create superuser:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createSuperUser().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
