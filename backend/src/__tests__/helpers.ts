/**
 * Test utilities and helpers
 */
import initSqlJs, { Database } from 'sql.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Create an in-memory SQLite database for testing
 */
export async function createTestDatabase(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      website TEXT,
      interests TEXT,
      services TEXT,
      is_host INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant1_id INTEGER NOT NULL,
      participant2_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant1_id) REFERENCES users(id),
      FOREIGN KEY (participant2_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);

  return db;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
  db: Database,
  email: string,
  password?: string,
  name: string = 'Test User'
): Promise<{ id: number; email: string; name: string; password?: string }> {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  
  db.run(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, passwordHash, name]
  );

  const result = db.exec('SELECT last_insert_rowid() as id');
  const userId = result[0].values[0][0] as number;

  return { id: userId, email, name, password };
}

/**
 * Generate a test JWT token
 */
export function generateTestToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

/**
 * Create a test conversation between two users
 */
export function createTestConversation(
  db: Database,
  user1Id: number,
  user2Id: number
): number {
  db.run(
    'INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)',
    [user1Id, user2Id]
  );

  const result = db.exec('SELECT last_insert_rowid() as id');
  return result[0].values[0][0] as number;
}

/**
 * Create a test message
 */
export function createTestMessage(
  db: Database,
  conversationId: number,
  senderId: number,
  receiverId: number,
  text: string = 'Test message'
): number {
  db.run(
    'INSERT INTO messages (conversation_id, sender_id, receiver_id, text) VALUES (?, ?, ?, ?)',
    [conversationId, senderId, receiverId, text]
  );

  const result = db.exec('SELECT last_insert_rowid() as id');
  return result[0].values[0][0] as number;
}

/**
 * Clean up database after tests
 */
export function cleanupDatabase(db: Database): void {
  db.run('DELETE FROM messages');
  db.run('DELETE FROM conversations');
  db.run('DELETE FROM users');
}

/**
 * Mock request object for testing
 */
export function mockRequest(data: any = {}): any {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || null,
  };
}

/**
 * Mock response object for testing
 */
export function mockResponse(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    // Use unref() to prevent keeping the event loop open
    await new Promise(resolve => {
      const timer = setTimeout(resolve, interval);
      timer.unref();
    });
  }
}
