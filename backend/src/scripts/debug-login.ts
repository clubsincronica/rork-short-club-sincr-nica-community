import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to find .env (copied from emergency-fix-user.ts)
const possiblePaths = [
    path.join(process.cwd(), 'backend', '.env'),
    path.join(process.cwd(), '.env')
];

let envPath = '';
for (const p of possiblePaths) {
    try {
        if (fs.existsSync(p)) {
            envPath = p;
            break;
        }
    } catch (e) { /* ignore */ }
}

if (envPath) {
    console.log(`Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });
}

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const TARGET_EMAIL = process.argv[2];
const CHECK_PASSWORD = process.argv[3];

if (!TARGET_EMAIL || !CHECK_PASSWORD) {
    console.log('Usage: npx ts-node src/scripts/debug-login.ts <email> <password>');
    process.exit(1);
}

async function debugLogin() {
    const client = await pool.connect();
    try {
        console.log(`🔍 Checking login for: ${TARGET_EMAIL}`);
        console.log(`🔑 Password provided (raw): '${CHECK_PASSWORD}'`);

        // 1. Get User
        const res = await client.query('SELECT * FROM users WHERE email = $1', [TARGET_EMAIL]);
        if (res.rows.length === 0) {
            console.error('❌ User not found in database!');
            return;
        }

        const user = res.rows[0];
        console.log(`✅ User found: ID ${user.id}, Email ${user.email}`);
        console.log(`📂 DB Role: ${user.role}`);
        console.log(`🔒 DB Password Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);

        if (!user.password_hash) {
            console.error('❌ User has no password hash set!');
            return;
        }

        // 2. Compare
        const match = await bcrypt.compare(CHECK_PASSWORD, user.password_hash);
        if (match) {
            console.log('✅ SUCCESS: Password matches hash!');
        } else {
            console.error('❌ FAILURE: Password does NOT match hash.');
            console.log('💡 Tip: If you set the password via CLI with special characters (like !), they might have been lost or changed by the shell.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

debugLogin();
