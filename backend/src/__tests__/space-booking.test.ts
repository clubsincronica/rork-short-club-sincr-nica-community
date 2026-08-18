import { query } from '../db/postgres-client';
jest.mock('../db/postgres-client', () => ({
  query: jest.fn(),
}));
const mockedQuery = query as any;

import {
  createSpaceBooking, findOverlappingBooking, getSpaceBookingById,
  getBookingsForGuest, getBookingsForOwner, getBookingsForSubSpace,
  updateSpaceBookingStatus, computeBookingPrice,
} from '../models/space-booking';

describe('space booking model', () => {
  beforeEach(() => mockedQuery.mockReset());

  it('createSpaceBooking inserts and returns lastID', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 7 }]);
    const res = await createSpaceBooking({
      spaceId: 1, subspaceId: 2, userId: 3, guestName: 'Ana', date: '2026-08-20',
      startTime: '10:00', endTime: '12:00', billingUnit: 'hour', quantity: 2, totalPrice: 600,
    });
    expect(res.lastID).toBe(7);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO space_bookings'),
      expect.arrayContaining([1, 2, 3, 'Ana', '2026-08-20', '10:00', '12:00', 'hour', 2, 600])
    );
  });

  it('findOverlappingBooking filters date/subspace/non-cancelled and returns first overlap', async () => {
    const overlapRow = {
      id: 5, subspace_id: 2, date: '2026-08-20', start_time: '10:00', end_time: '12:00',
      status: 'confirmed',
    };
    mockedQuery.mockResolvedValueOnce([overlapRow]);
    const found = await findOverlappingBooking(2, '2026-08-20', '11:00', '13:00');
    expect(found).toEqual(overlapRow);
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('date = $1');
    expect(sql).toContain('subspace_id = $2');
    expect(sql).toContain("status <> 'cancelled'");
    expect(params).toEqual(['2026-08-20', 2]);
  });

  it('findOverlappingBooking maps non-overlapping first row to null', async () => {
    mockedQuery.mockResolvedValueOnce([{
      id: 5, subspace_id: 2, date: '2026-08-20', start_time: '08:00', end_time: '09:00',
      status: 'confirmed',
    }]);
    const found = await findOverlappingBooking(2, '2026-08-20', '10:00', '12:00');
    expect(found).toBeNull();
  });

  it('findOverlappingBooking excludes id when provided', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    const found = await findOverlappingBooking(2, '2026-08-20', '10:00', '12:00', 5);
    expect(found).toBeNull();
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('id <> $3');
    expect(params).toEqual(['2026-08-20', 2, 5]);
  });

  it('getSpaceBookingById returns row or null', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 1, subspace_id: 2, date: '2026-08-20' }]);
    expect(await getSpaceBookingById(1)).toEqual({ id: 1, subspace_id: 2, date: '2026-08-20' });
    mockedQuery.mockResolvedValueOnce([]);
    expect(await getSpaceBookingById(99)).toBeNull();
  });

  it('getBookingsForGuest scopes by user_id', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 1, user_id: 3 }]);
    const rows = await getBookingsForGuest(3);
    expect(rows).toHaveLength(1);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE user_id = $1'),
      [3]
    );
  });

  it('getBookingsForOwner joins subspaces and spaces by owner', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 1, subspace_id: 2 }]);
    const rows = await getBookingsForOwner(4);
    expect(rows).toHaveLength(1);
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toContain('JOIN subspaces');
    expect(sql).toContain('JOIN spaces');
    expect(sql).toContain('s.owner_id = $1');
    expect(params).toEqual([4]);
  });

  it('getBookingsForSubSpace scopes by subspace_id', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 1, subspace_id: 2 }]);
    const rows = await getBookingsForSubSpace(2);
    expect(rows).toHaveLength(1);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE subspace_id = $1'),
      [2]
    );
  });

  it('updateSpaceBookingStatus updates status and optionally payment_status', async () => {
    mockedQuery.mockResolvedValueOnce([]);
    await updateSpaceBookingStatus(5, 'confirmed');
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE space_bookings SET status = $1'),
      ['confirmed', 5]
    );
    mockedQuery.mockResolvedValueOnce([]);
    await updateSpaceBookingStatus(5, 'confirmed', 'paid');
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('payment_status = $2'),
      ['confirmed', 'paid', 5]
    );
  });

  it('computeBookingPrice picks price per billing unit and multiplies by quantity', () => {
    expect(computeBookingPrice({ price_hour: 100 }, 'hour', 2)).toBe(200);
    expect(computeBookingPrice({ price_day: 250.5 }, 'day', 1)).toBe(250.5);
    expect(computeBookingPrice({ price_week: 500 }, 'week', 3)).toBe(1500);
    expect(computeBookingPrice({ price_month: 1200 }, 'month', 1)).toBe(1200);
    expect(computeBookingPrice({}, 'hour', 1)).toBe(0);
    expect(computeBookingPrice({ price_hour: 333.335 }, 'hour', 1)).toBe(333.34);
  });
});