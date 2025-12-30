import { query } from '../db/postgres-client';

export interface Reservation {
    id?: number;
    eventId?: number | null;
    serviceId?: string | null;
    productId?: number | null;
    userId: number;
    providerId: number;
    status: string;
    numberOfSpots: number;
    totalPrice: number;
    paymentStatus: string;
    paymentMethod?: string;
    notes?: string;
    attended?: boolean;
    created_at?: string;
    updated_at?: string;
}

export async function createReservation(reservation: Reservation) {
    const res = await query(
        `INSERT INTO reservations (
      event_id, service_id, product_id, user_id, provider_id, status, 
      number_of_spots, total_price, payment_status, payment_method, notes, attended,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING id`,
        [
            reservation.eventId || null,
            reservation.serviceId || null,
            reservation.productId || null,
            reservation.userId,
            reservation.providerId,
            reservation.status || 'pending',
            reservation.numberOfSpots || 1,
            reservation.totalPrice,
            reservation.paymentStatus || 'pending',
            reservation.paymentMethod || null,
            reservation.notes || null,
            reservation.attended || false
        ]
    );
    return { lastID: res[0]?.id ?? null };
}

export async function updateAttendance(id: number, attended: boolean) {
    await query(
        `UPDATE reservations SET attended = $1, updated_at = NOW() WHERE id = $2`,
        [attended, id]
    );
}

export async function updateReservationStatus(id: number, status: string, paymentStatus?: string) {
    if (paymentStatus) {
        await query(
            `UPDATE reservations SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3`,
            [status, paymentStatus, id]
        );
    } else {
        await query(
            `UPDATE reservations SET status = $1, updated_at = NOW() WHERE id = $2`,
            [status, id]
        );
    }
}

export async function getReservationsByUserId(userId: number) {
    const rows = await query(
        `SELECT r.*, e.title as event_title, u.name as provider_name 
     FROM reservations r
     LEFT JOIN events e ON r.event_id = e.id
     LEFT JOIN users u ON r.provider_id = u.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
        [userId]
    );
    return rows || [];
}

export async function getReservationsByProviderId(providerId: number) {
    const rows = await query(
        `SELECT r.*, e.title as event_title, u.name as user_name 
     FROM reservations r
     LEFT JOIN events e ON r.event_id = e.id
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.provider_id = $1
     ORDER BY r.created_at DESC`,
        [providerId]
    );
    return rows || [];
}

export async function getReservationById(id: number) {
    const rows = await query(
        `SELECT * FROM reservations WHERE id = $1 LIMIT 1`,
        [id]
    );
    return rows[0] || null;
}
