/**
 * Generate JWT token directly using Railway database
 * Run with: railway run node scripts/generate-admin-token.js
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('ERROR: JWT_SECRET must be set in the environment. Refusing to sign a token with a known fallback secret.');
    process.exit(1);
}
const USER_ID = 2; // Matias Cazeaux
const EMAIL = 'matias.cazeaux@gmail.com';
const ROLE = 'superuser';

// Generate token
const token = jwt.sign(
    {
        userId: USER_ID,
        email: EMAIL,
        role: ROLE
    },
    JWT_SECRET,
    { expiresIn: '30d' }
);

console.log('\n' + '='.repeat(80));
console.log('JWT TOKEN FOR MATIAS CAZEAUX (SUPERUSER)');
console.log('='.repeat(80));
console.log(token);
console.log('='.repeat(80));
console.log('\n📋 Copy the token above and run:');
console.log(`node scripts/quick-admin-test.js ${token}\n`);

// Save to file
const fs = require('fs');
fs.writeFileSync('admin-token.txt', token);
console.log('💾 Token saved to admin-token.txt\n');
