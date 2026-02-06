/**
 * Verify System Config on Render
 * 
 * 1. Logins as superuser (matias.cazeaux@gmail.com)
 * 2. Fetches /api/admin/config to verify table existence and default values
 */

const API_BASE = 'https://clubsincronica-backend.onrender.com';
const SUPER_USER = 'matias.cazeaux@gmail.com';

async function verifyConfig() {
    console.log(`🔍 Verifying System Config on ${API_BASE}...\n`);

    try {
        // Step 1: Login
        console.log(`1️⃣ Logging in as ${SUPER_USER}...`);
        const loginRes = await fetch(`${API_BASE}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: SUPER_USER,
                password: '', // Dev backdoor for superuser
                name: 'Matias Admin'
            })
        });

        if (!loginRes.ok) {
            console.error('❌ Login failed:', await loginRes.text());
            return;
        }

        const authData = await loginRes.json();
        const token = authData.token;
        console.log('✅ Login successful! Token acquired.\n');

        // Step 2: Fetch Config
        console.log('2️⃣ Fetching System Config (/api/admin/config)...');
        const configRes = await fetch(`${API_BASE}/api/admin/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!configRes.ok) {
            const error = await configRes.text();
            console.error('❌ Failed to fetch config. Table might be missing or API error.');
            console.error('Error:', error);

            if (error.includes('relation "system_config" does not exist')) {
                console.error('\n⚠️ CRITICAL: The table "system_config" does not exist. Database migration did not run.');
            }
            return;
        }

        const config = await configRes.json();
        console.log('✅ Config fetched successfully!');
        console.log('----------------------------------------');
        console.log(JSON.stringify(config, null, 2));
        console.log('----------------------------------------');

        // Verify keys
        const hasCustomer = config.some(c => c.key === 'customer_fee_percent');
        const hasProvider = config.some(c => c.key === 'provider_fee_percent');

        if (hasCustomer && hasProvider) {
            console.log('\n✅ SUCCESS: verification complete. Table exists and defaults are set.');
        } else {
            console.log('\n⚠️ WARNING: Table exists but default keys are missing.');
        }

    } catch (error) {
        console.error('❌ Network or Script Error:', error);
    }
}

verifyConfig();
