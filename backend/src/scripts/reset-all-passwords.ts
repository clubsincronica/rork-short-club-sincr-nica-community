
import 'dotenv/config';
import { initializeDatabase, userQueries } from '../models/database-sqljs';
import bcrypt from 'bcrypt';

async function resetAllPasswords() {
    try {
        await initializeDatabase();
        console.log('✅ Database initialized');

        const users = await userQueries.getAllUsers();
        console.log(`🔍 Found ${users.length} users`);

        const newPassword = 'password123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        for (const user of users) {
            console.log(`🔄 Resetting password for ${user.email} (ID: ${user.id})...`);
            // @ts-ignore - we just added this method but types might not be inferred yet if not rebuilt
            await userQueries.updatePassword(user.id, hashedPassword);
        }

        console.log('\n🎉 All passwords have been reset to: ' + newPassword);

    } catch (error) {
        console.error('❌ Failed to reset passwords:', error);
        process.exit(1);
    }
}

resetAllPasswords();
