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
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

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

      console.log('Postgres database initialized');
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
          CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

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
  createUser: async (email: string, passwordHash: string | null, name: string, avatar?: string, bio?: string, location?: string, latitude?: number, longitude?: number, phone?: string, website?: string, interests?: string, services?: string, isHost?: number) => {
    const res = await pgClient.query(
      `INSERT INTO users (email, password_hash, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [email, passwordHash, name, avatar || null, bio || null, location || null, latitude || null, longitude || null, phone || null, website || null, interests || null, services || null, isHost || 0]
    );
    return { lastID: res[0]?.id ?? null };
  },

  getUserByEmail: async (email: string) => {
    const rows = await pgClient.query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
    return rows[0] ?? null;
  },

  getUserById: async (id: number) => {
    const rows = await pgClient.query(`SELECT id, email, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host, created_at, updated_at FROM users WHERE id = $1 LIMIT 1`, [id]);
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
      `SELECT id, email, name, avatar, bio, location, latitude, longitude, services, is_host,
        (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) AS distance
       FROM users
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       HAVING (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) < $3
       ORDER BY distance
       LIMIT $4`,
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
  createUser: (email: string, passwordHash: string | null, name: string, avatar?: string, bio?: string, location?: string, latitude?: number, longitude?: number, phone?: string, website?: string, interests?: string, services?: string, isHost?: number) => {
    db.run(
      `INSERT INTO users (email, password_hash, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, name, avatar || null, bio || null, location || null, latitude || null, longitude || null, phone || null, website || null, interests || null, services || null, isHost || 0]
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
      `SELECT id, email, name, avatar, bio, location, latitude, longitude, phone, website, interests, services, is_host, created_at, updated_at
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
      `SELECT c.id, c.created_at, c.updated_at,
              CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
              u.name, u.avatar, u.email,
              (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = $1 AND read = 0) as unread_count
       FROM conversations c
       LEFT JOIN users u ON u.id = CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END
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
    return result[0]?.values[0] ? rowToObject(result[0].columns, result[0].values[0]) : { count: 0 };
  }
};
