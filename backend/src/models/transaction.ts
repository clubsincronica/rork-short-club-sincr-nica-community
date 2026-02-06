import { query } from '../db/postgres-client';

export async function createTransaction({
  paymentProvider,
  paymentId,
  status = 'pending',
  amount, // This is the TOTAL amount charged to the customer
  currency,
  buyerId = null,
  providerId = null,
  bookingId = null,
  metadata = null,
  appFeeAmount = null, // Optional explicit fee
  providerAmount = null // Optional explicit provider amount
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
  appFeeAmount?: number | null;
  providerAmount?: number | null;
}) {
  // If explicit amounts are provided, use them. Otherwise default to 5% calculation for backward compatibility.
  const finalAppFee = appFeeAmount !== null ? appFeeAmount : (amount * 0.05);
  const finalProviderAmount = providerAmount !== null ? providerAmount : (amount - finalAppFee);

  const res = await query(
    `INSERT INTO transactions (
      payment_provider, payment_id, status, total_amount, app_fee_amount, 
      provider_amount, buyer_id, provider_id, booking_id, currency, metadata, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
    [
      paymentProvider,
      paymentId,
      status,
      amount,
      finalAppFee,
      finalProviderAmount,
      buyerId,
      providerId,
      bookingId,
      currency,
      metadata ? JSON.stringify(metadata) : null
    ]
  );

  return res[0];
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

export async function updateTransaction(id: number, updates: { paymentId?: string, status?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (updates.paymentId) {
    fields.push(`payment_id = $${paramIdx++}`);
    values.push(updates.paymentId);
  }
  if (updates.status) {
    fields.push(`status = $${paramIdx++}`);
    values.push(updates.status);
  }

  if (fields.length === 0) return;

  values.push(id);

  await query(
    `UPDATE transactions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIdx}`,
    values
  );
}

export async function findTransactionByPaymentId(paymentProvider: string, paymentId: string) {
  const rows = await query(
    `SELECT * FROM transactions WHERE payment_provider = $1 AND payment_id = $2 LIMIT 1`,
    [paymentProvider, paymentId]
  );
  return rows[0] || null;
}
