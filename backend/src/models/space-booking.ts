import { query } from '../db/postgres-client';
import { timesOverlap } from './availability';

export interface SpaceBookingRow {
  id: number;
  space_id: number;
  subspace_id: number;
  user_id: number;
  guest_name?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  billing_unit: string;
  quantity: number;
  total_price: number;
  status: string;
  mode: string;
  payment_status: string;
  payment_provider?: string | null;
  payment_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSpaceBookingInput {
  spaceId: number;
  subspaceId: number;
  userId: number;
  guestName?: string;
  date: string;
  startTime: string;
  endTime: string;
  billingUnit: string;
  quantity: number;
  totalPrice: number;
  status?: string;
  mode?: string;
  paymentStatus?: string;
  notes?: string;
}

export async function createSpaceBooking(input: CreateSpaceBookingInput): Promise<{ lastID: number }> {
  const res = await query(
    `INSERT INTO space_bookings (
      space_id, subspace_id, user_id, guest_name, date, start_time, end_time,
      billing_unit, quantity, total_price, status, mode, payment_status, notes,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) RETURNING id`,
    [
      input.spaceId,
      input.subspaceId,
      input.userId,
      input.guestName ?? null,
      input.date,
      input.startTime,
      input.endTime,
      input.billingUnit,
      input.quantity,
      input.totalPrice,
      input.status || 'pending',
      input.mode || 'instant',
      input.paymentStatus || 'pending',
      input.notes ?? null,
    ]
  );
  return { lastID: (res[0]?.id ?? null) as number };
}

export async function findOverlappingBooking(
  subspaceId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: number
): Promise<SpaceBookingRow | null> {
  const params: unknown[] = [date, subspaceId];
  let sql = `SELECT * FROM space_bookings WHERE date = $1 AND subspace_id = $2 AND status <> 'cancelled'`;
  if (excludeId != null) {
    params.push(excludeId);
    sql += ` AND id <> $3`;
  }
  const rows = await query(sql, params);
  const overlap = (rows || []).find((r: SpaceBookingRow) =>
    timesOverlap(startTime, endTime, r.start_time, r.end_time)
  );
  return (overlap as SpaceBookingRow) || null;
}

export async function getSpaceBookingById(id: number): Promise<SpaceBookingRow | null> {
  const rows = await query(
    `SELECT * FROM space_bookings WHERE id = $1 LIMIT 1`,
    [id]
  );
  return (rows[0] as SpaceBookingRow) || null;
}

export async function getBookingsForGuest(userId: number): Promise<SpaceBookingRow[]> {
  const rows = await query(
    `SELECT * FROM space_bookings WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return (rows as SpaceBookingRow[]) || [];
}

export async function getBookingsForOwner(ownerId: number): Promise<SpaceBookingRow[]> {
  const rows = await query(
    `SELECT b.* FROM space_bookings b
     JOIN subspaces su ON b.subspace_id = su.id
     JOIN spaces s ON su.space_id = s.id
     WHERE s.owner_id = $1
     ORDER BY b.created_at DESC`,
    [ownerId]
  );
  return (rows as SpaceBookingRow[]) || [];
}

export async function getBookingsForSubSpace(subspaceId: number): Promise<SpaceBookingRow[]> {
  const rows = await query(
    `SELECT * FROM space_bookings WHERE subspace_id = $1 ORDER BY created_at DESC`,
    [subspaceId]
  );
  return (rows as SpaceBookingRow[]) || [];
}

export async function updateSpaceBookingStatus(id: number, status: string, paymentStatus?: string): Promise<void> {
  if (paymentStatus) {
    await query(
      `UPDATE space_bookings SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3`,
      [status, paymentStatus, id]
    );
  } else {
    await query(
      `UPDATE space_bookings SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
  }
}

export function computeBookingPrice(sub: any, billingUnit: string, quantity: number): number {
  const key = { hour: 'price_hour', day: 'price_day', week: 'price_week', month: 'price_month' }[billingUnit];
  const price = key ? Number(sub?.[key] || 0) : 0;
  return Math.round((price * (quantity || 1)) * 100) / 100;
}