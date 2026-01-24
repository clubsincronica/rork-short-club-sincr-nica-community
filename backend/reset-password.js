// Script to reset the password for a specific user in the backend (Postgres)
const bcrypt = require('bcrypt');
const { query } = require('./src/db/postgres-client');

async function resetPassword(email, newPassword) {
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const rows = await query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [passwordHash, email]
    );
    if (!rows.length) {
      console.log('No user found with email:', email);
    } else {
      console.log('Password updated for user:', rows[0].email);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
}


// Reset passwords for all three users
async function resetAll() {
  await resetPassword('tom_weasley@hotmail.com', 'Ballymote1.');
  await resetPassword('matias.cazeaux@gmail.com', 'Ballymote1.');
  await resetPassword('eu.larra@gmail.com', 'Ballymote1.');
  process.exit(0);
}

resetAll();
