import express, { Router } from 'express';
import * as ReservationModel from '../models/reservation';
import { authenticateJWT } from '../middleware/security';

const router = Router();

// Get reservations for current user
router.get('/user/:userId', async (req: express.Request, res: express.Response) => {
    try {
        const reservations = await ReservationModel.getReservationsByUserId(parseInt(req.params.userId));
        res.json(reservations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get reservations for provider
router.get('/provider/:userId', async (req: express.Request, res: express.Response) => {
    try {
        const reservations = await ReservationModel.getReservationsByProviderId(parseInt(req.params.userId));
        res.json(reservations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create reservation
router.post('/', authenticateJWT, async (req: any, res: express.Response) => {
    try {
        const result = await ReservationModel.createReservation({
            ...req.body,
            userId: req.user.userId
        });
        res.status(201).json({ id: result.lastID, message: 'Reservation created' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update reservation status
router.put('/:id/status', authenticateJWT, async (req: any, res: express.Response) => {
    try {
        const { status, paymentStatus } = req.body;
        await ReservationModel.updateReservationStatus(parseInt(req.params.id), status, paymentStatus);
        res.json({ message: 'Reservation status updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update attendance status
router.put('/:id/attendance', authenticateJWT, async (req: any, res: express.Response) => {
    try {
        const { attended } = req.body;
        await ReservationModel.updateAttendance(parseInt(req.params.id), attended);
        res.json({ message: 'Attendance updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
