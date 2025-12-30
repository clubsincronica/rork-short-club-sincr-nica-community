import express, { Request, Response } from 'express';
import { query } from '../db/postgres-client';

const router = express.Router();

/**
 * @route GET /api/notifications/:userId
 * @desc Get all notifications for a specific user
 */
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const notifications = await query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1',
            [id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route PUT /api/notifications/read-all/:userId
 * @desc Mark all notifications as read for a user
 */
router.put('/read-all/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        await query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route POST /api/notifications
 * @desc Create a new notification (internal use or administrative)
 */
router.post('/', async (req: Request, res: Response) => {
    const { user_id, title, message, type } = req.body;

    if (!user_id || !title || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING id',
            [user_id, title, message, type || 'info']
        );

        res.status(201).json({ id: result[0].id });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
