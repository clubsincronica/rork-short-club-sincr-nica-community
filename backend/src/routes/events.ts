import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { eventQueries } from '../models/database-sqljs';
import { authenticateJWT } from '../middleware/security';

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await eventQueries.getEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Create new event
router.post(
    '/',
    authenticateJWT,
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('date').notEmpty().withMessage('Date is required (YYYY-MM-DD)'),
        body('startTime').notEmpty().withMessage('Start time is required (HH:MM)'),
        body('endTime').notEmpty().withMessage('End time is required (HH:MM)'),
    ],
    async (req: any, res: express.Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const eventData = {
                ...req.body,
                providerId: req.user.userId
            };

            const result = await eventQueries.createEvent(eventData);
            res.status(201).json({
                message: 'Event created',
                id: result.lastID,
                ...eventData
            });
        } catch (error: any) {
            console.error('Error creating event:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Get events by provider
router.get('/provider/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const events = await eventQueries.getEventsByProvider(userId);
        res.json(events);
    } catch (error) {
        console.error('Error fetching provider events:', error);
        res.status(500).json({ error: 'Failed to fetch provider events' });
    }
});

// Update event
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await eventQueries.updateEvent(id, req.body);
        res.json({ message: 'Event updated successfully' });
    } catch (error: any) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete event
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await eventQueries.deleteEvent(id);
        res.json({ message: 'Event deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
