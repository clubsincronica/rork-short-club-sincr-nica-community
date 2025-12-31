
import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

// Helper function to convert row array to object (used by SQL.js)
function rowToObject(columns: string[], values: any[]): any {
  const obj: any = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

// Use Postgres client if DATABASE_URL is provided
const usePostgres = !!process.env.DATABASE_URL;

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../clubsincronica.db');

let db: Database;
let SQL: any;

// If Postgres is enabled, use the Postgres client
let pgClient: any = null;
if (usePostgres) {
  // Lazy require to avoid dev-time issues when pg isn't used
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  pgClient = require('../db/postgres-client');
}

function locateSqlJsFile(file: string): string {
  return path.join(__dirname, '../../node_modules/sql.js/dist', file);
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, data);
}

// Initialize the database (either sql.js or Postgres)
export async function initializeDatabase() {
  try {
    if (usePostgres) {
      // Ensure Postgres connection works and create schema if needed
      console.log('Using Postgres database (DATABASE_URL detected)');
      // Create tables if they don't exist
      await pgClient.query(`
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
          is_host INTEGER DEFAULT 0,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Migration: Add role column if it doesn't exist
      try {
        await pgClient.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`);
      } catch (e) {
        // Ignore error if column exists
        console.log('Role column check passed');
      }

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          participant1_id INTEGER NOT NULL,
          participant2_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
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

      // Create indexes for better query performance
      await pgClient.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_conversation 
        ON messages(conversation_id, created_at DESC)
      `);

      await pgClient.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread 
        ON messages(receiver_id, read)
      `);

      await pgClient.query(`
        CREATE INDEX IF NOT EXISTS idx_conversations_participants 
        ON conversations(participant1_id, participant2_id)
      `);

      await pgClient.query(`
        CREATE INDEX IF NOT EXISTS idx_conversations_participant1 
        ON conversations(participant1_id)
      `);

      await pgClient.query(`
        CREATE INDEX IF NOT EXISTS idx_conversations_participant2 
        ON conversations(participant2_id)
      `);

      await pgClient.query(`
        CREATE INDEX IF NOT EXISTS idx_users_location 
        ON users(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      `);

      console.log('Postgres database initialized with indexes');

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          start_time TEXT,
          end_time TEXT,
          date TEXT,
          location TEXT,
          is_online BOOLEAN DEFAULT false,
          max_participants INTEGER DEFAULT 0,
          current_participants INTEGER DEFAULT 0,
          price DECIMAL(10,2) DEFAULT 0,
          image TEXT,
          tags TEXT,
          status TEXT DEFAULT 'upcoming',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          price DECIMAL(10,2) NOT NULL,
          images TEXT,
          tags TEXT,
          specifications TEXT,
          features TEXT,
          in_stock BOOLEAN DEFAULT true,
          stock_count INTEGER DEFAULT 0,
          shipping_info TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          account_type TEXT NOT NULL,
          account_number TEXT NOT NULL,
          account_holder_name TEXT NOT NULL,
          bank_name TEXT,
          country_code TEXT NOT NULL,
          is_primary BOOLEAN DEFAULT false,
          percentage INTEGER DEFAULT 0,
          nickname TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          booking_id INTEGER,
          total_amount DECIMAL(10,2) NOT NULL,
          app_fee_amount DECIMAL(10,2) NOT NULL,
          provider_amount DECIMAL(10,2) NOT NULL,
          provider_id INTEGER REFERENCES users(id),
          buyer_id INTEGER REFERENCES users(id),
          payment_provider TEXT NOT NULL,
          payment_id TEXT,
          status TEXT DEFAULT 'pending',
          currency TEXT DEFAULT 'ARS',
          metadata TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS reservations (
          id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
          service_id TEXT,
          product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'pending',
          number_of_spots INTEGER DEFAULT 1,
          total_price DECIMAL(10,2) NOT NULL,
          payment_status TEXT DEFAULT 'pending',
          payment_method TEXT,
          notes TEXT,
          attended BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          read BOOLEAN DEFAULT false,
          data TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id)`);
      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(payment_provider, payment_id)`);
      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id)`);
      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_reservations_provider ON reservations(provider_id)`);
      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_events_provider ON events(provider_id)`);
      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_products_provider ON products(provider_id)`);
      await pgClient.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read)`);

      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS blocked_emails (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('Postgres events, bank_accounts, transactions, reservations, notifications, and blocked_emails tables initialized');
    } else {
      // Use sql.js
      console.log('Using SQL.js database');
      SQL = await initSqlJs({ locateFile: (f: string) => locateSqlJsFile(f) });

      if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
        console.log('Loaded existing database from', dbPath);
      } else {
        db = new SQL.Database();
        console.log('Created new in-memory database');
        // Create tables
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
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
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant1_id INTEGER NOT NULL,
            participant2_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS bank_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_type TEXT NOT NULL,
            account_number TEXT NOT NULL,
            account_holder_name TEXT NOT NULL,
            bank_name TEXT,
            country_code TEXT NOT NULL,
            is_primary INTEGER DEFAULT 0,
            percentage INTEGER DEFAULT 0,
            nickname TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER,
            total_amount REAL NOT NULL,
            app_fee_amount REAL NOT NULL,
            provider_amount REAL NOT NULL,
            provider_id INTEGER,
            buyer_id INTEGER,
            payment_provider TEXT NOT NULL,
            payment_id TEXT,
            status TEXT DEFAULT 'pending',
            currency TEXT DEFAULT 'ARS',
            metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER,
            service_id TEXT,
            user_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            number_of_spots INTEGER DEFAULT 1,
            total_price REAL NOT NULL,
            payment_status TEXT DEFAULT 'pending',
            payment_method TEXT,
            notes TEXT,
            attended INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS blocked_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            reason TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indexes for better query performance (SQLite)
        db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, read)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(payment_provider, payment_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id)`);

        console.log('SQLite database created with indexes');
        saveDatabase();
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// User queries - conditional exports based on database type
export const userQueries = usePostgres ? {
  createUser: async (email: string, passwordHash: string | null, name: string, avatar?: string, bio?: string, location?: string, latitude?: number, longitude?: number, phone?: string, website?: string, interests?: string, services?: string, isHost?: number, role: string = 'user') => {
    const res = await pgClient.query(
      `INSERT INTO users (email, password_hash, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [email, passwordHash, name, avatar || null, bio || null, location || null, latitude || null, longitude || null, phone || null, website || null, interests || null, services || null, isHost || 0, role]
    );
    return { lastID: res[0]?.id ?? null };
  },
  // Returns all users (for geocoding and admin scripts)
  getAllUsers: async () => {
    const rows = await pgClient.query('SELECT * FROM users');
    return rows || [];
  },

  getUserByEmail: async (email: string) => {
    const rows = await pgClient.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
    return rows[0] ?? null;
  },

  getUserById: async (id: number) => {
    const rows = await pgClient.query(`SELECT id, email, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] ?? null;
  },

  updateUser: async (id: number, name: string, avatar?: string, bio?: string, location?: string, latitude?: number, longitude?: number, phone?: string, website?: string, interests?: string, services?: string, isHost?: number) => {
    await pgClient.query(
      `UPDATE users SET name = $1, avatar = $2, bio = $3, location = $4, latitude = $5, longitude = $6, phone = $7, website = $8, interests = $9, services = $10, is_host = $11, updated_at = NOW() WHERE id = $12`,
      [name, avatar || null, bio || null, location || null, latitude || null, longitude || null, phone || null, website || null, interests || null, services || null, isHost || 0, id]
    );
  },

  getNearbyUsers: async (latitude: number, longitude: number, radiusKm: number, limit: number) => {
    const rows = await pgClient.query(
      `
      SELECT * FROM (
        SELECT
          id, email, name, avatar, bio, location, latitude, longitude, services, is_host,
          (6371 * acos(
            cos(radians($1)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(latitude))
          )) AS distance
        FROM users
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ) AS sub
      WHERE distance < $3
      ORDER BY distance
      LIMIT $4
      `,
      [latitude, longitude, radiusKm, limit]
    );
    return rows || [];
  },

  searchUsers: async (queryStr: string) => {
    const searchTerm = `%${queryStr}%`;
    const rows = await pgClient.query(
      `SELECT id, email, name, avatar, bio, location, services, is_host FROM users WHERE name ILIKE $1 OR bio ILIKE $2 OR services ILIKE $3 LIMIT 50`,
      [searchTerm, searchTerm, searchTerm]
    );
    return rows || [];
  }
} : {
  // Returns all users (for geocoding and admin scripts)
  getAllUsers: () => {
    const result = db.exec('SELECT * FROM users');
    return result[0]?.values.map((row: any) => rowToObject(result[0].columns, row)) || [];
  },
  createUser: (email: string, passwordHash: string | null, name: string, avatar?: string, bio?: string, location?: string, latitude?: number, longitude?: number, phone?: string, website?: string, interests?: string, services?: string, isHost?: number, role: string = 'user') => {
    db.run(
      `INSERT INTO users (email, password_hash, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, name, avatar || null, bio || null, location || null, latitude || null, longitude || null, phone || null, website || null, interests || null, services || null, isHost || 0, role]
    );
    saveDatabase();
    return { lastID: (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 0 };
  },

  getUserByEmail: (email: string) => {
    const result = db.exec(`SELECT * FROM users WHERE email = ?`, [email]);
    return result[0]?.values[0] ? rowToObject(result[0].columns, result[0].values[0]) : null;
  },

  getUserById: (id: number) => {
    const result = db.exec(
      `SELECT id, email, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );
    return result[0]?.values[0] ? rowToObject(result[0].columns, result[0].values[0]) : null;
  },

  updateUser: (id: number, name: string, avatar?: string, bio?: string, location?: string, latitude?: number, longitude?: number, phone?: string, website?: string, interests?: string, services?: string, isHost?: number) => {
    db.run(
      `UPDATE users SET name = ?, avatar = ?, bio = ?, location = ?, latitude = ?, longitude = ?, phone = ?, website = ?, interests = ?, services = ?, is_host = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, avatar || null, bio || null, location || null, latitude || null, longitude || null, phone || null, website || null, interests || null, services || null, isHost || 0, id]
    );
    saveDatabase();
  },

  getNearbyUsers: (latitude: number, longitude: number, radiusKm: number, limit: number) => {
    const result = db.exec(
      `SELECT id, email, name, avatar, bio, location, latitude, longitude, services, is_host,
              (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
       FROM users
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       HAVING distance < ?
       ORDER BY distance
       LIMIT ?`,
      [latitude, longitude, latitude, radiusKm, limit]
    );
    return result[0]?.values.map((row: any) => rowToObject(result[0].columns, row)) || [];
  },

  searchUsers: (query: string) => {
    const searchTerm = `%${query}%`;
    const result = db.exec(
      `SELECT id, email, name, avatar, bio, location, services, is_host
       FROM users
       WHERE name LIKE ? OR bio LIKE ? OR services LIKE ?
       LIMIT 50`,
      [searchTerm, searchTerm, searchTerm]
    );
    return result[0]?.values.map((row: any) => rowToObject(result[0].columns, row)) || [];
  }
};

// Conversation queries
export const conversationQueries = usePostgres ? {
  createConversation: async (participant1Id: number, participant2Id: number) => {
    const res = await pgClient.query(`INSERT INTO conversations (participant1_id, participant2_id) VALUES ($1,$2) RETURNING id`, [participant1Id, participant2Id]);
    return { lastID: res[0]?.id ?? null };
  },

  getConversation: async (user1Id: number, user2Id: number) => {
    const rows = await pgClient.query(`SELECT * FROM conversations WHERE (participant1_id = $1 AND participant2_id = $2) OR (participant1_id = $2 AND participant2_id = $1) LIMIT 1`, [user1Id, user2Id]);
    return rows[0] ?? null;
  },

  getUserConversations: async (userId: number) => {
    const rows = await pgClient.query(
      `SELECT c.id, c.participant1_id, c.participant2_id, c.created_at, c.updated_at,
              CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
              u.name, u.avatar, u.email,
              (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = $1 AND read = 0) as unread_count
       FROM conversations c
       LEFT JOIN users u ON u.id = (CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END)
       WHERE c.participant1_id = $1 OR c.participant2_id = $1
       ORDER BY last_message_time DESC`,
      [userId]
    );
    return rows || [];
  },

  updateConversation: async (conversationId: number) => {
    await pgClient.query(
      `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId]
    );
  }
} : {
  createConversation: (participant1Id: number, participant2Id: number) => {
    db.run(
      `INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)`,
      [participant1Id, participant2Id]
    );
    saveDatabase();
    return { lastID: (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 0 };
  },

  getConversation: (user1Id: number, user2Id: number) => {
    const result = db.exec(
      `SELECT * FROM conversations
       WHERE (participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?)`,
      [user1Id, user2Id, user2Id, user1Id]
    );
    return result[0]?.values[0] ? rowToObject(result[0].columns, result[0].values[0]) : null;
  },

  getUserConversations: (userId: number) => {
    const result = db.exec(
      `SELECT c.id, c.created_at, c.updated_at,
              CASE WHEN c.participant1_id = ? THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
              u.name, u.avatar, u.email,
              (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = ? AND read = 0) as unread_count
       FROM conversations c
       LEFT JOIN users u ON u.id = CASE WHEN c.participant1_id = ? THEN c.participant2_id ELSE c.participant1_id END
       WHERE c.participant1_id = ? OR c.participant2_id = ?
       ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId]
    );
    return result[0]?.values.map((row: any) => rowToObject(result[0].columns, row)) || [];
  },

  updateConversation: (conversationId: number) => {
    db.run(
      `UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`,
      [conversationId]
    );
    saveDatabase();
  }
};

// Message queries
export const messageQueries = usePostgres ? {
  createMessage: async (conversationId: number, senderId: number, receiverId: number, text: string) => {
    const res = await pgClient.query(`INSERT INTO messages (conversation_id, sender_id, receiver_id, text) VALUES ($1,$2,$3,$4) RETURNING id`, [conversationId, senderId, receiverId, text]);
    return { lastID: res[0]?.id ?? null };
  },

  getConversationMessages: async (conversationId: number) => {
    const rows = await pgClient.query(`SELECT m.*, u.name as sender_name, u.avatar as sender_avatar FROM messages m LEFT JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`, [conversationId]);
    return rows || [];
  },

  getMessageById: async (id: number) => {
    const rows = await pgClient.query(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
       FROM messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE m.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  },

  markAsRead: async (conversationId: number, receiverId: number) => {
    await pgClient.query(`UPDATE messages SET read = 1 WHERE conversation_id = $1 AND receiver_id = $2`, [conversationId, receiverId]);
  },

  getUnreadCount: async (userId: number) => {
    const rows = await pgClient.query(`SELECT COUNT(*)::int as count FROM messages WHERE receiver_id = $1 AND read = 0`, [userId]);
    return rows[0] ?? { count: 0 };
  }
} : {
  createMessage: (conversationId: number, senderId: number, receiverId: number, text: string) => {
    db.run(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, text) VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, receiverId, text]
    );
    saveDatabase();
    return { lastID: (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 0 };
  },

  getConversationMessages: (conversationId: number) => {
    const result = db.exec(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    return result[0]?.values.map((row: any) => rowToObject(result[0].columns, row)) || [];
  },

  getMessageById: (id: number) => {
    const result = db.exec(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
       FROM messages m 
       LEFT JOIN users u ON m.sender_id = u.id 
       WHERE m.id = ? LIMIT 1`,
      [id]
    );
    return result[0]?.values[0] ? rowToObject(result[0].columns, result[0].values[0]) : null;
  },

  markAsRead: (conversationId: number, receiverId: number) => {
    db.run(
      `UPDATE messages SET read = 1 WHERE conversation_id = ? AND receiver_id = ?`,
      [conversationId, receiverId]
    );
    saveDatabase();
  },

  getUnreadCount: (userId: number) => {
    const result = db.exec(
      `SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0`,
      [userId]
    );
  }
};

// Event queries
export const eventQueries = usePostgres ? {
  createEvent: async (event: any) => {
    const res = await pgClient.query(
      `INSERT INTO events (
        provider_id, title, description, category, start_time, end_time, date, 
        location, is_online, max_participants, current_participants, price, image, tags, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id`,
      [
        event.providerId, event.title, event.description, event.category, event.startTime, event.endTime, event.date,
        event.location, event.isOnline, event.maxParticipants, event.currentParticipants, event.price, event.image,
        JSON.stringify(event.tags), event.status
      ]
    );
    return { lastID: res[0]?.id ?? null };
  },

  getEvents: async () => {
    const rows = await pgClient.query(`
      SELECT e.*, u.name as provider_name, u.avatar as provider_avatar, u.email as provider_email
      FROM events e
      LEFT JOIN users u ON u.id = e.provider_id
      ORDER BY date ASC, start_time ASC
    `);

    // Map snake_case to camelCase and parse tags
    return rows.map((row: any) => ({
      ...row,
      providerId: row.provider_id,
      startTime: row.start_time,
      endTime: row.end_time,
      isOnline: row.is_online,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
      tags: row.tags ? JSON.parse(row.tags) : [],
      provider: {
        id: row.provider_id,
        name: row.provider_name,
        avatar: row.provider_avatar,
        email: row.provider_email,
        // Add other minimal user fields to satisfy type
        isServiceProvider: true,
        rating: 0,
        reviewCount: 0,
        specialties: [],
        joinedDate: '',
        verified: false
      }
    }));
  },

  getEventsByProvider: async (providerId: number) => {
    const rows = await pgClient.query(`
      SELECT * FROM events WHERE provider_id = $1 ORDER BY date ASC, start_time ASC
    `, [providerId]);
    return rows.map((row: any) => ({
      ...row,
      providerId: row.provider_id,
      startTime: row.start_time,
      endTime: row.end_time,
      isOnline: row.is_online,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  },

  getEventById: async (id: number) => {
    const rows = await pgClient.query(`
      SELECT e.*, u.name as provider_name, u.avatar as provider_avatar
      FROM events e
      LEFT JOIN users u ON u.id = e.provider_id
      WHERE e.id = $1
    `, [id]);

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      ...row,
      providerId: row.provider_id,
      startTime: row.start_time,
      endTime: row.end_time,
      isOnline: row.is_online,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
      tags: row.tags ? JSON.parse(row.tags) : []
    };
  },

  deleteEvent: async (id: number) => {
    await pgClient.query(`DELETE FROM events WHERE id = $1`, [id]);
  },

  updateEvent: async (id: number, event: any) => {
    // Only update fields that are provided
    await pgClient.query(`
      UPDATE events SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        date = COALESCE($6, date),
        location = COALESCE($7, location),
        is_online = COALESCE($8, is_online),
        max_participants = COALESCE($9, max_participants),
        price = COALESCE($10, price),
        image = COALESCE($11, image),
        tags = COALESCE($12, tags),
        status = COALESCE($13, status),
        updated_at = NOW()
      WHERE id = $14
    `, [
      event.title, event.description, event.category, event.startTime, event.endTime, event.date,
      event.location, event.isOnline, event.maxParticipants, event.price, event.image,
      event.tags ? JSON.stringify(event.tags) : null, event.status, id
    ]);
  }
} : {
  // SQLite fallback (minimal implementation for compilation, but we are using Postgres)
  createEvent: (event: any) => { return { lastID: 0 }; },
  getEvents: () => [],
  getEventsByProvider: (id: number) => [],
  getEventById: (id: number) => null,
  deleteEvent: (id: number) => { },
  updateEvent: (id: number, event: any) => { }
};

// Product queries
export const productQueries = usePostgres ? {
  createProduct: async (product: any) => {
    const res = await pgClient.query(
      `INSERT INTO products (
        provider_id, title, description, category, price, images, tags, 
        specifications, features, in_stock, stock_count, shipping_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING id`,
      [
        product.providerId, product.title, product.description, product.category, product.price,
        JSON.stringify(product.images || []), JSON.stringify(product.tags || []),
        product.specifications, product.features, product.inStock ?? true,
        product.stockCount ?? 0, product.shippingInfo
      ]
    );
    return { lastID: res[0]?.id ?? null };
  },

  getProducts: async () => {
    const rows = await pgClient.query(`
      SELECT p.*, u.name as provider_name, u.avatar as provider_avatar
      FROM products p
      LEFT JOIN users u ON u.id = p.provider_id
      ORDER BY p.created_at DESC
    `);
    return rows.map((row: any) => ({
      ...row,
      providerId: row.provider_id,
      inStock: row.in_stock,
      stockCount: row.stock_count,
      shippingInfo: row.shipping_info,
      images: row.images ? JSON.parse(row.images) : [],
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  },

  getProductById: async (id: number) => {
    const rows = await pgClient.query(`
      SELECT p.*, u.name as provider_name, u.avatar as provider_avatar
      FROM products p
      LEFT JOIN users u ON u.id = p.provider_id
      WHERE p.id = $1
    `, [id]);

    if (!rows[0]) return null;
    const row = rows[0];
    return {
      ...row,
      providerId: row.provider_id,
      inStock: row.in_stock,
      stockCount: row.stock_count,
      shippingInfo: row.shipping_info,
      images: row.images ? JSON.parse(row.images) : [],
      tags: row.tags ? JSON.parse(row.tags) : []
    };
  },

  getProductsByProvider: async (providerId: number) => {
    const rows = await pgClient.query(`
      SELECT * FROM products WHERE provider_id = $1 ORDER BY created_at DESC
    `, [providerId]);
    return rows.map((row: any) => ({
      ...row,
      providerId: row.provider_id,
      inStock: row.in_stock,
      stockCount: row.stock_count,
      shippingInfo: row.shipping_info,
      images: row.images ? JSON.parse(row.images) : [],
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  },

  updateProduct: async (id: number, product: any) => {
    await pgClient.query(`
      UPDATE products SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        price = COALESCE($4, price),
        images = COALESCE($5, images),
        tags = COALESCE($6, tags),
        specifications = COALESCE($7, specifications),
        features = COALESCE($8, features),
        in_stock = COALESCE($9, in_stock),
        stock_count = COALESCE($10, stock_count),
        shipping_info = COALESCE($11, shipping_info),
        updated_at = NOW()
      WHERE id = $12
    `, [
      product.title, product.description, product.category, product.price,
      product.images ? JSON.stringify(product.images) : null,
      product.tags ? JSON.stringify(product.tags) : null,
      product.specifications, product.features, product.inStock,
      product.stockCount, product.shippingInfo, id
    ]);
  },

  deleteProduct: async (id: number) => {
    await pgClient.query(`DELETE FROM products WHERE id = $1`, [id]);
  }
} : {
  createProduct: (product: any) => ({ lastID: 0 }),
  getProducts: () => [],
  getProductById: (id: number) => null,
  getProductsByProvider: (id: number) => [],
  updateProduct: (id: number, product: any) => { },
  deleteProduct: (id: number) => { }
};

// Notification queries
export const notificationQueries = usePostgres ? {
  createNotification: async (notif: any) => {
    const res = await pgClient.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [notif.userId, notif.type, notif.title, notif.message, notif.data ? JSON.stringify(notif.data) : null]
    );
    return { lastID: res[0]?.id ?? null };
  },

  getUserNotifications: async (userId: number) => {
    const rows = await pgClient.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return rows.map((row: any) => ({
      ...row,
      userId: row.user_id,
      data: row.data ? JSON.parse(row.data) : null
    }));
  },

  markAsRead: async (id: number) => {
    await pgClient.query(`UPDATE notifications SET read = true WHERE id = $1`, [id]);
  },

  markAllAsRead: async (userId: number) => {
    await pgClient.query(`UPDATE notifications SET read = true WHERE user_id = $1`, [userId]);
  },

  getUnreadCount: async (userId: number) => {
    const res = await pgClient.query(
      `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND read = false`,
      [userId]
    );
    return res[0]?.count ?? 0;
  }
} : {
  createNotification: (notif: any) => ({ lastID: 0 }),
  getUserNotifications: (userId: number) => [],
  markAsRead: (id: number) => { },
  markAllAsRead: (userId: number) => { },
  getUnreadCount: (userId: number) => 0
};
