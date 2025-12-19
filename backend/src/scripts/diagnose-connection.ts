import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { query } from '../db/postgres-client';

async function diagnose() {
  console.log('🏥 Diagnosing Database Connection...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is missing from .env');
    console.log('   Please create a .env file in the backend folder with your Neon connection string.');
    process.exit(1);
  }

  try {
    console.log('🔗 Attempting to connect to Neon...');
    const startTime = Date.now();

    // Simple query to check connection
    const res = await query('SELECT NOW() as now, version() as version');

    const duration = Date.now() - startTime;
    console.log(`✅ Connection Successful! (Latency: ${duration}ms)`);
    console.log(`   Server Time: ${res[0].now}`);
    console.log(`   Version: ${res[0].version}`);

    // Check Tables
    console.log('\n📊 Checking Tables...');
    try {
      const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

      if (tables.length === 0) {
        console.log('⚠️  Connected, but NO tables found. The database is empty.');
        console.log('   Run "npm run migrate:pg" to copy your local data to Neon.');
      } else {
        console.log(`✅ Found ${tables.length} tables:`, tables.map(t => t.table_name).join(', '));

        // Check row counts
        for (const t of tables) {
          const tableName = t.table_name;
          const countRes = await query(`SELECT COUNT(*) as c FROM ${tableName}`);
          console.log(`   - ${tableName}: ${countRes[0].c} rows`);
        }
      }
    } catch (err) {
      console.error('⚠️  Could not list tables:', (err as Error).message);
    }

  } catch (error) {
    console.error('❌ Connection Failed:', (error as Error).message);
    if ((error as Error).message.includes('password')) {
      console.log('   (Did you forget the password in the connection string?)');
    }
  }

  process.exit(0);
}

diagnose();
