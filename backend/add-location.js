const initDb = require('sql.js');
const fs = require('fs');

initDb().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('clubsincronica.db'));
  
  // Get all users first
  const users = db.exec('SELECT id, name, email FROM users');
  
  if (users.length > 0 && users[0].values.length > 0) {
    console.log('📋 Users in database:');
    users[0].values.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user[1]} (${user[2]})`);
    });
    
    // Update users with coordinates (Mar del Plata, Argentina - close to each other)
    db.run('UPDATE users SET latitude = -38.02, longitude = -57.53, location = "Mar del Plata, Argentina" WHERE email LIKE "%matias%"');
    db.run('UPDATE users SET latitude = -38.01, longitude = -57.52, location = "Mar del Plata, Argentina" WHERE email LIKE "%tom%"');
    
    // Save database
    const data = db.export();
    fs.writeFileSync('clubsincronica.db', Buffer.from(data));
    
    console.log('\n✅ Location coordinates added successfully!');
    
    // Verify updates
    const updated = db.exec('SELECT name, email, latitude, longitude, location FROM users');
    if (updated.length > 0) {
      console.log('\n📍 Updated user locations:');
      updated[0].values.forEach(user => {
        console.log(`  • ${user[0]} (${user[1]})`);
        console.log(`    GPS: ${user[2]}, ${user[3]}`);
        console.log(`    Location: ${user[4]}\n`);
      });
    }
    
    console.log('🎯 Now both users should appear in "Near Me" tab!');
    console.log('   Distance between them: ~1.5 km');
  } else {
    console.log('❌ No users found in database');
  }
  
  db.close();
}).catch(err => {
  console.error('Error:', err);
});
