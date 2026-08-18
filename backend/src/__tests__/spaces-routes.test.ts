import spacesRouter from '../routes/spaces';
import * as SpaceModel from '../models/space';
import * as BookingModel from '../models/space-booking';
import * as AvailabilityModel from '../models/availability';
import { mockRequest, mockResponse } from './helpers';

jest.mock('../models/space', () => ({
  createSpace: jest.fn(),
  getPublishedSpaces: jest.fn(),
  getSpaceById: jest.fn(),
  getSpacesByOwner: jest.fn(),
  updateSpace: jest.fn(),
  deleteSpace: jest.fn(),
  setSpacePublished: jest.fn(),
  createSubSpace: jest.fn(),
  updateSubSpace: jest.fn(),
  deleteSubSpace: jest.fn(),
  getSubSpacesBySpace: jest.fn(),
  getSubSpaceById: jest.fn(),
  getSubSpaceBySpaceId: jest.fn(),
}));

jest.mock('../models/space-booking', () => ({
  createSpaceBooking: jest.fn(),
  findOverlappingBooking: jest.fn(),
  getSpaceBookingById: jest.fn(),
  getBookingsForGuest: jest.fn(),
  getBookingsForOwner: jest.fn(),
  getBookingsForSubSpace: jest.fn(),
  updateSpaceBookingStatus: jest.fn(),
  computeBookingPrice: jest.fn(),
}));

jest.mock('../models/availability', () => ({
  cellStates: jest.fn(),
  nextAvailable: jest.fn(),
}));

const spaceModel = SpaceModel as any;
const bookingModel = BookingModel as any;
const availabilityModel = AvailabilityModel as any;

function findHandler(method: string, path: string): any {
  const stack = spacesRouter.stack as any[];
  for (const layer of stack) {
    if (layer.route && layer.route.methods[method] && layer.route.path === path) {
      const handles = layer.route.stack.map((s: any) => s.handle);
      return handles[handles.length - 1];
    }
  }
  throw new Error(`handler not found: ${method} ${path}`);
}

beforeEach(() => {
  spaceModel.createSpace.mockReset();
  spaceModel.getPublishedSpaces.mockReset();
  spaceModel.getSpaceById.mockReset();
  spaceModel.getSpacesByOwner.mockReset();
  spaceModel.updateSpace.mockReset();
  spaceModel.deleteSpace.mockReset();
  spaceModel.setSpacePublished.mockReset();
  spaceModel.createSubSpace.mockReset();
  spaceModel.updateSubSpace.mockReset();
  spaceModel.deleteSubSpace.mockReset();
  spaceModel.getSubSpacesBySpace.mockReset();
  spaceModel.getSubSpaceById.mockReset();
  spaceModel.getSubSpaceBySpaceId.mockReset();
  bookingModel.createSpaceBooking.mockReset();
  bookingModel.findOverlappingBooking.mockReset();
  bookingModel.getSpaceBookingById.mockReset();
  bookingModel.getBookingsForGuest.mockReset();
  bookingModel.getBookingsForOwner.mockReset();
  bookingModel.getBookingsForSubSpace.mockReset();
  bookingModel.updateSpaceBookingStatus.mockReset();
  bookingModel.computeBookingPrice.mockReset();
  availabilityModel.cellStates.mockReset();
  availabilityModel.nextAvailable.mockReset();
});

describe('GET /api/spaces', () => {
  it('guest listing only returns published spaces, passing filters through', async () => {
    const rows = [{ id: 1, is_published: true, title: 'A' }];
    spaceModel.getPublishedSpaces.mockResolvedValue(rows);
    const req = mockRequest({ query: { type: 'desk', capacity: '2', maxHourlyPrice: '500' } });
    const res = mockResponse();

    const handler = findHandler('get', '/');
    await handler(req, res);

    expect(spaceModel.getPublishedSpaces).toHaveBeenCalledWith({
      type: 'desk',
      capacity: 2,
      maxHourlyPrice: 500,
    });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(rows);
  });
});

describe('GET /api/spaces/:id', () => {
  it('404 for unpublished space when requester is not the owner', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5, is_published: false });
    const req = mockRequest({ params: { id: '1' }, user: { userId: 9, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('get', '/:id');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Space not found' });
  });

  it('published space is visible with availability when from/to provided', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5, is_published: true });
    spaceModel.getSubSpacesBySpace.mockResolvedValue([
      { id: 2, space_id: 1, business_hours: { '0': { start: '09:00', end: '18:00' } }, slot_granularity: 30, min_advance: 120, max_duration: 8 },
    ]);
    bookingModel.getBookingsForSubSpace.mockResolvedValue([
      { id: 10, date: '2026-08-17', start_time: '10:00', end_time: '11:00', status: 'confirmed' },
      { id: 11, date: '2026-08-18', start_time: '10:00', end_time: '11:00', status: 'confirmed' },
    ]);
    availabilityModel.cellStates.mockReturnValue([{ date: '2026-08-17', start: '09:00', end: '09:30', state: 'available' }]);

    const req = mockRequest({ params: { id: '1' }, query: { from: '2026-08-17', to: '2026-08-18' }, user: null });
    const res = mockResponse();

    const handler = findHandler('get', '/:id');
    await handler(req, res);

    expect(res.status).not.toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.id).toBe(1);
    expect(body.subspaces).toHaveLength(1);
    expect(body.subspaces[0].availability).toHaveLength(2);
    expect(body.subspaces[0].availability[0].date).toBe('2026-08-17');
    expect(bookingModel.getBookingsForSubSpace).toHaveBeenCalledWith(2);
    expect(availabilityModel.cellStates).toHaveBeenCalledTimes(2);
  });

  it('owner sees own unpublished space', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5, is_published: false });
    spaceModel.getSubSpacesBySpace.mockResolvedValue([]);
    const req = mockRequest({ params: { id: '1' }, user: { userId: 5, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('get', '/:id');
    await handler(req, res);

    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('POST /api/spaces', () => {
  it('creates a space owned by the authenticated user', async () => {
    spaceModel.createSpace.mockResolvedValue({ lastID: 7 });
    const req = mockRequest({ body: { title: 'Galería' }, user: { userId: 3, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('post', '/');
    await handler(req, res);

    expect(spaceModel.createSpace).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 3, title: 'Galería' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 7, message: 'Space created' });
  });
});

describe('PUT/DELETE /api/spaces/:id', () => {
  it('PUT rejects non-owner with 403', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    const req = mockRequest({ params: { id: '1' }, body: { title: 'X' }, user: { userId: 9, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('put', '/:id');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: You do not own this space' });
    expect(spaceModel.updateSpace).not.toHaveBeenCalled();
  });

  it('PUT owner updates the space', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    const req = mockRequest({ params: { id: '1' }, body: { title: 'X' }, user: { userId: 5, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('put', '/:id');
    await handler(req, res);

    expect(spaceModel.updateSpace).toHaveBeenCalledWith(1, { title: 'X' });
    expect(res.json).toHaveBeenCalledWith({ message: 'Space updated' });
  });

  it('DELETE rejects non-owner with 403', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    const req = mockRequest({ params: { id: '1' }, user: { userId: 9, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('delete', '/:id');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(spaceModel.deleteSpace).not.toHaveBeenCalled();
  });
});

describe('POST /api/spaces/:id/subspaces', () => {
  it('creates a subspace when owner', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    spaceModel.createSubSpace.mockResolvedValue({ lastID: 11 });
    const req = mockRequest({ params: { id: '1' }, body: { title: 'Desk 1', priceHour: 300 }, user: { userId: 5, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('post', '/:id/subspaces');
    await handler(req, res);

    expect(spaceModel.createSubSpace).toHaveBeenCalledWith({ spaceId: 1, title: 'Desk 1', priceHour: 300 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 11, message: 'Subspace created' });
  });

  it('rejects non-owner with 403', async () => {
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    const req = mockRequest({ params: { id: '1' }, body: { title: 'Desk 1' }, user: { userId: 9, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('post', '/:id/subspaces');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('POST /api/spaces/checkout', () => {
  const baseBody = {
    subspaceId: 2,
    date: '2026-08-20',
    startTime: '10:00',
    endTime: '12:00',
    billingUnit: 'hour',
    quantity: 1,
  };
  const sub = {
    id: 2,
    space_id: 1,
    is_active: true,
    instant_book: false,
    business_hours: { '4': { start: '09:00', end: '18:00' } },
    slot_granularity: 30,
    min_advance: 120,
    max_duration: 8,
    price_hour: 300,
  };

  it('409 with slot_taken when a booking overlaps', async () => {
    bookingModel.findOverlappingBooking.mockResolvedValue({ id: 99, status: 'confirmed' });
    bookingModel.getBookingsForSubSpace.mockResolvedValue([sub]);
    availabilityModel.cellStates.mockReturnValue([{ date: '2026-08-20', start: '14:00', end: '14:30', state: 'available' }]);
    availabilityModel.nextAvailable.mockReturnValue('14:00');
    spaceModel.getSubSpaceById.mockResolvedValue(sub);
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, is_published: true });

    const req = mockRequest({ body: baseBody, user: { userId: 3, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('post', '/checkout');
    await handler(req, res);

    expect(bookingModel.findOverlappingBooking).toHaveBeenCalledWith(2, '2026-08-20', '10:00', '12:00');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'slot_taken', nextAvailable: '14:00' });
    expect(bookingModel.createSpaceBooking).not.toHaveBeenCalled();
  });

  it('201 creates request-mode booking when instant_book is false', async () => {
    bookingModel.findOverlappingBooking.mockResolvedValue(null);
    bookingModel.computeBookingPrice.mockReturnValue(600);
    bookingModel.createSpaceBooking.mockResolvedValue({ lastID: 42 });
    spaceModel.getSubSpaceById.mockResolvedValue(sub);
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, is_published: true });

    const req = mockRequest({ body: baseBody, user: { userId: 3, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('post', '/checkout');
    await handler(req, res);

    expect(bookingModel.computeBookingPrice).toHaveBeenCalledWith(sub, 'hour', 1);
    expect(bookingModel.createSpaceBooking).toHaveBeenCalledWith(expect.objectContaining({
      subspaceId: 2,
      userId: 3,
      status: 'pending',
      mode: 'request',
      paymentStatus: 'pending',
      totalPrice: 600,
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ bookingId: 42, mode: 'request', totalPrice: 600 });
  });

  it('201 creates instant-mode booking (held payment) when instant_book is true', async () => {
    bookingModel.findOverlappingBooking.mockResolvedValue(null);
    bookingModel.computeBookingPrice.mockReturnValue(600);
    bookingModel.createSpaceBooking.mockResolvedValue({ lastID: 43 });
    spaceModel.getSubSpaceById.mockResolvedValue({ ...sub, instant_book: true });
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, is_published: true });

    const req = mockRequest({ body: baseBody, user: { userId: 3, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('post', '/checkout');
    await handler(req, res);

    expect(bookingModel.createSpaceBooking).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'instant',
      paymentStatus: 'held',
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ bookingId: 43, mode: 'instant', totalPrice: 600 });
  });
});

describe('GET /api/spaces/bookings', () => {
  it('GET /bookings/owner returns owner bookings', async () => {
    bookingModel.getBookingsForOwner.mockResolvedValue([{ id: 1 }]);
    const req = mockRequest({ user: { userId: 5, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('get', '/bookings/owner');
    await handler(req, res);

    expect(bookingModel.getBookingsForOwner).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('GET /bookings/guest returns guest bookings', async () => {
    bookingModel.getBookingsForGuest.mockResolvedValue([{ id: 2 }]);
    const req = mockRequest({ user: { userId: 3, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('get', '/bookings/guest');
    await handler(req, res);

    expect(bookingModel.getBookingsForGuest).toHaveBeenCalledWith(3);
    expect(res.json).toHaveBeenCalledWith([{ id: 2 }]);
  });
});

describe('PUT /api/spaces/bookings/:id/status', () => {
  it('owner can approve a booking on their space', async () => {
    bookingModel.getSpaceBookingById.mockResolvedValue({ id: 5, subspace_id: 2, user_id: 3 });
    spaceModel.getSubSpaceById.mockResolvedValue({ id: 2, space_id: 1 });
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });

    const req = mockRequest({ params: { id: '5' }, body: { status: 'approved' }, user: { userId: 5, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('put', '/bookings/:id/status');
    await handler(req, res);

    expect(bookingModel.updateSpaceBookingStatus).toHaveBeenCalledWith(5, 'approved', undefined);
    expect(res.json).toHaveBeenCalledWith({ message: 'Booking status updated' });
  });

  it('guest can cancel their own booking', async () => {
    bookingModel.getSpaceBookingById.mockResolvedValue({ id: 5, subspace_id: 2, user_id: 3 });
    spaceModel.getSubSpaceById.mockResolvedValue({ id: 2, space_id: 1 });
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });

    const req = mockRequest({ params: { id: '5' }, body: { status: 'cancelled' }, user: { userId: 3, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('put', '/bookings/:id/status');
    await handler(req, res);

    expect(bookingModel.updateSpaceBookingStatus).toHaveBeenCalledWith(5, 'cancelled', undefined);
  });

  it('guest cannot approve a booking', async () => {
    bookingModel.getSpaceBookingById.mockResolvedValue({ id: 5, subspace_id: 2, user_id: 3 });
    spaceModel.getSubSpaceById.mockResolvedValue({ id: 2, space_id: 1 });
    spaceModel.getSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });

    const req = mockRequest({ params: { id: '5' }, body: { status: 'approved' }, user: { userId: 3, role: 'user' } });
    const res = mockResponse();

    const handler = findHandler('put', '/bookings/:id/status');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(bookingModel.updateSpaceBookingStatus).not.toHaveBeenCalled();
  });
});