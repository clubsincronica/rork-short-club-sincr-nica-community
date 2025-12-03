const initDb = require('sql.js');
const fs = require('fs');
const bcrypt = require('bcrypt');

initDb().then(async SQL => {
  const db = new SQL.Database(fs.readFileSync('clubsincronica.db'));
  
  const password1Hash = await bcrypt.hash('password123', 10);
  const password2Hash = await bcrypt.hash('password123', 10);
  
  // Insert user 1 (ID will auto-increment)
  db.run(`INSERT INTO users (name, email, password_hash, latitude, longitude, location, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`, 
          ['Tomas De La Llosa', 'tom_weasley@hotmail.com', password1Hash, -38.01, -57.52, 'Mar del Plata, Argentina', new Date().toISOString()]);
  
  // Insert user 2
  db.run(`INSERT INTO users (name, email, password_hash, latitude, longitude, location, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['Matias Cazeaux', 'matias.cazeaux@gmail.com', password2Hash, -38.02, -57.53, 'Mar del Plata, Argentina', new Date().toISOString()]);
  
  // Save database
  const data = db.export();
  fs.writeFileSync('clubsincronica.db', Buffer.from(data));
  
  console.log('✅ Created two test users:');
  console.log('   1. Tomas De La Llosa (tom_weasley@hotmail.com)');
  console.log('      Password: password123');
  console.log('      GPS: -38.01, -57.52 (Mar del Plata)');
  console.log('   2. Matias Cazeaux (matias.cazeaux@gmail.com)');
  console.log('      Password: password123');
  console.log('      GPS: -38.02, -57.53 (Mar del Plata)');
  console.log('\n🎯 Distance between them: ~1.5 km');
  console.log('\n📱 Now you can:');
  console.log('   • Login with either account (password: password123)');
  console.log('   • See each other in "Near Me" tab');
  console.log('   • Click profile → "Enviar Mensaje"');
  console.log('   • Test real-time messaging!');
  
  // Verify
  const users = db.exec('SELECT id, name, email, latitude, longitude FROM users');
  if (users.length > 0) {
    console.log('\n📋 Users in database:');
    users[0].values.forEach(user => {
      console.log(`   ID ${user[0]}: ${user[1]} (${user[2]}) at ${user[3]}, ${user[4]}`);
    });
  }
  
  db.close();
}).catch(err => {
  console.error('❌ Error:', err);
});
