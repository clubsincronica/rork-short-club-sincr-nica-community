import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import mercadopago from 'mercadopago';

const router = express.Router();

import { createTransaction } from '../models/transaction';

// Stripe setup
// The user's installed stripe version is ^20.1.0 which seems to expect a specific version string
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any
});

// MercadoPago setup (v2 SDK)
import { MercadoPagoConfig, Preference } from 'mercadopago';
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
const preferenceClient = new Preference(mpClient);

// Create Stripe Payment Intent
router.post('/stripe/create-intent', async (req: Request, res: Response) => {
  try {
    const { amount, currency, buyerId, providerId, bookingId, type } = req.body;

    // Create Stripe Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { buyerId, providerId, bookingId, type }
    });

    // Record pending transaction in DB
    await createTransaction({
      paymentProvider: 'stripe',
      paymentId: paymentIntent.id,
      status: 'pending',
      amount: amount / 100, // Stripe uses cents
      currency,
      buyerId,
      providerId,
      bookingId,
      commissionRate: 0.05 // 5% platform fee
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Stripe error', details: error });
  }
});

// MercadoPago Preference
router.post('/mercadopago/create-preference', async (req: Request, res: Response) => {
  try {
    const { items, payer, back_urls, buyerId, providerId, bookingId, type } = req.body;

    const preference = await preferenceClient.create({
      body: {
        items,
        payer,
        back_urls: back_urls || {},
        auto_return: 'approved',
        external_reference: bookingId?.toString()
      }
    });

    // Store transaction in DB
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.unit_price * (item.quantity || 1)), 0);
    const currency = items[0]?.currency_id || 'ARS';

    await createTransaction({
      paymentProvider: 'mercadopago',
      paymentId: (preference.id || '').toString(),
      status: 'pending',
      amount: totalAmount,
      currency,
      buyerId: buyerId || (payer && payer.id ? payer.id.toString() : null),
      providerId,
      bookingId,
      metadata: { items, payer, type },
      commissionRate: 0.05
    });

    res.json({ init_point: preference.init_point });
  } catch (error) {
    console.error('MercadoPago error:', error);
    res.status(500).json({ error: 'MercadoPago error', details: error });
  }
});

export default router;
