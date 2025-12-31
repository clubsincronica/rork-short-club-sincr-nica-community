import express, { Request, Response } from 'express';
import { conversationQueries, messageQueries } from '../models/database-sqljs';
import { parseIntSafe } from '../middleware/security';
import {
  validateConversationId,
  validateCreateConversation,
  validateMarkAsRead,
  validateMessagePagination,
  validateUserId,
  handleValidationErrors,
} from '../middleware/validation';

const router = express.Router();

// Get user's conversations
router.get('/conversations/user/:id', (req, res, next) => {
  console.log('🪪 [DEBUG] req.params.id:', req.params.id, 'type:', typeof req.params.id);
  // Extra debug: print raw params and check for edge cases
  try {
    const idVal = req.params.id;
    console.log('🪪 [DEBUG] req.params:', req.params);
    console.log('🪪 [DEBUG] idVal == Number(idVal):', idVal == Number(idVal), 'Number(idVal):', Number(idVal));
    console.log('🪪 [DEBUG] isNaN(Number(idVal)):', isNaN(Number(idVal)));
  } catch (e) {
    console.error('🪪 [DEBUG] Error inspecting req.params.id:', e);
  }
  next();
}, validateUserId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = parseIntSafe(req.params.id, 'user ID');
    console.log('📬 Fetching conversations for user:', userId);
    const conversations: any[] = await conversationQueries.getUserConversations(userId);

    console.log('📬 Found', conversations.length, 'conversations');
    conversations.forEach((conv, index) => {
      // ... existing debug logs ...
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// ... (other routes) ...

// Get unread message count
router.get('/messages/unread/:userId', validateUserId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = parseIntSafe(req.params.userId, 'user ID');
    const result: any = await messageQueries.getUnreadCount(userId);
    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get conversation messages (with pagination)
router.get('/conversations/:conversationId/messages', validateConversationId, validateMessagePagination, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const conversationId = parseIntSafe(req.params.conversationId, 'conversation ID');
    const page = req.query.page ? parseIntSafe(req.query.page, 'page', 1) : 1;
    const limit = req.query.limit ? parseIntSafe(req.query.limit, 'limit', 1, 100) : 50;

    const messages = await messageQueries.getConversationMessages(conversationId);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = messages.slice(startIndex, endIndex);

    res.json({
      messages: paginatedMessages,
      page,
      limit,
      total: messages.length,
      hasMore: endIndex < messages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Create or get conversation between two users
router.post('/conversations', validateCreateConversation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const user1Id = parseIntSafe(req.body.user1Id, 'user1Id');
    const user2Id = parseIntSafe(req.body.user2Id, 'user2Id');

    // Check if conversation already exists
    let conversation: any = await conversationQueries.getConversation(user1Id, user2Id);

    if (!conversation) {
      // Create new conversation
      const result = await conversationQueries.createConversation(
        Math.min(user1Id, user2Id),
        Math.max(user1Id, user2Id)
      );
      conversation = { id: result.lastID, participant1_id: user1Id, participant2_id: user2Id };
    }

    res.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Mark messages as read
router.post('/conversations/:conversationId/read', validateConversationId, validateMarkAsRead, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const conversationId = parseIntSafe(req.params.conversationId, 'conversation ID');
    const userId = parseIntSafe(req.body.userId, 'user ID');
    await messageQueries.markAsRead(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/messages/unread/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseIntSafe(req.params.userId, 'user ID');
    const result: any = await messageQueries.getUnreadCount(userId);
    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
