import { mockRequest, mockResponse } from './helpers';
import { query as dbQuery } from '../db/postgres-client';

export const mockStripeCreate = jest.fn();
export const mockMpPreferenceCreate = jest.fn();
export const mockGetSpaceById = jest.fn();
export const mockGetSubSpaceById = jest.fn();
export const mockGetSpaceBookingById = jest.fn();
export const mockGetBookingsForGuest = jest.fn();
export const mockGetBookingsForOwner = jest.fn();
export const mockUpdateSpaceBookingStatus = jest.fn();
export const mockExpireStaleRequests = jest.fn();
export const mockUpdateReservationStatus = jest.fn();

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn(() => ({ paymentIntents: { create: mockStripeCreate } })),
}));

jest.mock('mercadopago', () => ({
  __esModule: true,
  MercadoPagoConfig: jest.fn(() => ({})),
  Preference: jest.fn(() => ({ create: mockMpPreferenceCreate })),
}));

jest.mock('../models/space', () => ({
  getSpaceById: mockGetSpaceById,
  getSubSpaceById: mockGetSubSpaceById,
}));

jest.mock('../models/space-booking', () => ({
  createSpaceBooking: jest.fn(),
  findOverlappingBooking: jest.fn(),
  getSpaceBookingById: mockGetSpaceBookingById,
  getBookingsForGuest: mockGetBookingsForGuest,
  getBookingsForOwner: mockGetBookingsForOwner,
  getBookingsForSubSpace: jest.fn(),
  updateSpaceBookingStatus: mockUpdateSpaceBookingStatus,
  computeBookingPrice: jest.fn(),
  expireStaleRequests: mockExpireStaleRequests,
}));

jest.mock('../models/transaction', () => ({
  createTransaction: jest.fn(),
  getCommissionRate: jest.fn(),
  updateTransactionStatus: jest.fn(),
  findTransactionByPaymentId: jest.fn(),
}));

jest.mock('../models/reservation', () => ({
  updateReservationStatus: mockUpdateReservationStatus,
  getReservationById: jest.fn(),
}));

jest.mock('../db/postgres-client', () => ({
  query: jest.fn(),
}));

import spacesRouter from '../routes/spaces';
import * as transactionApi from '../models/transaction';

const txApi = transactionApi as any;
const mockedDbQuery = dbQuery as any;

const realTx = jest.requireActual('../models/transaction');
const realBookingModel = jest.requireActual('../models/space-booking');

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
  mockStripeCreate.mockReset();
  mockMpPreferenceCreate.mockReset();
  mockGetSpaceById.mockReset();
  mockGetSubSpaceById.mockReset();
  mockGetSpaceBookingById.mockReset();
  mockGetBookingsForGuest.mockReset();
  mockGetBookingsForOwner.mockReset();
  mockUpdateSpaceBookingStatus.mockReset();
  mockExpireStaleRequests.mockReset();
  mockUpdateReservationStatus.mockReset();
  mockedDbQuery.mockReset();
  txApi.createTransaction.mockReset();
  txApi.getCommissionRate.mockReset();
  txApi.createTransaction.mockResolvedValue(undefined);
  mockStripeCreate.mockResolvedValue({ id: 'pi_dummy', client_secret: 'cs_dummy' });
});

describe('transaction.ts resource-aware confirmation', () => {
  it('calls updateSpaceBookingStatus when metadata.resource is space and skips reservation', async () => {
    mockedDbQuery.mockResolvedValueOnce([]);
    mockedDbQuery.mockResolvedValueOnce([{ booking_id: 42, metadata: '{"resource":"space"}' }]);

    await realTx.updateTransactionStatus('stripe', 'pi_1', 'succeeded');

    expect(mockUpdateSpaceBookingStatus).toHaveBeenCalledWith(42, 'confirmed', 'paid');
    expect(mockUpdateReservationStatus).not.toHaveBeenCalled();
  });

  it('keeps updateReservationStatus path for non-space metadata', async () => {
    mockedDbQuery.mockResolvedValueOnce([]);
    mockedDbQuery.mockResolvedValueOnce([{ booking_id: 42, metadata: null }]);

    await realTx.updateTransactionStatus('stripe', 'pi_1', 'succeeded');

    expect(mockUpdateReservationStatus).toHaveBeenCalledWith(42, 'confirmed', 'completed');
    expect(mockUpdateSpaceBookingStatus).not.toHaveBeenCalled();
  });

  it('defaults to reservation path when metadata JSON is malformed', async () => {
    mockedDbQuery.mockResolvedValueOnce([]);
    mockedDbQuery.mockResolvedValueOnce([{ booking_id: 42, metadata: '{not json' }]);

    await realTx.updateTransactionStatus('mercadopago', 'mp_1', 'approved');

    expect(mockUpdateReservationStatus).toHaveBeenCalled();
    expect(mockUpdateSpaceBookingStatus).not.toHaveBeenCalled();
  });

  it('does not touch any booking for pending status', async () => {
    mockedDbQuery.mockResolvedValueOnce([]);

    await realTx.updateTransactionStatus('stripe', 'pi_1', 'pending');

    expect(mockUpdateReservationStatus).not.toHaveBeenCalled();
    expect(mockUpdateSpaceBookingStatus).not.toHaveBeenCalled();
  });
});

describe('expireStaleRequests model SQL', () => {
  it('flips stale request-mode bookings with the right SQL shape', async () => {
    mockedDbQuery.mockResolvedValueOnce([]);

    await realBookingModel.expireStaleRequests();

    const [sql, params] = mockedDbQuery.mock.calls[0];
    expect(sql).toContain('UPDATE space_bookings SET status');
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain("mode = 'request'");
    expect(sql).toContain("created_at < NOW() - INTERVAL '48 hours'");
    expect(params).toBeUndefined();
  });
});

describe('POST /api/spaces/pay/stripe/:bookingId', () => {
  const booking = { id: 7, user_id: 3, space_id: 1, total_price: 10000 };

  it('creates PaymentIntent from DB price and stores a space transaction', async () => {
    mockGetSpaceBookingById.mockResolvedValue(booking);
    mockGetSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    txApi.getCommissionRate.mockResolvedValue(0.05);
    mockStripeCreate.mockResolvedValue({ id: 'pi_123', client_secret: 'cs_123' });

    const req = mockRequest({
      params: { bookingId: '7' },
      body: { currency: 'usd', amount: 1 },
      user: { userId: 3, role: 'user' },
    });
    const res = mockResponse();
    const handler = findHandler('post', '/pay/stripe/:bookingId');
    await handler(req, res);

    expect(mockStripeCreate).toHaveBeenCalledWith({
      amount: 1000000,
      currency: 'usd',
      metadata: expect.objectContaining({ resource: 'space', bookingId: '7' }),
    });
    expect(txApi.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
      paymentProvider: 'stripe',
      paymentId: 'pi_123',
      status: 'pending',
      amount: 10000,
      currency: 'usd',
      buyerId: 3,
      providerId: 5,
      bookingId: 7,
      metadata: { resource: 'space' },
      appFeeAmount: 500,
      providerAmount: 9500,
    }));
    expect(res.json).toHaveBeenCalledWith({ clientSecret: 'cs_123' });
  });

  it('403 when booking.user_id does not match the authenticated user', async () => {
    mockGetSpaceBookingById.mockResolvedValue({ ...booking, user_id: 9 });

    const req = mockRequest({ params: { bookingId: '7' }, body: { currency: 'usd' }, user: { userId: 3 } });
    const res = mockResponse();
    const handler = findHandler('post', '/pay/stripe/:bookingId');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(txApi.createTransaction).not.toHaveBeenCalled();
  });

  it('404 when booking does not exist', async () => {
    mockGetSpaceBookingById.mockResolvedValue(null);

    const req = mockRequest({ params: { bookingId: '999' }, body: { currency: 'usd' }, user: { userId: 3 } });
    const res = mockResponse();
    const handler = findHandler('post', '/pay/stripe/:bookingId');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(txApi.createTransaction).not.toHaveBeenCalled();
  });
});

describe('POST /api/spaces/pay/mercadopago/:bookingId', () => {
  it('builds a preference with marketplace_fee and stores a space transaction', async () => {
    mockGetSpaceBookingById.mockResolvedValue({ id: 8, user_id: 3, space_id: 1, total_price: 2000 });
    mockGetSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    mockedDbQuery.mockResolvedValue([{ mp_access_token: 'APP_USR_token', mp_token_expires_at: null }]);
    txApi.getCommissionRate.mockResolvedValue(0.05);
    mockMpPreferenceCreate.mockResolvedValue({
      id: 'pref_abc',
      init_point: 'https://init.example/test',
      sandbox_init_point: 'https://sandbox.example/test',
    });

    const req = mockRequest({ params: { bookingId: '8' }, body: { currency: 'ARS' }, user: { userId: 3 } });
    const res = mockResponse();
    const handler = findHandler('post', '/pay/mercadopago/:bookingId');
    await handler(req, res);

    expect(mockMpPreferenceCreate).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        external_reference: '8',
        marketplace_fee: 100,
      }),
    }));
    expect(txApi.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
      paymentProvider: 'mercadopago',
      paymentId: 'pref_abc',
      amount: 2000,
      buyerId: 3,
      providerId: 5,
      bookingId: 8,
      metadata: { resource: 'space' },
      appFeeAmount: 100,
      providerAmount: 1900,
    }));
    expect(res.json).toHaveBeenCalledWith({
      init_point: 'https://init.example/test',
      sandbox_init_point: 'https://sandbox.example/test',
    });
  });

  it('402 when vendor has no MercadoPago token', async () => {
    mockGetSpaceBookingById.mockResolvedValue({ id: 8, user_id: 3, space_id: 1, total_price: 2000 });
    mockGetSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
    mockedDbQuery.mockResolvedValue([{}]);

    const req = mockRequest({ params: { bookingId: '8' }, user: { userId: 3 } });
    const res = mockResponse();
    const handler = findHandler('post', '/pay/mercadopago/:bookingId');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(txApi.createTransaction).not.toHaveBeenCalled();
  });
});

describe('Owner accept/decline endpoints', () => {
  const booking = { id: 10, user_id: 3, subspace_id: 2 };

  beforeEach(() => {
    mockGetSpaceBookingById.mockResolvedValue(booking);
    mockGetSubSpaceById.mockResolvedValue({ id: 2, space_id: 1 });
    mockGetSpaceById.mockResolvedValue({ id: 1, owner_id: 5 });
  });

  it('accepted flips booking to confirmed+paid for the owner', async () => {
    const req = mockRequest({ params: { id: '10' }, user: { userId: 5, role: 'user' } });
    const res = mockResponse();
    const handler = findHandler('post', '/bookings/:id/accepted');
    await handler(req, res);

    expect(mockUpdateSpaceBookingStatus).toHaveBeenCalledWith(10, 'confirmed', 'paid');
    expect(res.json).toHaveBeenCalledWith({ message: 'Booking accepted' });
  });

  it('accepted rejects a non-owner with 403', async () => {
    const req = mockRequest({ params: { id: '10' }, user: { userId: 99, role: 'user' } });
    const res = mockResponse();
    const handler = findHandler('post', '/bookings/:id/accepted');
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockUpdateSpaceBookingStatus).not.toHaveBeenCalled();
  });

  it('declined flips booking to cancelled+refunded for the owner', async () => {
    const req = mockRequest({ params: { id: '10' }, user: { userId: 5, role: 'user' } });
    const res = mockResponse();
    const handler = findHandler('post', '/bookings/:id/declined');
    await handler(req, res);

    expect(mockUpdateSpaceBookingStatus).toHaveBeenCalledWith(10, 'cancelled', 'refunded');
    expect(res.json).toHaveBeenCalledWith({ message: 'Booking declined' });
  });
});

describe('Auto-expiry sweep on booking lists', () => {
  it('GET /bookings/owner expires stale requests before listing', async () => {
    mockGetBookingsForOwner.mockResolvedValue([{ id: 1 }]);
    const req = mockRequest({ user: { userId: 5, role: 'user' } });
    const res = mockResponse();
    const handler = findHandler('get', '/bookings/owner');
    await handler(req, res);

    expect(mockExpireStaleRequests).toHaveBeenCalled();
    expect(mockGetBookingsForOwner).toHaveBeenCalledWith(5);
  });

  it('GET /bookings/guest expires stale requests before listing', async () => {
    mockGetBookingsForGuest.mockResolvedValue([{ id: 2 }]);
    const req = mockRequest({ user: { userId: 3, role: 'user' } });
    const res = mockResponse();
    const handler = findHandler('get', '/bookings/guest');
    await handler(req, res);

    expect(mockExpireStaleRequests).toHaveBeenCalled();
    expect(mockGetBookingsForGuest).toHaveBeenCalledWith(3);
  });
});