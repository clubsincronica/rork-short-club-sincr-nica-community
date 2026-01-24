
const fetch = require('node-fetch');

async function testLogin() {
    console.log('🧪 Testing Login Endpoint...');
    const url = 'https://rork-short-club-sincr-nica-community-production.up.railway.app/api/auth';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'tom_weasley@hotmail.com',
                password: 'password123'
            })
        });

        console.log(`📡 Status: ${response.status}`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login Successful!');
            console.log('🔑 Token:', data.token ? data.token.substring(0, 20) + '...' : 'Missing');
        } else {
            console.log('❌ Login Failed:', data);
        }

    } catch (e) {
        console.error('❌ Network Error:', e);
    }
}

testLogin();
