import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import messageRoutes from './routes/messages';
import { initializeDatabase, messageQueries, conversationQueries, getDb } from './models/database-sqljs';

dotenv.config();

// Helper function to convert row array to object
function rowToObject(columns: string[], values: any[]): any {
  const obj: any = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  path: '/socket.io/'
});

// Middleware
app.use(cors());
app.use(express.json());

// REST API Routes
app.use('/api', userRoutes);
app.use('/api', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO - Real-time messaging
const userSockets = new Map<number, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // User joins with their ID
  socket.on('user:join', (userId: number) => {
    userSockets.set(userId, socket.id);
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined with socket ${socket.id}`);
  });

  // Send message
  socket.on('message:send', async (data: { conversationId: number; senderId: number; receiverId: number; text: string }) => {
    try {
      const { conversationId, senderId, receiverId, text } = data;

      // Save message to database
      const result = await messageQueries.createMessage(conversationId, senderId, receiverId, text);

      // Fetch the created message in a DB-agnostic way
      const message: any = await messageQueries.getMessageById(result.lastID);

      // Emit to both sender and receiver
      io.to(`user:${senderId}`).emit('message:new', message);
      io.to(`user:${receiverId}`).emit('message:new', message);

      console.log(`💬 Message sent: ${senderId} -> ${receiverId}`);
    } catch (error) {
      console.error('Message send error:', error);
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  });

  // Start conversation
  socket.on('conversation:start', async (data: { user1Id: number; user2Id: number }) => {
    try {
      const { user1Id, user2Id } = data;

      // Check if conversation exists
      let conversation: any = await conversationQueries.getConversation(user1Id, user2Id);

      if (!conversation) {
        // Create new conversation
        const result = await conversationQueries.createConversation(
          Math.min(user1Id, user2Id),
          Math.max(user1Id, user2Id)
        );
        conversation = { id: result.lastID, participant1_id: user1Id, participant2_id: user2Id };
      }

      // Emit to both users
      io.to(`user:${user1Id}`).emit('conversation:created', conversation);
      io.to(`user:${user2Id}`).emit('conversation:created', conversation);

      console.log(`💬 Conversation started: ${user1Id} <-> ${user2Id}`);
    } catch (error) {
      console.error('Conversation start error:', error);
      socket.emit('conversation:error', { error: 'Failed to start conversation' });
    }
  });

  // Typing indicator
  socket.on('typing:start', (data: { conversationId: number; userId: number; receiverId: number }) => {
    io.to(`user:${data.receiverId}`).emit('typing:start', { conversationId: data.conversationId, userId: data.userId });
  });

  socket.on('typing:stop', (data: { conversationId: number; userId: number; receiverId: number }) => {
    io.to(`user:${data.receiverId}`).emit('typing:stop', { conversationId: data.conversationId, userId: data.userId });
  });

  // Mark messages as read
  socket.on('messages:read', (data: { conversationId: number; userId: number }) => {
    try {
      // markAsRead might be async when using Postgres
      const maybePromise = messageQueries.markAsRead(data.conversationId, data.userId);
      if (maybePromise && typeof (maybePromise as any).then === 'function') {
        (maybePromise as Promise<any>).catch((err) => console.error('Mark as read error:', err));
      }
      // Notify the other user
      socket.broadcast.emit('messages:read', data);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  });

  // User disconnect
  socket.on('disconnect', () => {
    // Remove from userSockets map
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Always listen on all interfaces for Railway

// Initialize database then start server
initializeDatabase().then(() => {
  console.log('✅ Database ready for connections');
  
  httpServer.listen({
    port: PORT,
    host: '0.0.0.0'
  }, () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 WebSocket ready for real-time messaging`);
    console.log(`💾 Database: ${process.env.DATABASE_PATH || 'clubsincronica.db'}`);
    
    // Keep process alive
    setInterval(() => {
      // Heartbeat to keep process alive
    }, 1000);
  });
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
