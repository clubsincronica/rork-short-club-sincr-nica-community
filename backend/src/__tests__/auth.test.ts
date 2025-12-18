/**
 * Authentication Tests
 * Tests for user registration, login, and JWT token generation
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createTestDatabase, createTestUser, cleanupDatabase } from './helpers';
import { Database } from 'sql.js';

describe('Authentication', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(() => {
    if (db) {
      cleanupDatabase(db);
      db.close();
    }
  });

  describe('User Registration', () => {
    it('should create a new user with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';

      const user = await createTestUser(db, email, password, name);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);

      // Verify user exists in database
      const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
      expect(result.length).toBe(1);
      expect(result[0].values.length).toBe(1);
    });

    it('should create user without password (OAuth flow)', async () => {
      const email = 'oauth@example.com';
      const name = 'OAuth User';

      const user = await createTestUser(db, email, undefined, name);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.password).toBeUndefined();

      // Verify password_hash is null
      const result = db.exec('SELECT password_hash FROM users WHERE email = ?', [email]);
      const passwordHash = result[0].values[0][0];
      expect(passwordHash).toBeNull();
    });

    it('should hash passwords using bcrypt', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword.startsWith('$2b$')).toBe(true);

      // Verify hash can be compared
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject duplicate email addresses', () => {
      const email = 'duplicate@example.com';

      // Create first user
      db.run('INSERT INTO users (email, name) VALUES (?, ?)', [email, 'User 1']);

      // Attempt to create second user with same email
      expect(() => {
        db.run('INSERT INTO users (email, name) VALUES (?, ?)', [email, 'User 2']);
      }).toThrow();
    });
  });

  describe('Password Validation', () => {
    it('should validate correct password', async () => {
      const password = 'correctPassword';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const hash = await bcrypt.hash('password', 10);
      const isValid = await bcrypt.compare('', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const userId = 123;
      const email = 'test@example.com';
      const secret = 'test-secret';

      const token = jwt.sign({ userId, email }, secret, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should decode JWT token correctly', () => {
      const userId = 456;
      const email = 'decode@example.com';
      const secret = 'test-secret';

      const token = jwt.sign({ userId, email }, secret, { expiresIn: '1h' });
      const decoded: any = jwt.verify(token, secret);

      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.exp).toBeDefined();
    });

    it('should reject token with wrong secret', () => {
      const token = jwt.sign({ userId: 1 }, 'secret1', { expiresIn: '1h' });

      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should reject expired token', (done) => {
      const token = jwt.sign({ userId: 1 }, 'test-secret', { expiresIn: '1ms' });

      // Wait for token to expire
      setTimeout(() => {
        expect(() => {
          jwt.verify(token, 'test-secret');
        }).toThrow(/expired/);
        done();
      }, 100);
    });

    it('should include correct expiration time', () => {
      const secret = 'test-secret';
      const expiresIn = '30d';
      const token = jwt.sign({ userId: 1 }, secret, { expiresIn });
      
      const decoded: any = jwt.verify(token, secret);
      const now = Math.floor(Date.now() / 1000);
      const thirtyDays = 30 * 24 * 60 * 60;
      
      // Check expiration is approximately 30 days from now (within 10 seconds tolerance)
      expect(decoded.exp).toBeGreaterThan(now + thirtyDays - 10);
      expect(decoded.exp).toBeLessThan(now + thirtyDays + 10);
    });
  });

  describe('User Data Retrieval', () => {
    it('should retrieve user by email', async () => {
      const email = 'retrieve@example.com';
      const name = 'Retrieve User';
      await createTestUser(db, email, 'password', name);

      const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
      
      expect(result.length).toBe(1);
      const columns = result[0].columns;
      const values = result[0].values[0];
      
      const emailIndex = columns.indexOf('email');
      const nameIndex = columns.indexOf('name');
      
      expect(values[emailIndex]).toBe(email);
      expect(values[nameIndex]).toBe(name);
    });

    it('should retrieve user by ID', async () => {
      const user = await createTestUser(db, 'id@example.com', 'password', 'ID User');

      const result = db.exec('SELECT * FROM users WHERE id = ?', [user.id]);
      
      expect(result.length).toBe(1);
      expect(result[0].values.length).toBe(1);
    });

    it('should return empty result for non-existent email', () => {
      const result = db.exec('SELECT * FROM users WHERE email = ?', ['nonexistent@example.com']);
      expect(result.length).toBe(0);
    });
  });

  describe('User Profile Data', () => {
    it('should store optional profile fields', async () => {
      db.run(`
        INSERT INTO users (email, name, bio, location, phone, website)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['profile@example.com', 'Profile User', 'My bio', 'New York', '+1234567890', 'https://example.com']);

      const result = db.exec('SELECT bio, location, phone, website FROM users WHERE email = ?', ['profile@example.com']);
      const values = result[0].values[0];

      expect(values[0]).toBe('My bio');
      expect(values[1]).toBe('New York');
      expect(values[2]).toBe('+1234567890');
      expect(values[3]).toBe('https://example.com');
    });

    it('should handle NULL optional fields', async () => {
      const user = await createTestUser(db, 'minimal@example.com', 'password', 'Minimal User');

      const result = db.exec('SELECT bio, location, phone, website FROM users WHERE id = ?', [user.id]);
      const values = result[0].values[0];

      // All optional fields should be null
      expect(values.every(v => v === null)).toBe(true);
    });

    it('should store location coordinates', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;

      db.run(`
        INSERT INTO users (email, name, latitude, longitude)
        VALUES (?, ?, ?, ?)
      `, ['location@example.com', 'Location User', latitude, longitude]);

      const result = db.exec('SELECT latitude, longitude FROM users WHERE email = ?', ['location@example.com']);
      const values = result[0].values[0];

      expect(values[0]).toBe(latitude);
      expect(values[1]).toBe(longitude);
    });
  });
});
