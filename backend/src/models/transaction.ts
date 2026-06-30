import { query } from '../db/postgres-client';

/**
 * Get the platform commission rate.
 * Reads from the platform_settings table first (admin-controlled),
 * falls back to the COMMISSION_RATE env var, then to 0.05.
 */
export async function getCommissionRate(): Promise<number> {
  try {
    const rows = await query(
      `SELECT value FROM platform_settings WHERE key = 'commission_rate' LIMIT 1`
    );
    if (rows[0]?.value) {
      return parseFloat(rows[0].value);
    }
  } catch {
    // Fall through to env fallback if table doesn't exist yet
  }
  return parseFloat(process.env.COMMISSION_RATE || '0.05');
}

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
  appFeeAmount: providedAppFee,
  providerAmount: providedProviderAmount,
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
  appFeeAmount?: number;
  providerAmount?: number;
}) {
  // Use pre-calculated values when provided (set by payments route),
  // otherwise fall back to reading the rate from DB/env.
  let appFeeAmount: number;
  let providerAmount: number;

  if (providedAppFee !== undefined && providedProviderAmount !== undefined) {
    appFeeAmount = providedAppFee;
    providerAmount = providedProviderAmount;
  } else {
    const commissionRate = await getCommissionRate();
    appFeeAmount = Math.round(amount * commissionRate * 100) / 100;
    providerAmount = Math.round((amount - appFeeAmount) * 100) / 100;
  }

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
