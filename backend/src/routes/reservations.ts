import express, { Router } from 'express';
import * as ReservationModel from '../models/reservation';
import { authenticateJWT } from '../middleware/security';
import { validateCreateReservation, handleValidationErrors } from '../middleware/validation';
import { query } from '../db/postgres-client';

const router = Router();

// Get reservations for current user
router.get('/user/:userId', authenticateJWT, async (req: any, res: express.Response) => {
    try {
        // Users can only fetch their own reservations
        if (req.user.userId !== parseInt(req.params.userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const reservations = await ReservationModel.getReservationsByUserId(parseInt(req.params.userId));
        res.json(reservations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get reservations for provider
router.get('/provider/:userId', authenticateJWT, async (req: any, res: express.Response) => {
    try {
        // Providers can only fetch their own reservations
        if (req.user.userId !== parseInt(req.params.userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const reservations = await ReservationModel.getReservationsByProviderId(parseInt(req.params.userId));
        res.json(reservations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create reservation
router.post('/', authenticateJWT, validateCreateReservation, handleValidationErrors, async (req: any, res: express.Response) => {
    try {
        const { eventId, serviceId, productId, providerId, numberOfSpots, paymentMethod, notes } = req.body;
        
        // Derive price from the database
        let unitPrice = 0;
        if (eventId) {
            const eventRes = await query('SELECT price FROM events WHERE id = $1', [eventId]);
            unitPrice = eventRes[0]?.price || 0;
        } else if (serviceId) {
            // some serviceId are strings in the db schema, but here we query by id
            const serviceRes = await query('SELECT price FROM services WHERE id = $1', [serviceId]);
            unitPrice = serviceRes[0]?.price || 0;
        } else if (productId) {
            const productRes = await query('SELECT price FROM products WHERE id = $1', [productId]);
            unitPrice = productRes[0]?.price || 0;
        }

        const spots = numberOfSpots || 1;
        const totalPrice = unitPrice * spots;

        const result = await ReservationModel.createReservation({
            eventId,
            serviceId,
            productId,
            providerId,
            numberOfSpots: spots,
            paymentMethod,
            notes,
            totalPrice,
            userId: req.user.userId,
            status: 'pending',
            paymentStatus: 'pending'
        });
        res.status(201).json({ id: result.lastID, message: 'Reservation created' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update reservation status
router.put('/:id/status', authenticateJWT, async (req: any, res: express.Response) => {
    try {
        const id = parseInt(req.params.id);
        const { status, paymentStatus } = req.body;

        // IDOR Check
        const reservation = await ReservationModel.getReservationById(id);
        if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
        if (reservation.provider_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not own this reservation' });
        }

        await ReservationModel.updateReservationStatus(id, status, paymentStatus);
        res.json({ message: 'Reservation status updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update attendance status
router.put('/:id/attendance', authenticateJWT, async (req: any, res: express.Response) => {
    try {
        const id = parseInt(req.params.id);
        const { attended } = req.body;

        // IDOR Check
        const reservation = await ReservationModel.getReservationById(id);
        if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
        if (reservation.provider_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not own this reservation' });
        }

        await ReservationModel.updateAttendance(id, attended);
        res.json({ message: 'Attendance updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
