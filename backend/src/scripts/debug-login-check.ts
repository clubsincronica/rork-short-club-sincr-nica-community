
import 'dotenv/config';
import { initializeDatabase, userQueries } from '../models/database-sqljs';
import bcrypt from 'bcrypt';

async function checkLogin() {
    try {
        await initializeDatabase();

        const email = 'tom_weasley@hotmail.com';
        const password = 'password123';

        console.log(`🔍 Checking login for ${email} with password '${password}'...`);

        const user = await userQueries.getUserByEmail(email);

        if (!user) {
            console.error('❌ User not found!');
            return;
        }

        console.log(`✅ User found: ID ${user.id}`);
        console.log(`📝 Stored Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);

        if (!user.password_hash) {
            console.error('❌ No password hash stored!');
            return;
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            console.log('✅ SUCCESS: Password matches hash!');
        } else {
            console.error('❌ FAILURE: Password does NOT match hash.');

            // Debug: create a fresh hash and compare
            const freshHash = await bcrypt.hash(password, 10);
            console.log(`\nDebug: Fresh hash of '${password}': ${freshHash.substring(0, 20)}...`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkLogin();
