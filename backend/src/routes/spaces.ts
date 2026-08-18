import express, { Router } from 'express';
import * as SpaceModel from '../models/space';
import * as BookingModel from '../models/space-booking';
import { cellStates, nextAvailable } from '../models/availability';
import { authenticateJWT } from '../middleware/security';
import { validateSpaceBooking, handleValidationErrors } from '../middleware/validation';

const router = Router();

const isOwner = (space: any, req: any) => space.owner_id === req.user.userId || req.user.role === 'admin';

function safeJson(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value ?? [];
}

function buildDayList(from?: string, to?: string): string[] {
  if (!from || !to) return [];
  const days: string[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime() && days.length < 62) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// List published spaces (public)
router.get('/', async (req: any, res: express.Response) => {
  try {
    const { type, capacity, maxHourlyPrice } = req.query;
    const spaces = await SpaceModel.getPublishedSpaces({
      type: type as string | undefined,
      capacity: capacity !== undefined ? parseInt(capacity as string, 10) : undefined,
      maxHourlyPrice: maxHourlyPrice !== undefined ? parseFloat(maxHourlyPrice as string) : undefined,
    });
    res.json(spaces);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get space with subspaces + availability (public for published; owner sees own unpublished)
router.get('/:id', async (req: any, res: express.Response) => {
  try {
    const spaceId = parseInt(req.params.id);
    const space = await SpaceModel.getSpaceById(spaceId);
    if (!space || (space.is_published !== true && space.owner_id !== req.user?.userId && req.user?.role !== 'admin')) {
      return res.status(404).json({ error: 'Space not found' });
    }
    const subspaces = await SpaceModel.getSubSpacesBySpace(spaceId);
    const from = req.query.from as string;
    const to = req.query.to as string;
    const days = buildDayList(from, to);
    const enriched = [];
    for (const sub of subspaces) {
      const bookings = await BookingModel.getBookingsForSubSpace(sub.id).then(rows =>
        rows.filter((r: any) => days.includes(r.date))
      );
      const bh = safeJson(sub.business_hours);
      let availability: any[] = [];
      if (from && to) {
        availability = days.map(d => ({
          date: d,
          cells: cellStates(
            { businessHours: bh, slotGranularity: sub.slot_granularity, minAdvance: sub.min_advance, maxDuration: sub.max_duration },
            d,
            bookings.map((b: any) => ({ startTime: b.start_time, endTime: b.end_time, status: b.status })),
            new Date()
          ),
        }));
      }
      enriched.push({ ...sub, availability });
    }
    res.json({ ...space, subspaces: enriched });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create space
router.post('/', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const result = await SpaceModel.createSpace({
      ownerId: req.user.userId,
      title: req.body.title ?? 'Untitled space',
      description: req.body.description,
      location: req.body.location,
      images: req.body.images,
      amenities: req.body.amenities,
      calendarMode: req.body.calendarMode,
      tags: req.body.tags,
    });
    res.status(201).json({ id: result.lastID, message: 'Space created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update space (owner)
router.put('/:id', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const space = await SpaceModel.getSpaceById(id);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (!isOwner(space, req)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this space' });
    }
    await SpaceModel.updateSpace(id, req.body);
    res.json({ message: 'Space updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete space (owner)
router.delete('/:id', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const space = await SpaceModel.getSpaceById(id);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (!isOwner(space, req)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this space' });
    }
    await SpaceModel.deleteSpace(id);
    res.json({ message: 'Space deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create subspace (owner)
router.post('/:id/subspaces', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const spaceId = parseInt(req.params.id);
    const space = await SpaceModel.getSpaceById(spaceId);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (!isOwner(space, req)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this space' });
    }
    const result = await SpaceModel.createSubSpace({ spaceId, ...req.body });
    res.status(201).json({ id: result.lastID, message: 'Subspace created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update subspace (owner)
router.put('/:id/subspaces/:sid', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const spaceId = parseInt(req.params.id);
    const sid = parseInt(req.params.sid);
    const sub = await SpaceModel.getSubSpaceBySpaceId(spaceId, sid);
    if (!sub) return res.status(404).json({ error: 'Subspace not found' });
    const space = await SpaceModel.getSpaceById(spaceId);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (!isOwner(space, req)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this space' });
    }
    await SpaceModel.updateSubSpace(sid, req.body);
    res.json({ message: 'Subspace updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete subspace (owner)
router.delete('/:id/subspaces/:sid', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const spaceId = parseInt(req.params.id);
    const sid = parseInt(req.params.sid);
    const sub = await SpaceModel.getSubSpaceBySpaceId(spaceId, sid);
    if (!sub) return res.status(404).json({ error: 'Subspace not found' });
    const space = await SpaceModel.getSpaceById(spaceId);
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (!isOwner(space, req)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this space' });
    }
    await SpaceModel.deleteSubSpace(sid);
    res.json({ message: 'Subspace deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Checkout: create a booking (payment wiring is a later task)
router.post('/checkout', authenticateJWT, validateSpaceBooking, handleValidationErrors, async (req: any, res: express.Response) => {
  try {
    const { subspaceId, date, startTime, endTime, billingUnit, quantity, notes } = req.body;
    const sub = await SpaceModel.getSubSpaceById(parseInt(subspaceId, 10));
    if (!sub || sub.is_active !== true) {
      return res.status(404).json({ error: 'Subspace not found' });
    }
    const space = await SpaceModel.getSpaceById(sub.space_id);
    if (!space || space.is_published !== true) {
      return res.status(400).json({ error: 'Space is not available for booking' });
    }

    const overlap = await BookingModel.findOverlappingBooking(sub.id, date, startTime, endTime);
    if (overlap) {
      const bh = safeJson(sub.business_hours);
      const dayBookings = await BookingModel.getBookingsForSubSpace(sub.id).then(rows =>
        rows.filter((r: any) => r.date === date)
      );
      const cells = cellStates(
        { businessHours: bh, slotGranularity: sub.slot_granularity, minAdvance: sub.min_advance, maxDuration: sub.max_duration },
        date,
        dayBookings.map((b: any) => ({ startTime: b.start_time, endTime: b.end_time, status: b.status })),
        new Date()
      );
      return res.status(409).json({ error: 'slot_taken', nextAvailable: nextAvailable(cells, startTime) });
    }

    const qty = quantity || 1;
    const totalPrice = BookingModel.computeBookingPrice(sub, billingUnit, qty);
    const mode = sub.instant_book ? 'instant' : 'request';
    const paymentStatus = sub.instant_book ? 'held' : 'pending';

    const result = await BookingModel.createSpaceBooking({
      spaceId: sub.space_id,
      subspaceId: sub.id,
      userId: req.user.userId,
      guestName: req.body.guestName,
      date,
      startTime,
      endTime,
      billingUnit,
      quantity: qty,
      totalPrice,
      status: 'pending',
      mode,
      paymentStatus,
      notes,
    });
    res.status(201).json({ bookingId: result.lastID, mode, totalPrice });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Owner's bookings
router.get('/bookings/owner', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const bookings = await BookingModel.getBookingsForOwner(req.user.userId);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Guest's bookings
router.get('/bookings/guest', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const bookings = await BookingModel.getBookingsForGuest(req.user.userId);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status (owner: approve/decline; guest: cancel)
router.put('/bookings/:id/status', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, paymentStatus } = req.body;
    const booking = await BookingModel.getSpaceBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (status === 'approved' || status === 'declined') {
      const sub = await SpaceModel.getSubSpaceById(booking.subspace_id);
      const space = sub ? await SpaceModel.getSpaceById(sub.space_id) : null;
      if (!space || (space.owner_id !== req.user.userId && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Forbidden: You do not own this booking' });
      }
    } else if (status === 'cancelled') {
      const sub = await SpaceModel.getSubSpaceById(booking.subspace_id);
      const space = sub ? await SpaceModel.getSpaceById(sub.space_id) : null;
      const isOwner = space && (space.owner_id === req.user.userId || req.user.role === 'admin');
      if (!isOwner && booking.user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Forbidden: You cannot cancel this booking' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await BookingModel.updateSpaceBookingStatus(id, status, paymentStatus);
    res.json({ message: 'Booking status updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;