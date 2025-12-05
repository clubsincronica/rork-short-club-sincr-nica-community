const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function checkDb() {
  const dbPath = path.join(__dirname, 'clubsincronica.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log('Database file not found');
    return;
  }
  
  console.log('Database file size:', fs.statSync(dbPath).size, 'bytes');
  
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);
  
  // Check tables
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\nTables:', tables[0] ? tables[0].values.map(v => v[0]) : 'none');
  
  // Check row counts
  for (const table of ['users', 'conversations', 'messages']) {
    try {
      const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result[0]?.values[0]?.[0] || 0;
      console.log(`${table}: ${count} rows`);
    } catch (err) {
      console.log(`${table}: table doesn't exist`);
    }
  }
  
  // Show sample data
  try {
    const users = db.exec('SELECT * FROM users LIMIT 3');
    if (users[0]) {
      console.log('\nSample users:');
      console.log('Columns:', users[0].columns);
      console.log('Values:', users[0].values);
    }
  } catch (err) {
    console.log('Could not read users table');
  }
}

checkDb().catch(console.error);
