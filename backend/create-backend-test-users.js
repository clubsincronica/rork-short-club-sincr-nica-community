// create-backend-test-users.js
// Run: node create-backend-test-users.js

const https = require('https');

const BACKEND_URL = 'rork-short-club-sincr-nica-community-production.up.railway.app';
const USERS = [
  {
    email: 'tom_weasley@hotmail.com',
    password: 'password123',
    name: 'Tomas De La Llosa'
  },
  {
    email: 'matias.cazeaux@gmail.com',
    password: 'password123',
    name: 'Matias Cazeaux'
  },
  {
    email: 'eu.larra@gmail.com',
    password: 'password123',
    name: 'Eu Larra'
  }
];

function createUser(user) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(user);
    const options = {
      hostname: BACKEND_URL,
      port: 443,
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode === 200) {
            console.log(`✅ Created/verified user: ${user.email} (ID: ${result.user?.id})`);
            resolve(result);
          } else {
            console.error(`❌ Failed for ${user.email}:`, result.error || body);
            reject(result);
          }
        } catch (e) {
          console.error(`❌ Invalid response for ${user.email}:`, body);
          reject(e);
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

(async () => {
  for (const user of USERS) {
    try {
      await createUser(user);
    } catch (e) {
      // Already logged
    }
  }
  console.log('\nAll done!');
})();
