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

// Emergency fix endpoint - delete corrupted conversations
app.post('/api/fix-conversations', async (req, res) => {
  try {
    console.log('🔧 Running conversation fix...');
    
    // Import pg client if using PostgreSQL
    const usePostgres = !!process.env.DATABASE_URL;
    
    if (!usePostgres) {
      return res.status(400).json({ error: 'This fix is only for PostgreSQL database' });
    }
    
    const pgClient = require('./db/postgres-client');
    
    // Delete corrupted conversations (where both participants are the same)
    console.log('🗑️  Deleting corrupted conversations...');
    const deleteMessages = await pgClient.query(
      'DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE participant1_id = participant2_id)'
    );
    console.log(`   Deleted ${deleteMessages.rowCount} messages from corrupted conversations`);
    
    const deleteConvs = await pgClient.query(
      'DELETE FROM conversations WHERE participant1_id = participant2_id'
    );
    console.log(`   Deleted ${deleteConvs.rowCount} corrupted conversations`);
    
    // Also delete specific bad conversations (2 and 3)
    const deleteSpecificMessages = await pgClient.query(
      'DELETE FROM messages WHERE conversation_id IN (2, 3)'
    );
    console.log(`   Deleted ${deleteSpecificMessages.rowCount} messages from conversations 2 and 3`);
    
    const deleteSpecificConvs = await pgClient.query(
      'DELETE FROM conversations WHERE id IN (2, 3)'
    );
    console.log(`   Deleted ${deleteSpecificConvs.rowCount} specific corrupted conversations`);
    
    // Check if conversation 1 is correct (between user 1 and 2)
    const conv1 = await pgClient.query(
      'SELECT * FROM conversations WHERE id = 1'
    );
    
    let fixedConversationId;
    
    if (conv1.length > 0) {
      const c = conv1[0];
      const hasUser1 = c.participant1_id === 1 || c.participant2_id === 1;
      const hasUser2 = c.participant1_id === 2 || c.participant2_id === 2;
      
      if (hasUser1 && hasUser2) {
        console.log('✅ Conversation 1 is already correct (between users 1 and 2)');
        fixedConversationId = 1;
      } else {
        console.log('❌ Conversation 1 exists but is wrong, deleting it');
        await pgClient.query('DELETE FROM messages WHERE conversation_id = 1');
        await pgClient.query('DELETE FROM conversations WHERE id = 1');
        
        // Create correct conversation
        const newConv = await pgClient.query(
          'INSERT INTO conversations (participant1_id, participant2_id) VALUES (1, 2) RETURNING id'
        );
        fixedConversationId = newConv[0].id;
        console.log(`✅ Created new conversation ${fixedConversationId} between users 1 and 2`);
      }
    } else {
      // Conversation 1 doesn't exist, create it
      const newConv = await pgClient.query(
        'INSERT INTO conversations (participant1_id, participant2_id) VALUES (1, 2) RETURNING id'
      );
      fixedConversationId = newConv[0].id;
      console.log(`✅ Created conversation ${fixedConversationId} between users 1 and 2`);
    }
    
    // Get final state
    const allConversations = await pgClient.query(
      `SELECT c.id, c.participant1_id, c.participant2_id, 
              u1.name as p1_name, u2.name as p2_name
       FROM conversations c
       LEFT JOIN users u1 ON c.participant1_id = u1.id
       LEFT JOIN users u2 ON c.participant2_id = u2.id
       ORDER BY c.id`
    );
    
    console.log('✅ Fix complete!');
    
    res.json({
      success: true,
      message: 'Conversations fixed',
      deletedMessages: deleteMessages.rowCount + deleteSpecificMessages.rowCount,
      deletedConversations: deleteConvs.rowCount + deleteSpecificConvs.rowCount,
      fixedConversationId,
      remainingConversations: allConversations
    });
    
  } catch (error: any) {
    console.error('❌ Fix failed:', error);
    res.status(500).json({ error: error.message });
  }
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
      console.log('💬 Received message:send', { conversationId, senderId, receiverId, text });

      // If conversationId is 0 or missing, create or get conversation
      let finalConversationId = conversationId;
      if (!conversationId || conversationId === 0) {
        console.log('🆕 Creating/getting conversation for users:', senderId, 'and', receiverId);
        let conversation: any = await conversationQueries.getConversation(senderId, receiverId);
        
        if (!conversation) {
          const participant1 = Math.min(senderId, receiverId);
          const participant2 = Math.max(senderId, receiverId);
          console.log(`🆕 Creating NEW conversation: participant1=${participant1}, participant2=${participant2}`);
          
          const result = await conversationQueries.createConversation(participant1, participant2);
          finalConversationId = result.lastID;
          
          console.log(`✅ Created conversation ID ${finalConversationId} between users ${participant1} and ${participant2}`);
        } else {
          finalConversationId = conversation.id;
          console.log(`♻️  Using existing conversation ${finalConversationId} between users ${senderId} and ${receiverId}`);
        }
      }

      // Save message to database
      const result = await messageQueries.createMessage(finalConversationId, senderId, receiverId, text);
      console.log('💾 Message saved, result:', result);

      // Update conversation timestamp
      await conversationQueries.updateConversation(finalConversationId);

      // Fetch the created message in a DB-agnostic way
      const message: any = await messageQueries.getMessageById(result.lastID);
      console.log('📨 Fetched message from DB:', message);
      console.log('📨 Message details: sender_id=', message?.sender_id, 'sender_name=', message?.sender_name, 'receiver_id=', message?.receiver_id);

      if (!message) {
        console.error('❌ Failed to fetch message after creation');
        socket.emit('message:error', { error: 'Message saved but could not be retrieved' });
        return;
      }

      // Emit to both sender and receiver
      console.log(`📤 Emitting message:new to user:${senderId}`);
      io.to(`user:${senderId}`).emit('message:new', message);
      console.log(`📤 Emitting message:new to user:${receiverId}`);
      io.to(`user:${receiverId}`).emit('message:new', message);

      console.log(`✅ Message sent: ${senderId} -> ${receiverId} (conversation ${finalConversationId})`);
      console.log(`📊 Socket rooms status:`);
      console.log(`   - user:${senderId} room has ${io.sockets.adapter.rooms.get(`user:${senderId}`)?.size || 0} clients`);
      console.log(`   - user:${receiverId} room has ${io.sockets.adapter.rooms.get(`user:${receiverId}`)?.size || 0} clients`);
    } catch (error) {
      console.error('❌ Message send error:', error);
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

const PORT = process.env.PORT || 3001;
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
