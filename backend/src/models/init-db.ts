import { initializeDatabase } from './database-sqljs';

// Run database initialization
initializeDatabase().then(() => {
  console.log('Database initialization complete!');
  process.exit(0);
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
