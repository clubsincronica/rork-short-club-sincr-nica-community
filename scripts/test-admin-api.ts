/**
 * Test script to verify admin API endpoints
 * 
 * Usage:
 * 1. Login as matias.cazeaux@gmail.com in the app
 * 2. Copy the JWT token from AsyncStorage or network requests
 * 3. Run: npx ts-node scripts/test-admin-api.ts <TOKEN>
 */

const API_BASE_URL = 'https://rork-short-club-sincr-nica-community-production.up.railway.app';

async function testAdminAPI(token: string) {
    console.log('🧪 Testing Admin API Endpoints...\n');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test 1: Stats endpoint
        console.log('📊 Testing GET /api/admin/stats');
        const statsResponse = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Stats endpoint working!');
            console.log(JSON.stringify(stats, null, 2));
        } else {
            console.log(`❌ Stats endpoint failed: ${statsResponse.status}`);
            console.log(await statsResponse.text());
        }

        console.log('\n---\n');

        // Test 2: Revenue endpoint
        console.log('💰 Testing GET /api/admin/revenue');
        const revenueResponse = await fetch(`${API_BASE_URL}/api/admin/revenue`, { headers });

        if (revenueResponse.ok) {
            const revenue = await revenueResponse.json();
            console.log('✅ Revenue endpoint working!');
            console.log(JSON.stringify(revenue, null, 2));
        } else {
            console.log(`❌ Revenue endpoint failed: ${revenueResponse.status}`);
            console.log(await revenueResponse.text());
        }

        console.log('\n---\n');

        // Test 3: Users endpoint
        console.log('👥 Testing GET /api/admin/users');
        const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users?page=1&limit=10`, { headers });

        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log('✅ Users endpoint working!');
            console.log(`Found ${users.users.length} users (Page ${users.pagination.page}/${users.pagination.pages})`);
            console.log('Sample users:', users.users.slice(0, 3).map((u: any) => ({
                id: u.id,
                email: u.email,
                role: u.role
            })));
        } else {
            console.log(`❌ Users endpoint failed: ${usersResponse.status}`);
            console.log(await usersResponse.text());
        }

        console.log('\n---\n');

        // Test 4: Transactions endpoint
        console.log('💳 Testing GET /api/admin/transactions');
        const transactionsResponse = await fetch(`${API_BASE_URL}/api/admin/transactions?page=1&limit=10`, { headers });

        if (transactionsResponse.ok) {
            const transactions = await transactionsResponse.json();
            console.log('✅ Transactions endpoint working!');
            console.log(`Found ${transactions.transactions.length} transactions`);
        } else {
            console.log(`❌ Transactions endpoint failed: ${transactionsResponse.status}`);
            console.log(await transactionsResponse.text());
        }

        console.log('\n🎉 Admin API testing complete!\n');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Get token from command line argument
const token = process.argv[2];

if (!token) {
    console.error('❌ Please provide a JWT token as an argument');
    console.log('Usage: npx ts-node scripts/test-admin-api.ts <TOKEN>');
    process.exit(1);
}

testAdminAPI(token);
