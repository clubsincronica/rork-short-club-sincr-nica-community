const initDb = require('sql.js');
const fs = require('fs');

initDb().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('clubsincronica.db'));
  
  console.log('\n👥 === USERS IN DATABASE ===');
  const users = db.exec('SELECT id, name, email FROM users ORDER BY id');
  if (users.length > 0) {
    users[0].values.forEach(user => {
      console.log(`   ID ${user[0]}: ${user[1]} (${user[2]})`);
    });
  } else {
    console.log('   No users found');
  }
  
  console.log('\n💬 === CONVERSATIONS IN DATABASE ===');
  const conversations = db.exec('SELECT id, participant1_id, participant2_id, created_at FROM conversations ORDER BY id');
  if (conversations.length > 0) {
    conversations[0].values.forEach(conv => {
      console.log(`   Conversation ${conv[0]}: participant1=${conv[1]}, participant2=${conv[2]}, created=${conv[3]}`);
      
      // Get names for participants
      const p1 = db.exec(`SELECT name FROM users WHERE id = ${conv[1]}`);
      const p2 = db.exec(`SELECT name FROM users WHERE id = ${conv[2]}`);
      const p1Name = p1[0]?.values[0]?.[0] || 'Unknown';
      const p2Name = p2[0]?.values[0]?.[0] || 'Unknown';
      console.log(`      ${p1Name} (ID ${conv[1]}) <-> ${p2Name} (ID ${conv[2]})`);
    });
  } else {
    console.log('   No conversations found');
  }
  
  console.log('\n🔍 === TESTING CONVERSATION QUERY FOR EACH USER ===');
  const userIds = users.length > 0 ? users[0].values.map(u => u[0]) : [];
  
  userIds.forEach(userId => {
    console.log(`\n📱 User ID ${userId}:`);
    const result = db.exec(`
      SELECT c.id, c.participant1_id, c.participant2_id,
             CASE WHEN c.participant1_id = ${userId} THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
             u.name, u.avatar, u.email
      FROM conversations c
      LEFT JOIN users u ON u.id = CASE WHEN c.participant1_id = ${userId} THEN c.participant2_id ELSE c.participant1_id END
      WHERE c.participant1_id = ${userId} OR c.participant2_id = ${userId}
    `);
    
    if (result.length > 0 && result[0].values.length > 0) {
      result[0].values.forEach(row => {
        console.log(`   Conversation ${row[0]}:`);
        console.log(`      participant1_id: ${row[1]}, participant2_id: ${row[2]}`);
        console.log(`      other_user_id: ${row[3]} (calculated)`);
        console.log(`      name from JOIN: "${row[4]}"`);
        console.log(`      email from JOIN: "${row[6]}"`);
        
        // Double-check the JOIN
        const expectedOtherId = row[1] === userId ? row[2] : row[1];
        const actualOtherId = row[3];
        console.log(`      ✓ CASE calculation: Expected ${expectedOtherId}, Got ${actualOtherId} - ${expectedOtherId === actualOtherId ? '✅ CORRECT' : '❌ WRONG'}`);
        
        // Get the actual name of the other user directly
        const directQuery = db.exec(`SELECT name FROM users WHERE id = ${actualOtherId}`);
        const directName = directQuery[0]?.values[0]?.[0] || 'Not found';
        console.log(`      ✓ Direct query for user ${actualOtherId}: "${directName}"`);
        console.log(`      ✓ JOIN result matches direct query: ${row[4] === directName ? '✅ CORRECT' : '❌ WRONG - JOIN IS BROKEN'}`);
      });
    } else {
      console.log('   No conversations found for this user');
    }
  });
  
  db.close();
  console.log('\n✅ Done!');
}).catch(err => {
  console.error('❌ Error:', err);
});
