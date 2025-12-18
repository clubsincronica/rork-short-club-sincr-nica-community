// Call the fix endpoint on Railway backend
const https = require('https');

const BACKEND_URL = 'https://rork-short-club-sincr-nica-community-production.up.railway.app';

console.log('🔧 Calling fix-conversations endpoint...\n');

const data = JSON.stringify({});

const options = {
  hostname: 'rork-short-club-sincr-nica-community-production.up.railway.app',
  port: 443,
  path: '/api/fix-conversations',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:', body);
    
    try {
      const result = JSON.parse(body);
      console.log('\n✅ SUCCESS!');
      console.log('Deleted messages:', result.deletedMessages);
      console.log('Deleted conversations:', result.deletedConversations);
      console.log('Fixed conversation ID:', result.fixedConversationId);
      console.log('\nRemaining conversations:');
      console.table(result.remainingConversations);
      console.log('\n🎉 Database fixed! Now test messaging on the phones.');
    } catch (e) {
      console.log('\nRaw response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
