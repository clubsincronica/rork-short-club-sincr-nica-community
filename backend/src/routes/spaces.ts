import express, { Router } from 'express';
import Stripe from 'stripe';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import * as SpaceModel from '../models/space';
import * as BookingModel from '../models/space-booking';
import { cellStates, nextAvailable } from '../models/availability';
import { authenticateJWT } from '../middleware/security';
import { validateSpaceBooking, handleValidationErrors } from '../middleware/validation';
import { createTransaction, getCommissionRate } from '../models/transaction';
import { query } from '../db/postgres-client';

const router = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

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
    const { spaceId: _ignoredSpaceId, space_id: _ignoredSpaceIdSnake, ...subspaceBody } = req.body;
    const result = await SpaceModel.createSubSpace({ spaceId, ...subspaceBody });
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

// Pay for a space booking via Stripe PaymentIntent (price always from DB)
router.post('/pay/stripe/:bookingId', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured on this server' });
    }

    const bookingId = parseInt(req.params.bookingId);
    const booking = await BookingModel.getSpaceBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to pay for this booking' });
    }

    const space = await SpaceModel.getSpaceById(booking.space_id);
    const providerId = space ? space.owner_id : null;

    // Price comes from the DB booking, never from the client
    const amountCents = Math.round(Number(booking.total_price) * 100);
    const amountDecimal = amountCents / 100;
    const commissionRate = await getCommissionRate();
    const appFeeAmount = Math.round(amountDecimal * commissionRate * 100) / 100;
    const providerAmount = Math.round((amountDecimal - appFeeAmount) * 100) / 100;
    const currency = req.body.currency || 'usd';

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: { buyerId: req.user.userId, providerId, bookingId: bookingId.toString(), resource: 'space' }
    });

    await createTransaction({
      paymentProvider: 'stripe',
      paymentId: paymentIntent.id,
      status: 'pending',
      amount: amountDecimal,
      currency,
      buyerId: req.user.userId,
      providerId,
      bookingId,
      metadata: { resource: 'space' },
      appFeeAmount,
      providerAmount
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment processing error. Please try again.' });
  }
});

// Pay for a space booking via MercadoPago preference (vendor token flow)
router.post('/pay/mercadopago/:bookingId', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const booking = await BookingModel.getSpaceBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'You are not authorized to pay for this booking' });
    }

    const space = await SpaceModel.getSpaceById(booking.space_id);
    const providerId = space ? space.owner_id : null;

    // Look up the vendor's MP access token (marketplace OAuth)
    const vendorRows: any = await query(
      `SELECT mp_access_token, mp_token_expires_at FROM users WHERE id = $1`,
      [providerId]
    );
    const vendor = vendorRows[0];
    if (!vendor || !vendor.mp_access_token) {
      return res.status(402).json({
        error: 'vendor_not_connected',
        message: 'El vendedor aún no ha vinculado su cuenta de MercadoPago. Por favor contacta al proveedor.',
      });
    }
    if (vendor.mp_token_expires_at && new Date(vendor.mp_token_expires_at) < new Date()) {
      return res.status(402).json({
        error: 'vendor_token_expired',
        message: 'El token de MercadoPago del vendedor ha expirado. Por favor pídele que reconecte su cuenta.',
      });
    }

    // Price always from the DB booking
    const totalAmount = Number(booking.total_price);
    const commissionRate = await getCommissionRate();
    const appFeeAmount = Math.round(totalAmount * commissionRate * 100) / 100;
    const providerAmount = Math.round((totalAmount - appFeeAmount) * 100) / 100;
    const currency = (req.body.currency) || 'ARS';
    const securedItems = [{
      id: bookingId.toString(),
      title: `Reserva #${bookingId}`,
      quantity: 1,
      currency_id: currency,
      unit_price: totalAmount,
    }];

    const vendorMpClient = new MercadoPagoConfig({ accessToken: vendor.mp_access_token });
    const vendorMpPreference = new Preference(vendorMpClient);

    const result = await vendorMpPreference.create({
      body: {
        items: securedItems,
        payer: req.body.payer,
        marketplace_fee: appFeeAmount,
        back_urls: req.body.back_urls || {},
        auto_return: 'approved' as const,
        external_reference: bookingId.toString()
      }
    });

    await createTransaction({
      paymentProvider: 'mercadopago',
      paymentId: result.id!.toString(),
      status: 'pending',
      amount: totalAmount,
      currency,
      buyerId: req.user.userId,
      providerId,
      bookingId,
      metadata: { resource: 'space' },
      appFeeAmount,
      providerAmount
    });

    res.json({ init_point: result.init_point, sandbox_init_point: result.sandbox_init_point });
  } catch (error: any) {
    console.error('MercadoPago error:', error);
    res.status(500).json({ error: 'Payment processing error. Please try again.' });
  }
});

// Owner's bookings
router.get('/bookings/owner', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    await BookingModel.expireStaleRequests();
    const bookings = await BookingModel.getBookingsForOwner(req.user.userId);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Guest's bookings
router.get('/bookings/guest', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    await BookingModel.expireStaleRequests();
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

// Owner accepts a booking request (capture semantics → confirmed + paid)
router.post('/bookings/:id/accepted', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await BookingModel.getSpaceBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const sub = await SpaceModel.getSubSpaceById(booking.subspace_id);
    const space = sub ? await SpaceModel.getSpaceById(sub.space_id) : null;
    if (!space || (space.owner_id !== req.user.userId && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: You do not own this booking' });
    }

    await BookingModel.updateSpaceBookingStatus(id, 'confirmed', 'paid');
    res.json({ message: 'Booking accepted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Owner declines a booking request (release hold → cancelled + refunded)
router.post('/bookings/:id/declined', authenticateJWT, async (req: any, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await BookingModel.getSpaceBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const sub = await SpaceModel.getSubSpaceById(booking.subspace_id);
    const space = sub ? await SpaceModel.getSpaceById(sub.space_id) : null;
    if (!space || (space.owner_id !== req.user.userId && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: You do not own this booking' });
    }

    await BookingModel.updateSpaceBookingStatus(id, 'cancelled', 'refunded');
    res.json({ message: 'Booking declined' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;