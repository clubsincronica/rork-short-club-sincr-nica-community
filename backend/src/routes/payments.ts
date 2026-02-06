import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import mercadopago from 'mercadopago';
import { createTransaction, updateTransaction } from '../models/transaction';
import { authenticateJWT } from '../middleware/security';

const router = express.Router();

// Validated: Only authenticated users can initiate payments
router.use(authenticateJWT);

// Stripe setup
// Initialize conditionally to prevent startup crash if key is missing
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-12-15.clover' as any
}) : null;

// MercadoPago setup (v2 SDK)
import { MercadoPagoConfig, Preference } from 'mercadopago';
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const mpClient = mpAccessToken ? new MercadoPagoConfig({ accessToken: mpAccessToken }) : null;
const preferenceClient = mpClient ? new Preference(mpClient) : null;

// Create Stripe Payment Intent
router.post('/stripe/create-intent', async (req: Request, res: Response) => {
  try {
    const { amount, currency, buyerId, providerId, bookingId, type } = req.body;

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe payments not configured' });
    }

    // Calculate Profit Sharing Fees (2.5% Customer + 2.5% Provider)
    const baseAmount = amount; // Input is in cents

    // Validates keys exist or falls back to defaults
    const { getConfigValue } = require('../models/system-config');
    const custFeeStr = await getConfigValue('customer_fee_percent', '2.5');
    const provFeeStr = await getConfigValue('provider_fee_percent', '2.5');

    const customerFeePct = parseFloat(custFeeStr) / 100;
    const providerFeePct = parseFloat(provFeeStr) / 100;

    const customerFee = Math.round(baseAmount * customerFeePct);
    const providerFee = Math.round(baseAmount * providerFeePct);
    const totalCharge = baseAmount + customerFee; // Total to charge the customer's card
    const applicationFee = customerFee + providerFee; // Total to keep in Platform account
    const providerPayout = totalCharge - applicationFee; // Amount for provider (Base - ProviderFee)

    // Transaction Safety: Record PENDING transaction first
    const tempPaymentId = `temp_stripe_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const pendingTx: any = await createTransaction({
      paymentProvider: 'stripe',
      paymentId: tempPaymentId,
      status: 'pending_payment', // Initial status before Stripe confirms intent creation
      amount: totalCharge / 100, // Convert to standard units for DB
      currency,
      buyerId,
      providerId,
      bookingId,
      appFeeAmount: applicationFee / 100,
      providerAmount: providerPayout / 100,
      metadata: {
        base_amount_cents: baseAmount,
        customer_fee_cents: customerFee,
        provider_fee_cents: providerFee
      }
    });

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCharge,
        currency,
        metadata: {
          buyerId,
          providerId,
          bookingId,
          type,
          base_amount: baseAmount,
          customer_fee: customerFee,
          provider_fee: providerFee,
          transaction_db_id: pendingTx?.id
        }
      });

      // Update with real Payment ID
      if (pendingTx?.id) {
        await updateTransaction(pendingTx.id, {
          paymentId: paymentIntent.id,
          status: 'pending' // Ready for client confirmation
        });
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Stripe Intent Creation Failed:', error);
      // Mark as failed
      if (pendingTx?.id) {
        await updateTransaction(pendingTx.id, { status: 'failed_init' });
      }
      throw error; // Let outer catch block handle response
    }
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Stripe error', details: error });
  }
});

// MercadoPago Preference
router.post('/mercadopago/create-preference', async (req: Request, res: Response) => {
  try {
    const { items, payer, back_urls, buyerId, providerId, bookingId, type } = req.body;

    if (!preferenceClient) {
      return res.status(503).json({ error: 'MercadoPago payments not configured' });
    }

    // Calculate Profit Sharing Fees (2.5% Customer + 2.5% Provider)
    // Base amount is sum of item prices
    const baseAmount = items.reduce((sum: number, item: any) => sum + (item.unit_price * (item.quantity || 1)), 0);

    // Validates keys exist or falls back to defaults
    const { getConfigValue } = require('../models/system-config');
    const custFeeStr = await getConfigValue('customer_fee_percent', '2.5');
    const provFeeStr = await getConfigValue('provider_fee_percent', '2.5');

    const customerFeePct = parseFloat(custFeeStr) / 100;
    const providerFeePct = parseFloat(provFeeStr) / 100;

    // Fees
    const customerFee = Math.round(baseAmount * customerFeePct);
    const providerFee = Math.round(baseAmount * providerFeePct);

    // Totals
    const applicationFee = customerFee + providerFee;
    const totalCharge = baseAmount + customerFee;
    const providerPayout = totalCharge - applicationFee;

    // Add Service Fee item to preference (Charge the customer extra)
    const preferenceItems = [
      ...items,
      {
        title: 'Costo de Servicio (2.5%)',
        unit_price: customerFee,
        quantity: 1,
        currency_id: items[0]?.currency_id || 'ARS'
      }
    ];

    // Transaction Safety: Record PENDING first
    const currency = items[0]?.currency_id || 'ARS';
    const tempPaymentId = `temp_mp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const pendingTx: any = await createTransaction({
      paymentProvider: 'mercadopago',
      paymentId: tempPaymentId,
      status: 'pending_payment',
      amount: totalCharge,
      currency,
      buyerId: buyerId || (payer && payer.id ? payer.id.toString() : null),
      providerId,
      bookingId,
      metadata: { items: preferenceItems, payer, type, base_amount: baseAmount },
      appFeeAmount: applicationFee,
      providerAmount: providerPayout
    });

    try {
      const preference = await preferenceClient.create({
        body: {
          items: preferenceItems,
          payer,
          back_urls: back_urls || {},
          auto_return: 'approved',
          external_reference: bookingId?.toString(),
          metadata: { transaction_db_id: pendingTx?.id }
        }
      });

      // Update with real ID
      if (pendingTx?.id) {
        await updateTransaction(pendingTx.id, {
          paymentId: (preference.id || '').toString(),
          status: 'pending'
        });
      }

      res.json({ init_point: preference.init_point });
    } catch (error) {
      console.error('MercadoPago Preference Creation Failed:', error);
      if (pendingTx?.id) {
        await updateTransaction(pendingTx.id, { status: 'failed_init' });
      }
      throw error;
    }
  } catch (error) {
    console.error('MercadoPago error:', error);
    res.status(500).json({ error: 'MercadoPago error', details: error });
  }
});

export default router;
