import { query } from '../db/postgres-client';
jest.mock('../db/postgres-client', () => ({
  query: jest.fn(),
}));
const mockedQuery = query as any;

import {
  createSpaceBooking, findOverlappingBooking, getBookingsForGuest,
  getBookingsForOwner, updateSpaceBookingStatus, expireStaleRequests,
} from '../models/space-booking';

describe('space double-booking', () => {
  beforeEach(() => mockedQuery.mockReset());

  it('findOverlappingBooking detects double-booking in same subspace', async () => {
    const existing = {
      id: 1, subspace_id: 2, date: '2026-08-20', start_time: '10:00', end_time: '12:00',
      status: 'confirmed',
    };
    mockedQuery.mockResolvedValueOnce([existing]);
    const found = await findOverlappingBooking(2, '2026-08-20', '11:00', '13:00');
    expect(found).toEqual(existing);
  });

  it('findOverlappingBooking returns null for different slot (no overlap)', async () => {
    mockedQuery.mockResolvedValueOnce([{
      id: 1, subspace_id: 2, date: '2026-08-20', start_time: '08:00', end_time: '09:00',
      status: 'confirmed',
    }]);
    const found = await findOverlappingBooking(2, '2026-08-20', '10:00', '12:00');
    expect(found).toBeNull();
  });

  it('findOverlappingBooking excludes self when id provided', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    const found = await findOverlappingBooking(2, '2026-08-20', '10:00', '12:00', 1);
    expect(found).toBeNull();
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('id <> $3');
    expect(params).toEqual(['2026-08-20', 2, 1]);
  });

  it('createSpaceBooking with request mode sets pending status', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 3 }]);
    const res = await createSpaceBooking({
      spaceId: 1, subspaceId: 2, userId: 3, guestName: 'Pedro', date: '2026-08-20',
      startTime: '14:00', endTime: '16:00', billingUnit: 'hour', quantity: 1, totalPrice: 400,
      status: 'pending', mode: 'request',
    });
    expect(res.lastID).toBe(3);
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(params).toContain('pending');
    expect(params).toContain('request');
  });

  it('expireStaleRequests cancels pending request bookings > 48h old', async () => {
    mockedQuery.mockResolvedValueOnce([{ count: 1 }]);
    await expireStaleRequests();
    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).toContain("status = 'cancelled'");
    expect(sql).toContain("mode = 'request'");
    expect(sql).toContain("INTERVAL '48 hours'");
  });

  it('updateSpaceBookingStatus toggles payment_status', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await updateSpaceBookingStatus(5, 'confirmed', 'paid');
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('payment_status = $2');
    expect(params).toEqual(['confirmed', 'paid', 5]);
  });

  it('updateSpaceBookingStatus without payment_status omits payment field', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await updateSpaceBookingStatus(5, 'cancelled');
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).not.toContain('payment_status');
    expect(params).toEqual(['cancelled', 5]);
  });
});