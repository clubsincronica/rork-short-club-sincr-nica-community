// Run this script on Railway to clean up conversations
// Usage: In Railway dashboard, add this as a one-off command or run via shell

const { Pool } = require('pg');

async function cleanupConversations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧹 Cleaning up conversations table...\n');
    
    // First, show current state
    const before = await pool.query('SELECT id, participant1_id, participant2_id FROM conversations ORDER BY id');
    console.log('📊 Current conversations:');
    console.table(before.rows);
    
    // Delete ALL conversations (messages will be orphaned but that's OK)
    console.log('\n🗑️  Deleting all conversations...');
    const deleteResult = await pool.query('DELETE FROM conversations');
    console.log(`✅ Deleted ${deleteResult.rowCount} conversations`);
    
    // Also delete all messages to start fresh
    console.log('\n🗑️  Deleting all messages...');
    const deleteMessages = await pool.query('DELETE FROM messages');
    console.log(`✅ Deleted ${deleteMessages.rowCount} messages`);
    
    // Reset auto-increment sequences
    console.log('\n🔄 Resetting sequences...');
    await pool.query("SELECT setval('conversations_id_seq', 1, false)");
    await pool.query("SELECT setval('messages_id_seq', 1, false)");
    console.log('✅ Sequences reset');
    
    console.log('\n✅ Database cleaned! Users can now start fresh conversations.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupConversations();
