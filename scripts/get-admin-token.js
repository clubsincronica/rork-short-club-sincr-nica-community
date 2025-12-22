/**
 * Get JWT token for matias.cazeaux@gmail.com from Railway database
 * This simulates a login to get a fresh token
 */

const API_BASE = 'https://rork-short-club-sincr-nica-community-production.up.railway.app';

async function getToken() {
    console.log('🔐 Getting JWT token for matias.cazeaux@gmail.com...\n');

    try {
        // Simulate login to get token
        const response = await fetch(`${API_BASE}/api/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'matias.cazeaux@gmail.com',
                password: '', // No password set for this user
                name: 'Matias Cazeaux'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token retrieved successfully!\n');
            console.log('='.repeat(80));
            console.log('JWT TOKEN:');
            console.log('='.repeat(80));
            console.log(data.token);
            console.log('='.repeat(80));
            console.log('\n📋 Copy the token above and run:');
            console.log(`node scripts/quick-admin-test.js ${data.token}\n`);

            // Also save to file for convenience
            const fs = require('fs');
            fs.writeFileSync('token.txt', data.token);
            console.log('💾 Token also saved to token.txt\n');

            return data.token;
        } else {
            const error = await response.text();
            console.log('❌ Failed to get token:', error);
        }
    } catch (error) {
        console.log('❌ Network error:', error);
    }
}

getToken();
