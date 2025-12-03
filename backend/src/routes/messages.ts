import express, { Request, Response } from 'express';
import { conversationQueries, messageQueries } from '../models/database-sqljs';

const router = express.Router();

// Get user's conversations
router.get('/conversations/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const conversations: any[] = await conversationQueries.getUserConversations(userId);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const messages = await messageQueries.getConversationMessages(parseInt(req.params.conversationId));
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Create or get conversation between two users
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const { user1Id, user2Id } = req.body;

    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: 'Both user IDs are required' });
    }

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
router.post('/conversations/:conversationId/read', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    await messageQueries.markAsRead(parseInt(req.params.conversationId), userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/messages/unread/:userId', async (req: Request, res: Response) => {
  try {
    const result: any = await messageQueries.getUnreadCount(parseInt(req.params.userId));
    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
