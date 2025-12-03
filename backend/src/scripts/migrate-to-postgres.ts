import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { query as pgQuery } from '../db/postgres-client';

async function locateSqlJsFile(file: string) {
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

  const tables = ['users', 'conversations', 'messages'];

  for (const table of tables) {
    console.log('Migrating table', table);
    const res = db.exec(`SELECT * FROM ${table}`);
    if (!res || !res[0]) {
      console.log(`No rows found for ${table}`);
      continue;
    }
    const columns: string[] = res[0].columns;
    const values: any[][] = res[0].values;

    for (const row of values) {
      const obj: any = {};
      columns.forEach((c, i) => (obj[c] = row[i]));

      const colNames = Object.keys(obj);
      const params = colNames.map((_, idx) => `$${idx + 1}`).join(',');
      const sql = `INSERT INTO ${table} (${colNames.join(',')}) VALUES (${params})`;
      const vals = colNames.map((c) => obj[c]);
      try {
        await pgQuery(sql, vals);
      } catch (err) {
        console.error('Error inserting row into', table, err);
      }
    }

    // If table has id sequence, set it to max id
    if (columns.includes('id')) {
      try {
        await pgQuery(`SELECT setval(pg_get_serial_sequence($1, 'id'), (SELECT MAX(id) FROM ${table}))`, [table]);
      } catch (err) {
        console.warn('Could not set sequence for', table, err.message || err);
      }
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
