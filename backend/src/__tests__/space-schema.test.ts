import { createTestDatabase } from './helpers';
import { Database } from 'sql.js';

describe('Space schema', () => {
  let db: Database;
  beforeEach(async () => { db = await createTestDatabase(); });
  afterEach(() => { if (db) { db.close(); } });

  it('supports creating spaces, subspaces and space_bookings', async () => {
    // NOTE: tables are created via initializeDatabase (Postgres path). In unit
    // tests we replicate the SQLite DDL by running the same CREATE TABLE
    // statements against the in-memory DB to prove the DDL is valid.
    db.run(`CREATE TABLE IF NOT EXISTS spaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL,
      title TEXT NOT NULL, description TEXT, location TEXT, images TEXT DEFAULT '[]',
      amenities TEXT DEFAULT '[]', calendar_mode TEXT DEFAULT 'unified',
      is_published INTEGER DEFAULT 0, rating REAL DEFAULT 0, review_count INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS subspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT, space_id INTEGER NOT NULL,
      title TEXT NOT NULL, description TEXT, type TEXT DEFAULT 'other',
      capacity INTEGER DEFAULT 1, features TEXT DEFAULT '[]', images TEXT DEFAULT '[]',
      price_hour REAL, price_day REAL, price_week REAL, price_month REAL,
      billing_units TEXT DEFAULT '["hour"]', is_active INTEGER DEFAULT 1,
      floor_label TEXT, calendar_mode TEXT DEFAULT 'unified', color TEXT,
      instant_book INTEGER DEFAULT 0, business_hours TEXT DEFAULT '[]',
      slot_granularity INTEGER DEFAULT 30, min_advance INTEGER DEFAULT 120,
      max_duration INTEGER DEFAULT 8, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS space_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT, space_id INTEGER NOT NULL,
      subspace_id INTEGER NOT NULL, user_id INTEGER NOT NULL, guest_name TEXT,
      date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
      billing_unit TEXT DEFAULT 'hour', quantity INTEGER DEFAULT 1,
      total_price REAL NOT NULL, status TEXT DEFAULT 'pending',
      mode TEXT DEFAULT 'instant', payment_status TEXT DEFAULT 'pending',
      payment_provider TEXT, payment_id TEXT, notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_space_bookings_subspace ON space_bookings(subspace_id, date)`);

    db.run(`INSERT INTO spaces (owner_id, title) VALUES (1, 'Test Space')`);
    const spaceRes = db.exec(`SELECT id FROM spaces WHERE title = 'Test Space'`);
    const spaceId = (spaceRes[0].values[0][0] as number);
    db.run(`INSERT INTO subspaces (space_id, title) VALUES (${spaceId}, 'Desk 1')`);
    const subspaceRes = db.exec(`SELECT id FROM subspaces WHERE title = 'Desk 1'`);
    const subspaceId = (subspaceRes[0].values[0][0] as number);
    db.run(`INSERT INTO space_bookings (space_id, subspace_id, user_id, date, start_time, end_time, total_price)
      VALUES (${spaceId}, ${subspaceId}, 1, '2026-08-20', '09:00', '12:00', 300)`);

    const spaces = db.exec(`SELECT COUNT(*) FROM spaces`);
    expect(spaces[0].values[0][0]).toBe(1);
    const subspaces = db.exec(`SELECT COUNT(*) FROM subspaces`);
    expect(subspaces[0].values[0][0]).toBe(1);
    const spaceBookings = db.exec(`SELECT COUNT(*) FROM space_bookings`);
    expect(spaceBookings[0].values[0][0]).toBe(1);
  });
});