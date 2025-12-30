import { query } from '../db/postgres-client';

// Create a new transaction with commission splitting
export async function createTransaction({
  paymentProvider,
  paymentId,
  status = 'pending',
  amount,
  currency,
  buyerId = null,
  providerId = null,
  bookingId = null,
  metadata = null,
  commissionRate = 0.05 // Default 5% commission
}: {
  paymentProvider: string;
  paymentId: string;
  status?: string;
  amount: number;
  currency: string;
  buyerId?: string | number | null;
  providerId?: string | number | null;
  bookingId?: string | number | null;
  metadata?: any;
  commissionRate?: number;
}) {
  const appFeeAmount = amount * commissionRate;
  const providerAmount = amount - appFeeAmount;

  await query(
    `INSERT INTO transactions (
      payment_provider, payment_id, status, total_amount, app_fee_amount, 
      provider_amount, buyer_id, provider_id, booking_id, currency, metadata, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
    [
      paymentProvider,
      paymentId,
      status,
      amount,
      appFeeAmount,
      providerAmount,
      buyerId,
      providerId,
      bookingId,
      currency,
      metadata ? JSON.stringify(metadata) : null
    ]
  );
}

export async function updateTransactionStatus(paymentProvider: string, paymentId: string, status: string) {
  // Update transaction status by payment provider and payment id
  await query(
    `UPDATE transactions SET status = $1, updated_at = NOW() WHERE payment_provider = $2 AND payment_id = $3`,
    [status, paymentProvider, paymentId]
  );

  // If status is 'succeeded', we might want to update the associated reservation
  if (status === 'succeeded' || status === 'approved') {
    const transaction = await findTransactionByPaymentId(paymentProvider, paymentId);
    if (transaction && transaction.booking_id) {
      const { updateReservationStatus } = require('./reservation');
      await updateReservationStatus(transaction.booking_id, 'confirmed', 'completed');
    }
  }
}

export async function findTransactionByPaymentId(paymentProvider: string, paymentId: string) {
  const rows = await query(
    `SELECT * FROM transactions WHERE payment_provider = $1 AND payment_id = $2 LIMIT 1`,
    [paymentProvider, paymentId]
  );
  return rows[0] || null;
}
