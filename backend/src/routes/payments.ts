import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const router = express.Router();

import { createTransaction, getCommissionRate } from '../models/transaction';
import { getReservationById } from '../models/reservation';
import { authenticateJWT } from '../middleware/security';
import * as db from '../db/postgres-client';

// Stripe setup
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' });

// ==========================================
// SINGLE SOURCE OF TRUTH FOR PLATFORM FEE
// ==========================================
// The COMMISSION_RATE environment variable defines the platform fee percentage.
// Default is 0.05 (5%). The frontend relies on this value (PLATFORM_FEE_RATE).

// Create Stripe Payment Intent
router.post('/stripe/create-intent', authenticateJWT, async (req: any, res: Response) => {
  try {
    const { currency, providerId, bookingId } = req.body;
    const buyerId = req.user.userId; // Securely get buyerId from JWT

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    // Secure validation: fetch the reservation directly from the database
    const reservation = await getReservationById(parseInt(bookingId));
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.user_id !== buyerId) {
      return res.status(403).json({ error: 'You are not authorized to pay for this reservation' });
    }

    // IMPORTANT: Ignore the 'amount' from the client and use the database value!
    // Convert to cents for Stripe
    const amountCents = Math.round(Number(reservation.total_price) * 100);
    const amountDecimal = amountCents / 100;
    const commissionRate = await getCommissionRate();
    const appFeeAmount = Math.round(amountDecimal * commissionRate * 100) / 100;
    const providerAmount = Math.round((amountDecimal - appFeeAmount) * 100) / 100;

    // Create Stripe Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata: { buyerId, providerId, bookingId: bookingId.toString() }
    });

    // Record pending transaction in DB (appFeeAmount goes to platform MP account)
    await createTransaction({
      paymentProvider: 'stripe',
      paymentId: paymentIntent.id,
      status: 'pending',
      amount: amountDecimal,
      currency,
      buyerId,
      providerId,
      bookingId,
      appFeeAmount,
      providerAmount
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment processing error. Please try again.' });
  }
});

// MercadoPago Preference — SDK v2
router.post('/mercadopago/create-preference', authenticateJWT, async (req: any, res: Response) => {
  try {
    const { items, payer, back_urls, providerId, bookingId } = req.body;
    const buyerId = req.user.userId;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    // Secure validation: fetch the reservation directly from the database
    const reservation = await getReservationById(parseInt(bookingId));
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.user_id !== buyerId) {
      return res.status(403).json({ error: 'You are not authorized to pay for this reservation' });
    }

    // Look up the vendor's MP access token (marketplace OAuth)
    const vendorRows: any = await db.query(
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

    // IMPORTANT: Ignore the client-provided prices and use the DB value
    const totalAmount = Number(reservation.total_price);
    const commissionRate = await getCommissionRate();
    const appFeeAmount = Math.round(totalAmount * commissionRate * 100) / 100;
    const providerAmount = Math.round((totalAmount - appFeeAmount) * 100) / 100;

    // Create a secured items array using the correct price from DB
    const currency_id = items && items[0] ? items[0].currency_id : 'ARS';
    const securedItems = [{
      id: bookingId.toString(),
      title: items && items[0] ? items[0].title : `Reserva #${bookingId}`,
      quantity: 1,
      currency_id,
      unit_price: totalAmount,
    }];

    // Use the vendor's own MP token so the payment goes to their account
    // marketplace_fee is automatically transferred to the platform's account
    const vendorMpClient = new MercadoPagoConfig({ accessToken: vendor.mp_access_token });
    const vendorMpPreference = new Preference(vendorMpClient);

    const result = await vendorMpPreference.create({
      body: {
        items: securedItems,
        payer,
        marketplace_fee: appFeeAmount, // Platform commission — goes to the platform's MP account
        back_urls: back_urls || {},
        auto_return: 'approved' as const,
        external_reference: bookingId?.toString()
      }
    });

    // Store transaction in DB
    const currency = currency_id;

    await createTransaction({
      paymentProvider: 'mercadopago',
      paymentId: result.id!.toString(),
      status: 'pending',
      amount: totalAmount,
      currency,
      buyerId: buyerId || (payer?.id ? payer.id.toString() : null),
      providerId,
      bookingId,
      metadata: { items: securedItems, payer },
      appFeeAmount,
      providerAmount
    });

    res.json({ init_point: result.init_point, sandbox_init_point: result.sandbox_init_point });
  } catch (error) {
    console.error('MercadoPago error:', error);
    res.status(500).json({ error: 'Payment processing error. Please try again.' });
  }
});

export default router;
