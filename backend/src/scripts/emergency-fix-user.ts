import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to find .env in likely locations
const possiblePaths = [
    path.join(process.cwd(), 'backend', '.env'),
    path.join(process.cwd(), '.env')
];

let envPath = '';
for (const p of possiblePaths) {
    // Check if path exists (ignoring __dirname error if in ESM)
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
} else {
    console.warn('⚠️ Could not find .env file. Checking standard locations...');
}

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
    console.error('❌ DATABASE_URL not set. Cannot run fix script.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const TARGET_EMAIL = process.argv[2];
const NEW_PASSWORD = process.argv[3];
const SET_ROLE = process.argv[4]; // Optional: 'superuser', 'admin', 'user'

if (!TARGET_EMAIL || !NEW_PASSWORD) {
    console.log('Usage: npx ts-node src/scripts/emergency-fix-user.ts <email> <new_password> [role]');
    process.exit(1);
}

async function fixUser() {
    const client = await pool.connect();

    try {
        console.log(`🔍 Fixing user: ${TARGET_EMAIL}...`);

        // 1. Check if user exists
        const checkResult = await client.query('SELECT * FROM users WHERE email = $1', [TARGET_EMAIL]);

        if (checkResult.rows.length === 0) {
            console.error(`❌ User ${TARGET_EMAIL} not found!`);
            process.exit(1);
        }

        const user = checkResult.rows[0];
        console.log(`✅ User found: ID ${user.id}, Role: ${user.role || 'undefined'}`);

        // 2. Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

        // 3. Prepare update query
        let query = 'UPDATE users SET password_hash = $1, updated_at = NOW()';
        let params: any[] = [hashedPassword];

        if (SET_ROLE) {
            query += ', role = $2';
            params.push(SET_ROLE);
            query += ' WHERE email = $' + (params.length + 1);
            params.push(TARGET_EMAIL);
        } else {
            query += ' WHERE email = $2';
            params.push(TARGET_EMAIL);
        }

        // 4. Update user
        await client.query(query, params);
        console.log(`✅ Password updated for ${TARGET_EMAIL}`);
        if (SET_ROLE) {
            console.log(`✅ Role updated to ${SET_ROLE}`);
        }

        // 5. Verify the state
        const verifyResult = await client.query('SELECT email, role, password_hash FROM users WHERE email = $1', [TARGET_EMAIL]);
        console.log('📊 Current State:', {
            email: verifyResult.rows[0].email,
            role: verifyResult.rows[0].role,
            isPasswordHashed: verifyResult.rows[0].password_hash.startsWith('$2b$'),
            hashLength: verifyResult.rows[0].password_hash.length
        });

    } catch (error) {
        console.error('❌ Error fixing user:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixUser().catch(console.error);
