import express, { Request, Response } from 'express';
import { conversationQueries, messageQueries } from '../models/database-sqljs';
import { parseIntSafe, authenticateJWT } from '../middleware/security';
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
router.get('/conversations/user/:id', validateUserId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const userId = parseIntSafe(req.params.id, 'user ID');
    const conversations: any[] = await conversationQueries.getUserConversations(userId);
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

// Delete conversation and its messages
router.delete('/conversations/:conversationId', authenticateJWT, validateConversationId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const conversationId = parseIntSafe(req.params.conversationId, 'conversation ID');
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const conversation: any = await conversationQueries.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const canDelete =
      req.user?.role === 'admin' ||
      Number(conversation.participant1_id) === Number(requesterId) ||
      Number(conversation.participant2_id) === Number(requesterId);

    if (!canDelete) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await conversationQueries.deleteConversation(conversationId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Create or get conversation between two users
router.post('/conversations', authenticateJWT, validateCreateConversation, handleValidationErrors, async (req: Request, res: Response) => {
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

export default router;
