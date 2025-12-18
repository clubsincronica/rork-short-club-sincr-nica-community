/**
 * Socket.IO Integration Tests
 * Tests for real-time messaging functionality
 */
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import {
  createTestDatabase,
  createTestUser,
  createTestConversation,
  waitFor,
  cleanupDatabase,
} from './helpers';
import { Database } from 'sql.js';

describe('Socket.IO Real-time Messaging', () => {
  let httpServer: any;
  let io: Server;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let serverPort: number;
  let db: Database;
  let user1Id: number;
  let user2Id: number;
  let conversationId: number;

  beforeEach((done) => {
    // Create test database
    createTestDatabase().then((database) => {
      db = database;
      return createTestUser(db, 'user1@example.com', 'password', 'User One');
    }).then((user1) => {
      user1Id = user1.id;
      return createTestUser(db, 'user2@example.com', 'password', 'User Two');
    }).then((user2) => {
      user2Id = user2.id;
      conversationId = createTestConversation(db, user1Id, user2Id);

      // Create HTTP server and Socket.IO
      httpServer = createServer();
      io = new Server(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket'],
      });

    // Setup Socket.IO handlers (simplified version)
    io.on('connection', (socket) => {
      socket.on('user:join', (userId: number) => {
        socket.join(`user:${userId}`);
      });

      socket.on('message:send', async (data: {
        conversationId: number;
        senderId: number;
        receiverId: number;
        text: string;
      }) => {
        const message = {
          id: Date.now(),
          conversation_id: data.conversationId,
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          text: data.text,
          read: 0,
          created_at: new Date().toISOString(),
        };

        // Emit to both sender and receiver
        io.to(`user:${data.senderId}`).emit('message:new', message);
        io.to(`user:${data.receiverId}`).emit('message:new', message);
      });

      socket.on('typing:start', (data: { conversationId: number; userId: number; receiverId: number }) => {
        io.to(`user:${data.receiverId}`).emit('typing:start', {
          conversationId: data.conversationId,
          userId: data.userId,
        });
      });

      socket.on('typing:stop', (data: { conversationId: number; userId: number; receiverId: number }) => {
        io.to(`user:${data.receiverId}`).emit('typing:stop', {
          conversationId: data.conversationId,
          userId: data.userId,
        });
      });
    });

      // Start server on random available port
      httpServer.listen(() => {
        serverPort = (httpServer.address() as any).port;
        done();
      });
    });
  });

  afterEach((done) => {
    // Cleanup
    if (clientSocket1 && clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
    
    io.close(() => {
      httpServer.close(() => {
        if (db) {
          cleanupDatabase(db);
          db.close();
        }
        done();
      });
    });
  });

  describe('Connection', () => {
    it('should connect client to server', (done) => {
      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).toBe(true);
        done();
      });
    });

    it('should handle multiple client connections', (done) => {
      let connectedCount = 0;
      const checkBothConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          expect(clientSocket1.connected).toBe(true);
          expect(clientSocket2.connected).toBe(true);
          done();
        }
      };

      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', checkBothConnected);
      clientSocket2.on('connect', checkBothConnected);
    });

    it('should disconnect client', (done) => {
      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', () => {
        clientSocket1.disconnect();
      });

      clientSocket1.on('disconnect', () => {
        expect(clientSocket1.connected).toBe(false);
        done();
      });
    });
  });

  describe('User Join', () => {
    it('should allow user to join with their ID', (done) => {
      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', () => {
        clientSocket1.emit('user:join', user1Id);
        
        // Wait a bit to ensure join is processed
        setTimeout(() => {
          expect(clientSocket1.connected).toBe(true);
          done();
        }, 100);
      });
    });

    it('should allow multiple users to join', (done) => {
      let joinedCount = 0;
      const checkBothJoined = () => {
        joinedCount++;
        if (joinedCount === 2) {
          done();
        }
      };

      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', () => {
        clientSocket1.emit('user:join', user1Id);
        checkBothJoined();
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('user:join', user2Id);
        checkBothJoined();
      });
    });
  });

  describe('Message Sending', () => {
    beforeEach((done) => {
      let connectedCount = 0;
      const checkBothReady = () => {
        connectedCount++;
        if (connectedCount === 2) {
          done();
        }
      };

      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', () => {
        clientSocket1.emit('user:join', user1Id);
        checkBothReady();
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('user:join', user2Id);
        checkBothReady();
      });
    });

    it('should send message from user1 to user2', (done) => {
      const messageText = 'Hello from user1!';

      clientSocket2.on('message:new', (message: any) => {
        expect(message.text).toBe(messageText);
        expect(message.sender_id).toBe(user1Id);
        expect(message.receiver_id).toBe(user2Id);
        done();
      });

      clientSocket1.emit('message:send', {
        conversationId,
        senderId: user1Id,
        receiverId: user2Id,
        text: messageText,
      });
    });

    it('should deliver message to both sender and receiver', (done) => {
      const messageText = 'Test message';
      let receivedCount = 0;

      const checkBothReceived = (message: any) => {
        expect(message.text).toBe(messageText);
        receivedCount++;
        if (receivedCount === 2) {
          done();
        }
      };

      clientSocket1.on('message:new', checkBothReceived);
      clientSocket2.on('message:new', checkBothReceived);

      clientSocket1.emit('message:send', {
        conversationId,
        senderId: user1Id,
        receiverId: user2Id,
        text: messageText,
      });
    });

    it('should handle multiple messages in sequence', (done) => {
      const messages: string[] = [];
      const expectedMessages = ['Message 1', 'Message 2', 'Message 3'];

      clientSocket2.on('message:new', (message: any) => {
        messages.push(message.text);

        if (messages.length === 3) {
          expect(messages).toEqual(expectedMessages);
          done();
        }
      });

      expectedMessages.forEach((text, index) => {
        setTimeout(() => {
          clientSocket1.emit('message:send', {
            conversationId,
            senderId: user1Id,
            receiverId: user2Id,
            text,
          });
        }, index * 50);
      });
    });

    it('should include conversation ID in message', (done) => {
      clientSocket2.on('message:new', (message: any) => {
        expect(message.conversation_id).toBe(conversationId);
        done();
      });

      clientSocket1.emit('message:send', {
        conversationId,
        senderId: user1Id,
        receiverId: user2Id,
        text: 'Test',
      });
    });

    it('should handle empty message text', (done) => {
      clientSocket2.on('message:new', (message: any) => {
        expect(message.text).toBe('');
        done();
      });

      clientSocket1.emit('message:send', {
        conversationId,
        senderId: user1Id,
        receiverId: user2Id,
        text: '',
      });
    });

    it('should handle special characters in message', (done) => {
      const specialText = 'Test 🎉 @#$% <script>alert("xss")</script>';

      clientSocket2.on('message:new', (message: any) => {
        expect(message.text).toBe(specialText);
        done();
      });

      clientSocket1.emit('message:send', {
        conversationId,
        senderId: user1Id,
        receiverId: user2Id,
        text: specialText,
      });
    });
  });

  describe('Typing Indicators', () => {
    beforeEach((done) => {
      let connectedCount = 0;
      const checkBothReady = () => {
        connectedCount++;
        if (connectedCount === 2) {
          done();
        }
      };

      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', () => {
        clientSocket1.emit('user:join', user1Id);
        checkBothReady();
      });

      clientSocket2.on('connect', () => {
        clientSocket2.emit('user:join', user2Id);
        checkBothReady();
      });
    });

    it('should emit typing start indicator', (done) => {
      clientSocket2.on('typing:start', (data: any) => {
        expect(data.userId).toBe(user1Id);
        expect(data.conversationId).toBe(conversationId);
        done();
      });

      clientSocket1.emit('typing:start', {
        conversationId,
        userId: user1Id,
        receiverId: user2Id,
      });
    });

    it('should emit typing stop indicator', (done) => {
      clientSocket2.on('typing:stop', (data: any) => {
        expect(data.userId).toBe(user1Id);
        expect(data.conversationId).toBe(conversationId);
        done();
      });

      clientSocket1.emit('typing:stop', {
        conversationId,
        userId: user1Id,
        receiverId: user2Id,
      });
    });

    it('should handle typing start and stop sequence', (done) => {
      const events: string[] = [];

      clientSocket2.on('typing:start', () => {
        events.push('start');
      });

      clientSocket2.on('typing:stop', () => {
        events.push('stop');
        expect(events).toEqual(['start', 'stop']);
        done();
      });

      clientSocket1.emit('typing:start', {
        conversationId,
        userId: user1Id,
        receiverId: user2Id,
      });

      setTimeout(() => {
        clientSocket1.emit('typing:stop', {
          conversationId,
          userId: user1Id,
          receiverId: user2Id,
        });
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle disconnection gracefully', (done) => {
      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket1.on('connect', () => {
        clientSocket1.emit('user:join', user1Id);
        clientSocket1.disconnect();
      });

      clientSocket1.on('disconnect', () => {
        expect(clientSocket1.connected).toBe(false);
        done();
      });
    });

    it('should handle reconnection', (done) => {
      clientSocket1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 100,
      });

      let disconnectCount = 0;

      clientSocket1.on('connect', () => {
        if (disconnectCount === 0) {
          clientSocket1.disconnect();
        } else {
          // Successfully reconnected
          expect(clientSocket1.connected).toBe(true);
          done();
        }
      });

      clientSocket1.on('disconnect', () => {
        disconnectCount++;
        if (disconnectCount === 1) {
          // Trigger reconnection
          clientSocket1.connect();
        }
      });
    });
  });
});
