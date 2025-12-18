require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

async function checkConversations() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    console.log('Make sure you have a .env file in the backend directory');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('\n👥 === USERS IN DATABASE ===');
    const users = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    console.table(users.rows);
    
    console.log('\n💬 === CONVERSATIONS IN DATABASE ===');
    const conversations = await pool.query(`
      SELECT c.id, c.participant1_id, c.participant2_id, c.created_at,
             u1.name as p1_name, u2.name as p2_name
      FROM conversations c
      LEFT JOIN users u1 ON c.participant1_id = u1.id
      LEFT JOIN users u2 ON c.participant2_id = u2.id
      ORDER BY c.id
    `);
    
    if (conversations.rows.length === 0) {
      console.log('   No conversations found');
    } else {
      conversations.rows.forEach(conv => {
        console.log(`\n   Conversation ${conv.id}:`);
        console.log(`      participant1_id: ${conv.participant1_id} (${conv.p1_name})`);
        console.log(`      participant2_id: ${conv.participant2_id} (${conv.p2_name})`);
        console.log(`      created: ${conv.created_at}`);
      });
    }
    
    console.log('\n\n🔍 === TESTING CONVERSATION QUERY FOR EACH USER ===');
    
    for (const user of users.rows) {
      console.log(`\n📱 User: ${user.name} (ID ${user.id})`);
      console.log(`   Should see conversations with OTHER users, not themselves\n`);
      
      const userConvs = await pool.query(`
        SELECT c.id, c.participant1_id, c.participant2_id,
               CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
               u.name as other_user_name, u.email as other_user_email
        FROM conversations c
        LEFT JOIN users u ON u.id = CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END
        WHERE c.participant1_id = $1 OR c.participant2_id = $1
      `, [user.id]);
      
      if (userConvs.rows.length === 0) {
        console.log('   No conversations found');
      } else {
        userConvs.rows.forEach(conv => {
          const isSameUser = conv.other_user_id === user.id;
          console.log(`   Conversation ${conv.id}:`);
          console.log(`      participant1_id: ${conv.participant1_id}`);
          console.log(`      participant2_id: ${conv.participant2_id}`);
          console.log(`      other_user_id: ${conv.other_user_id}`);
          console.log(`      other_user_name: ${conv.other_user_name}`);
          console.log(`      ⚠️  ${isSameUser ? 'BUG! Conversation with self!' : 'OK - conversation with different user'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConversations();