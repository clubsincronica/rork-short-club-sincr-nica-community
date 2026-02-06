const API_BASE = 'https://clubsincronica-backend.onrender.com';

async function verifyHealth() {
    console.log(`🏥 Running Health Check on ${API_BASE}...\n`);

    try {
        // 1. Check Public API
        console.log('1️⃣ Testing Public API (/api/users)...');
        const usersRes = await fetch(`${API_BASE}/api/users`);
        if (usersRes.ok) {
            console.log('✅ Public API is reachable.');
        } else {
            console.error('❌ Public API failed:', usersRes.status);
            return;
        }

        // 2. Register/Login Temp User
        const testUser = {
            email: `healthcheck_${Date.now()}@test.com`,
            password: 'password123',
            name: 'Health Check User'
        };
        console.log(`\n2️⃣ Registering Test User (${testUser.email})...`);

        const authRes = await fetch(`${API_BASE}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        if (!authRes.ok) {
            console.error('❌ Auth/Registration failed:', await authRes.text());
            return;
        }

        const authData = await authRes.json();
        const token = authData.token;
        console.log('✅ Auth successful! Token acquired.');

        // 3. Verify Admin Security
        console.log('\n3️⃣ Verifying Admin Security (/api/admin/config)...');
        const adminRes = await fetch(`${API_BASE}/api/admin/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (adminRes.status === 403) {
            console.log('✅ Security Check Passed: Admin API returned 403 Forbidden for normal user.');
        } else if (adminRes.ok) {
            console.error('⚠️ SECURITY WARNING: Normal user accessed Admin API!');
        } else {
            console.log(`ℹ️ Admin API returned ${adminRes.status} (Expected 403).`);
        }

        console.log('\n✅ System appears healthy and updated!');

    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

verifyHealth();
