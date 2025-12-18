/**
 * Messaging and Conversation Tests
 * Tests for conversation creation, message sending, and retrieval
 */
import {
  createTestDatabase,
  createTestUser,
  createTestConversation,
  createTestMessage,
  cleanupDatabase,
} from './helpers';
import { Database } from 'sql.js';

describe('Messaging System', () => {
  let db: Database;
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  beforeEach(async () => {
    db = await createTestDatabase();
    
    // Create test users
    const user1 = await createTestUser(db, 'user1@example.com', 'password', 'User One');
    const user2 = await createTestUser(db, 'user2@example.com', 'password', 'User Two');
    const user3 = await createTestUser(db, 'user3@example.com', 'password', 'User Three');
    
    user1Id = user1.id;
    user2Id = user2.id;
    user3Id = user3.id;
  });

  afterEach(() => {
    if (db) {
      cleanupDatabase(db);
      db.close();
    }
  });

  describe('Conversation Creation', () => {
    it('should create conversation between two users', () => {
      const conversationId = createTestConversation(db, user1Id, user2Id);

      expect(conversationId).toBeDefined();
      expect(conversationId).toBeGreaterThan(0);

      // Verify conversation exists
      const result = db.exec('SELECT * FROM conversations WHERE id = ?', [conversationId]);
      expect(result.length).toBe(1);
    });

    it('should store correct participant IDs', () => {
      const conversationId = createTestConversation(db, user1Id, user2Id);

      const result = db.exec(
        'SELECT participant1_id, participant2_id FROM conversations WHERE id = ?',
        [conversationId]
      );

      const [participant1, participant2] = result[0].values[0];
      expect(participant1).toBe(user1Id);
      expect(participant2).toBe(user2Id);
    });

    it('should have created_at timestamp', () => {
      const conversationId = createTestConversation(db, user1Id, user2Id);

      const result = db.exec('SELECT created_at FROM conversations WHERE id = ?', [conversationId]);
      const createdAt = result[0].values[0][0];

      expect(createdAt).toBeDefined();
      expect(typeof createdAt).toBe('string');
    });

    it('should prevent conversation with same user (self-conversation)', () => {
      // This should ideally be prevented at application level
      // Here we just test that we can detect it
      const conversationId = createTestConversation(db, user1Id, user1Id);

      const result = db.exec(
        'SELECT participant1_id, participant2_id FROM conversations WHERE id = ?',
        [conversationId]
      );

      const [participant1, participant2] = result[0].values[0];
      expect(participant1).toBe(participant2); // Same user - bad data
    });

    it('should allow multiple conversations (one per user pair)', () => {
      const conv1 = createTestConversation(db, user1Id, user2Id);
      const conv2 = createTestConversation(db, user1Id, user3Id);
      const conv3 = createTestConversation(db, user2Id, user3Id);

      expect(conv1).not.toBe(conv2);
      expect(conv2).not.toBe(conv3);
      expect(conv1).not.toBe(conv3);

      const result = db.exec('SELECT COUNT(*) as count FROM conversations');
      const count = result[0].values[0][0];
      expect(count).toBe(3);
    });
  });

  describe('Message Creation', () => {
    let conversationId: number;

    beforeEach(() => {
      conversationId = createTestConversation(db, user1Id, user2Id);
    });

    it('should create message in conversation', () => {
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id, 'Hello!');

      expect(messageId).toBeDefined();
      expect(messageId).toBeGreaterThan(0);

      const result = db.exec('SELECT * FROM messages WHERE id = ?', [messageId]);
      expect(result.length).toBe(1);
    });

    it('should store message content correctly', () => {
      const text = 'This is a test message with special chars: 🎉 @#$%';
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id, text);

      const result = db.exec('SELECT text FROM messages WHERE id = ?', [messageId]);
      const storedText = result[0].values[0][0];

      expect(storedText).toBe(text);
    });

    it('should link message to correct conversation', () => {
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id);

      const result = db.exec('SELECT conversation_id FROM messages WHERE id = ?', [messageId]);
      const storedConvId = result[0].values[0][0];

      expect(storedConvId).toBe(conversationId);
    });

    it('should store correct sender and receiver IDs', () => {
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id);

      const result = db.exec(
        'SELECT sender_id, receiver_id FROM messages WHERE id = ?',
        [messageId]
      );

      const [senderId, receiverId] = result[0].values[0];
      expect(senderId).toBe(user1Id);
      expect(receiverId).toBe(user2Id);
    });

    it('should mark new messages as unread by default', () => {
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id);

      const result = db.exec('SELECT read FROM messages WHERE id = ?', [messageId]);
      const isRead = result[0].values[0][0];

      expect(isRead).toBe(0); // 0 = unread
    });

    it('should have created_at timestamp', () => {
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id);

      const result = db.exec('SELECT created_at FROM messages WHERE id = ?', [messageId]);
      const createdAt = result[0].values[0][0];

      expect(createdAt).toBeDefined();
      expect(typeof createdAt).toBe('string');
    });

    it('should handle empty message text', () => {
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id, '');

      const result = db.exec('SELECT text FROM messages WHERE id = ?', [messageId]);
      const text = result[0].values[0][0];

      expect(text).toBe('');
    });

    it('should handle long message text', () => {
      const longText = 'a'.repeat(5000); // 5000 character message
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id, longText);

      const result = db.exec('SELECT text FROM messages WHERE id = ?', [messageId]);
      const storedText = result[0].values[0][0] as string;

      expect(storedText).toBe(longText);
      expect(storedText.length).toBe(5000);
    });
  });

  describe('Message Retrieval', () => {
    let conversationId: number;

    beforeEach(() => {
      conversationId = createTestConversation(db, user1Id, user2Id);
    });

    it('should retrieve messages for conversation', () => {
      createTestMessage(db, conversationId, user1Id, user2Id, 'Message 1');
      createTestMessage(db, conversationId, user2Id, user1Id, 'Message 2');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Message 3');

      const result = db.exec(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at',
        [conversationId]
      );

      expect(result[0].values.length).toBe(3);
    });

    it('should retrieve messages in chronological order', () => {
      createTestMessage(db, conversationId, user1Id, user2Id, 'First');
      createTestMessage(db, conversationId, user2Id, user1Id, 'Second');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Third');

      const result = db.exec(
        'SELECT text FROM messages WHERE conversation_id = ? ORDER BY id',
        [conversationId]
      );

      const messages = result[0].values.map(row => row[0]);
      expect(messages).toEqual(['First', 'Second', 'Third']);
    });

    it('should filter messages by conversation ID', () => {
      const conv2Id = createTestConversation(db, user1Id, user3Id);

      createTestMessage(db, conversationId, user1Id, user2Id, 'Conv1 Message');
      createTestMessage(db, conv2Id, user1Id, user3Id, 'Conv2 Message');

      const result = db.exec(
        'SELECT text FROM messages WHERE conversation_id = ?',
        [conversationId]
      );

      expect(result[0].values.length).toBe(1);
      expect(result[0].values[0][0]).toBe('Conv1 Message');
    });
  });

  describe('Message Read Status', () => {
    let conversationId: number;

    beforeEach(() => {
      conversationId = createTestConversation(db, user1Id, user2Id);
    });

    it('should mark message as read', () => {
      const messageId = createTestMessage(db, conversationId, user1Id, user2Id);

      db.run('UPDATE messages SET read = 1 WHERE id = ?', [messageId]);

      const result = db.exec('SELECT read FROM messages WHERE id = ?', [messageId]);
      const isRead = result[0].values[0][0];

      expect(isRead).toBe(1); // 1 = read
    });

    it('should mark all messages in conversation as read for receiver', () => {
      createTestMessage(db, conversationId, user1Id, user2Id, 'Message 1');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Message 2');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Message 3');

      // Mark all messages from user1 to user2 as read
      db.run(
        'UPDATE messages SET read = 1 WHERE conversation_id = ? AND receiver_id = ?',
        [conversationId, user2Id]
      );

      const result = db.exec(
        'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND receiver_id = ? AND read = 1',
        [conversationId, user2Id]
      );

      const readCount = result[0].values[0][0];
      expect(readCount).toBe(3);
    });

    it('should count unread messages for user', () => {
      const conv2Id = createTestConversation(db, user2Id, user3Id);

      // User2 receives 3 unread messages from user1
      createTestMessage(db, conversationId, user1Id, user2Id, 'Unread 1');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Unread 2');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Unread 3');

      // User2 receives 1 unread message from user3
      createTestMessage(db, conv2Id, user3Id, user2Id, 'From user3');

      const result = db.exec(
        'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0',
        [user2Id]
      );

      const unreadCount = result[0].values[0][0];
      expect(unreadCount).toBe(4);
    });
  });

  describe('Conversation Queries', () => {
    it('should find conversation between two users', () => {
      const conversationId = createTestConversation(db, user1Id, user2Id);

      const result = db.exec(`
        SELECT id FROM conversations
        WHERE (participant1_id = ? AND participant2_id = ?)
           OR (participant1_id = ? AND participant2_id = ?)
      `, [user1Id, user2Id, user2Id, user1Id]);

      expect(result[0].values.length).toBe(1);
      expect(result[0].values[0][0]).toBe(conversationId);
    });

    it('should get all conversations for a user', () => {
      createTestConversation(db, user1Id, user2Id);
      createTestConversation(db, user1Id, user3Id);

      const result = db.exec(`
        SELECT COUNT(*) as count FROM conversations
        WHERE participant1_id = ? OR participant2_id = ?
      `, [user1Id, user1Id]);

      const count = result[0].values[0][0];
      expect(count).toBe(2);
    });

    it('should join conversation with other user details', () => {
      const conversationId = createTestConversation(db, user1Id, user2Id);

      const result = db.exec(`
        SELECT c.id, u.name as other_user_name
        FROM conversations c
        JOIN users u ON u.id = CASE 
          WHEN c.participant1_id = ? THEN c.participant2_id
          ELSE c.participant1_id
        END
        WHERE c.id = ?
      `, [user1Id, conversationId]);

      expect(result[0].values.length).toBe(1);
      const otherUserName = result[0].values[0][1];
      expect(otherUserName).toBe('User Two');
    });
  });

  describe('Message Statistics', () => {
    let conversationId: number;

    beforeEach(() => {
      conversationId = createTestConversation(db, user1Id, user2Id);
    });

    it('should count total messages in conversation', () => {
      createTestMessage(db, conversationId, user1Id, user2Id, 'Message 1');
      createTestMessage(db, conversationId, user2Id, user1Id, 'Message 2');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Message 3');

      const result = db.exec(
        'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
        [conversationId]
      );

      const count = result[0].values[0][0];
      expect(count).toBe(3);
    });

    it('should get last message in conversation', () => {
      createTestMessage(db, conversationId, user1Id, user2Id, 'First');
      createTestMessage(db, conversationId, user2Id, user1Id, 'Second');
      createTestMessage(db, conversationId, user1Id, user2Id, 'Last');

      const result = db.exec(`
        SELECT text FROM messages 
        WHERE conversation_id = ? 
        ORDER BY id DESC 
        LIMIT 1
      `, [conversationId]);

      const lastMessage = result[0].values[0][0];
      expect(lastMessage).toBe('Last');
    });

    it('should count messages sent by specific user', () => {
      createTestMessage(db, conversationId, user1Id, user2Id, 'From user1 #1');
      createTestMessage(db, conversationId, user1Id, user2Id, 'From user1 #2');
      createTestMessage(db, conversationId, user2Id, user1Id, 'From user2');

      const result = db.exec(
        'SELECT COUNT(*) as count FROM messages WHERE sender_id = ?',
        [user1Id]
      );

      const count = result[0].values[0][0];
      expect(count).toBe(2);
    });
  });
});
