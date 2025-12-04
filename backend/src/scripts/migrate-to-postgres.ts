import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { query as pgQuery } from '../db/postgres-client';

function locateSqlJsFile(file: string): string {
  return path.join(__dirname, '../../node_modules/sql.js/dist', file);
}

async function migrate() {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../clubsincronica.db');
  if (!fs.existsSync(dbPath)) {
    console.error('No sql.js DB file found at', dbPath);
    process.exit(1);
  }

  console.log('Loading SQL.js...');
  const SQL = await initSqlJs({ locateFile: (f: string) => locateSqlJsFile(f) });
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // Create tables in Postgres first
  console.log('Creating tables in Postgres...');
  
  await pgQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      location TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      phone TEXT,
      website TEXT,
      interests TEXT,
      services TEXT,
      is_host INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pgQuery(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      participant1_id INTEGER NOT NULL,
      participant2_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pgQuery(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('Tables created successfully');

  const tables = ['users', 'conversations', 'messages'];

  for (const table of tables) {
    console.log(`\nMigrating table: ${table}`);
    const res = db.exec(`SELECT * FROM ${table}`);
    if (!res || !res[0]) {
      console.log(`  No rows found for ${table}`);
      continue;
    }
    const columns: string[] = res[0].columns;
    const values: any[][] = res[0].values;

    console.log(`  Found ${values.length} rows in ${table}`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of values) {
      const obj: any = {};
      columns.forEach((c, i) => (obj[c] = row[i]));

      const colNames = Object.keys(obj);
      const params = colNames.map((_, idx) => `$${idx + 1}`).join(',');
      const sql = `INSERT INTO ${table} (${colNames.join(',')}) VALUES (${params})`;
      const vals = colNames.map((c) => obj[c]);
      try {
        await pgQuery(sql, vals);
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`  Error inserting row into ${table}:`, (err as Error).message);
      }
    }

    console.log(`  Successfully migrated ${successCount} rows, ${errorCount} errors`);

    // If table has id sequence, set it to max id
    if (columns.includes('id')) {
      try {
        await pgQuery(`SELECT setval(pg_get_serial_sequence($1, 'id'), (SELECT MAX(id) FROM ${table}))`, [table]);
        console.log(`  Set sequence for ${table}`);
      } catch (err) {
        console.warn(`  Could not set sequence for ${table}:`, (err as Error).message || err);
      }
    }
  }

  console.log('\n✅ Migration complete successfully!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
