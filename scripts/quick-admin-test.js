/**
 * Quick admin API test using curl
 * This script tests all admin endpoints
 */

const API_BASE = 'https://rork-short-club-sincr-nica-community-production.up.railway.app';

// Get token from command line
const token = process.argv[2];

if (!token) {
    console.log('❌ Please provide your JWT token');
    console.log('\nUsage:');
    console.log('  node scripts/quick-admin-test.js <YOUR_JWT_TOKEN>');
    process.exit(1);
}

async function testEndpoint(name, url) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`${'='.repeat(60)}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success!');
            console.log(JSON.stringify(data, null, 2));
        } else {
            const error = await response.text();
            console.log('❌ Failed!');
            console.log(error);
        }
    } catch (error) {
        console.log('❌ Network Error:', error);
    }
}

async function runTests() {
    console.log('\n🧪 Admin API Test Suite');
    console.log(`API Base: ${API_BASE}`);
    console.log(`Token: ${token.substring(0, 20)}...`);

    await testEndpoint('Platform Statistics', `${API_BASE}/api/admin/stats`);
    await testEndpoint('Revenue Breakdown', `${API_BASE}/api/admin/revenue`);
    await testEndpoint('User List (Page 1)', `${API_BASE}/api/admin/users?page=1&limit=5`);
    await testEndpoint('Transaction History', `${API_BASE}/api/admin/transactions?page=1&limit=5`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test Suite Complete!');
    console.log('='.repeat(60) + '\n');
}

runTests();
