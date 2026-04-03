import { Router } from 'express';
import { serviceQueries } from '../models/database-sqljs';
import { authenticateJWT } from '../middleware/security';

const router = Router();

// Get all active services
router.get('/', async (req, res) => {
    try {
        const services = await serviceQueries.getAllServices();
        res.json(services);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get services by provider
router.get('/provider/:userId', async (req, res) => {
    try {
        const services = await serviceQueries.getServicesByProvider(parseInt(req.params.userId));
        res.json(services);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get service by ID
router.get('/:id', async (req, res) => {
    try {
        const service = await serviceQueries.getServiceById(parseInt(req.params.id));
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create service
router.post('/', authenticateJWT, async (req: any, res) => {
    try {
        const result = await serviceQueries.createService({
            ...req.body,
            providerId: req.user.userId
        });
        res.status(201).json({ id: result.lastID, message: 'Service created successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update service
router.put('/:id', authenticateJWT, async (req: any, res) => {
    try {
        await serviceQueries.updateService(parseInt(req.params.id), req.body);
        res.json({ message: 'Service updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete service
router.delete('/:id', authenticateJWT, async (req: any, res) => {
    try {
        await serviceQueries.deleteService(parseInt(req.params.id));
        res.json({ message: 'Service deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
