import { Router } from 'express';
import { lodgingQueries } from '../models/database-sqljs';
import { authenticateJWT } from '../middleware/security';

const router = Router();

// Get all lodging
router.get('/', async (req, res) => {
    try {
        const lodging = await lodgingQueries.getAllLodging();
        res.json(lodging);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get lodging by host
router.get('/host/:userId', async (req, res) => {
    try {
        const lodging = await lodgingQueries.getLodgingByHost(parseInt(req.params.userId));
        res.json(lodging);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get lodging by ID
router.get('/:id', async (req, res) => {
    try {
        const lodging = await lodgingQueries.getLodgingById(parseInt(req.params.id));
        if (!lodging) {
            return res.status(404).json({ error: 'Lodging not found' });
        }
        res.json(lodging);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create lodging
router.post('/', authenticateJWT, async (req: any, res) => {
    try {
        const result = await lodgingQueries.createLodging({
            ...req.body,
            hostId: req.user.userId
        });
        res.status(201).json({ id: result.lastID, message: 'Lodging created successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update lodging
router.put('/:id', authenticateJWT, async (req: any, res) => {
    try {
        await lodgingQueries.updateLodging(parseInt(req.params.id), req.body);
        res.json({ message: 'Lodging updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete lodging
router.delete('/:id', authenticateJWT, async (req: any, res) => {
    try {
        await lodgingQueries.deleteLodging(parseInt(req.params.id));
        res.json({ message: 'Lodging deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
