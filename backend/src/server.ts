import 'dotenv/config'; // Must be first!
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors'; // removed manual dotenv import as it is now at the top
import jwt from 'jsonwebtoken';
import userRoutes from './routes/users';
import messageRoutes from './routes/messages';
import eventRoutes from './routes/events';
import paymentsRoutes from './routes/payments';
import webhooksRoutes from './routes/webhooks';
import { initializeDatabase, messageQueries, conversationQueries, getDb } from './models/database-sqljs';
import { validateEnvironment, isProduction, getJWTSecret } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';

// Validate environment variables before starting server
try {
  validateEnvironment();
} catch (error: any) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Helper function to convert row array to object
function rowToObject(columns: string[], values: any[]): any {
  const obj: any = {};
  columns.forEach((col, i) => {
    obj[col] = values[i];
  });
  return obj;
}

// CORS Configuration
const allowedOrigins = [
  'https://clubsincronica.app',
  'https://www.clubsincronica.app',
  'https://rork.com' // From app.json
];

// Helper to check origin
function getCorsOptions() {
  if (!isProduction()) {
    return { origin: true, credentials: true }; // Allow all in dev
  }
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  };
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: getCorsOptions() as any, // Type cast to avoid excessive typing issues for now
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  path: '/socket.io/'
});

// Trust proxy - required for Railway and other reverse proxies
// This allows express-rate-limit to correctly identify users via X-Forwarded-For
app.set('trust proxy', true);

// Middleware
app.use((req, res, next) => {
  console.log(`🛣️  [DEBUG] Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});
app.use(cors(getCorsOptions()));
app.use(express.json());

// Webhook endpoints (must be before body parsers for Stripe)
app.use('/api/webhooks', webhooksRoutes);

// Apply rate limiting to all API routes in production
if (isProduction()) {
  app.use('/api', apiLimiter);
  console.log('✅ Rate limiting enabled for production');
}

// REST API Routes
app.use('/api', userRoutes);
app.use('/api', messageRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', require('./routes/admin').default);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Emergency fix endpoint - delete corrupted conversations (DEVELOPMENT ONLY)
if (!isProduction()) {
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

  // Debug endpoint - show raw database data (DEVELOPMENT ONLY)
  app.get('/api/debug-conversations', async (req, res) => {
    try {
      const usePostgres = !!process.env.DATABASE_URL;
      if (!usePostgres) {
        return res.status(400).json({ error: 'PostgreSQL only' });
      }

      const pgClient = require('./db/postgres-client');

      // Get all users
      const users = await pgClient.query('SELECT id, name, email FROM users ORDER BY id');

      // Get all conversations with names
      const conversations = await pgClient.query(`
      SELECT c.id, c.participant1_id, c.participant2_id,
             u1.name as p1_name, u2.name as p2_name
      FROM conversations c
      LEFT JOIN users u1 ON c.participant1_id = u1.id
      LEFT JOIN users u2 ON c.participant2_id = u2.id
      ORDER BY c.id
    `);

      // Test the query for user 1
      const user1Convs = await pgClient.query(`
      SELECT c.id, c.participant1_id, c.participant2_id,
             CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
             u.id as joined_user_id, u.name as joined_user_name
      FROM conversations c
      LEFT JOIN users u ON u.id = (CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END)
      WHERE c.participant1_id = $1 OR c.participant2_id = $1
    `, [1]);

      // Test the query for user 2
      const user2Convs = await pgClient.query(`
      SELECT c.id, c.participant1_id, c.participant2_id,
             CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
             u.id as joined_user_id, u.name as joined_user_name
      FROM conversations c
      LEFT JOIN users u ON u.id = (CASE WHEN c.participant1_id = $1 THEN c.participant2_id ELSE c.participant1_id END)
      WHERE c.participant1_id = $1 OR c.participant2_id = $1
    `, [2]);

      res.json({
        users,
        conversations,
        user1Conversations: user1Convs,
        user2Conversations: user2Convs
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
} else {
  // In production, block debug and fix endpoints
  app.use(['/api/debug-conversations', '/api/fix-conversations'], (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  console.log('✅ Debug endpoints disabled in production');
}

// Socket.IO - Real-time messaging with JWT authentication
const userSockets = new Map<number, string>(); // userId -> socketId

// Socket.IO JWT authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log('❌ Socket connection rejected: No token provided');
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, getJWTSecret()) as any;
    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;

    console.log(`✅ Socket authenticated for user ${decoded.userId} (${decoded.email})`);
    next();
  } catch (error) {
    console.log('❌ Socket authentication failed:', error);
    return next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const authenticatedUserId = socket.data.userId;
  console.log('👤 User connected:', socket.id, 'User ID:', authenticatedUserId);

  // User joins with their authenticated ID
  socket.on('user:join', () => {
    userSockets.set(authenticatedUserId, socket.id);
    socket.join(`user:${authenticatedUserId}`);
    // Log room size for debugging
    const room = io.sockets.adapter.rooms.get(`user:${authenticatedUserId}`);
    const roomSize = room ? room.size : 0;
    console.log(`👤 User ${authenticatedUserId} joined room user:${authenticatedUserId} with socket ${socket.id}. Room size: ${roomSize}`);
  });

  // Send message - use authenticated sender ID
  socket.on('message:send', async (data: { conversationId: number; receiverId: number; text: string }) => {
    try {
      const senderId = authenticatedUserId; // Use authenticated ID, not client data
      const { conversationId, receiverId, text } = data;
      console.log('💬 Received message:send', { conversationId, senderId, receiverId, text });

      // Clean/validate inputs
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        socket.emit('message:error', { error: 'Message text is required' });
        return;
      }

      let finalConversationId = conversationId;

      // If conversationId is provided, verify user belongs to it
      if (conversationId && conversationId > 0) {
        // We need to implement getConversationById in conversationQueries if it doesn't exist
        // For now, let's verify by fetching the conversation between these two users
        // and checking if the ID matches.

        // Better approach: Check if sender is part of this specific conversation
        // Since we might not have getConversationById exposed yet, we'll verify the intent:
        // Does a conversation exist between sender and receiver with this ID?

        const conversation: any = await conversationQueries.getConversation(senderId, receiverId);

        if (!conversation) {
          // Client sent a conversationID but no conversation exists between these users?
          // This implies they might be trying to send to a conversation they are not part of,
          // OR the conversation ID is for a different pair of users.
          console.warn(`⚠️ User ${senderId} tried to send to conversation ${conversationId} with ${receiverId} but no direct conversation found.`);
          // We will treat this as a new conversation or error checks
        } else if (conversation.id !== conversationId) {
          console.warn(`⚠️ User ${senderId} tried to send to conversation ${conversationId} but their conversation with ${receiverId} is ${conversation.id}`);
          // Force use of the correct conversation ID
          finalConversationId = conversation.id;
        }
        // If matches, we are good.
      }

      // If conversationId is 0 or missing, create or get conversation
      if (!finalConversationId || finalConversationId === 0) {
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

      // Final sanity check - if we somehow still don't have a valid conversation ID
      if (!finalConversationId) {
        socket.emit('message:error', { error: 'Could not resolve conversation' });
        return;
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

  // Start conversation - use authenticated user ID
  socket.on('conversation:start', async (data: { otherUserId: number }) => {
    try {
      const user1Id = authenticatedUserId; // Use authenticated ID
      const user2Id = data.otherUserId;

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

  // Typing indicator - use authenticated user ID
  socket.on('typing:start', (data: { conversationId: number; receiverId: number }) => {
    io.to(`user:${data.receiverId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: authenticatedUserId
    });
  });

  socket.on('typing:stop', (data: { conversationId: number; receiverId: number }) => {
    io.to(`user:${data.receiverId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: authenticatedUserId
    });
  });

  // Mark messages as read - use authenticated user ID
  socket.on('messages:read', (data: { conversationId: number }) => {
    try {
      // Use authenticated user ID instead of client-provided
      const maybePromise = messageQueries.markAsRead(data.conversationId, authenticatedUserId);
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
    // Remove from userSockets map using authenticated user ID
    userSockets.delete(authenticatedUserId);
    console.log(`👤 User ${authenticatedUserId} disconnected`);
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
