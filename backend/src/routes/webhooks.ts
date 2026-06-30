
import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import { updateTransactionStatus } from '../models/transaction';

const router = express.Router();

// MercadoPago client — SDK v2
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' });
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret!);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types

  switch (event.type) {
    case 'payment_intent.succeeded': {
      // Payment was successful
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Stripe payment succeeded:', paymentIntent.id);
      try {
        await updateTransactionStatus('stripe', paymentIntent.id, 'succeeded');
      } catch (err) {
        console.error('Failed to update transaction status for Stripe:', err);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      // Payment failed
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Stripe payment failed:', paymentIntent.id);
      try {
        await updateTransactionStatus('stripe', paymentIntent.id, 'failed');
      } catch (err) {
        console.error('Failed to update transaction status for Stripe:', err);
      }
      break;
    }
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.json({ received: true });
});

// MercadoPago webhook endpoint
router.post('/mercadopago', express.json(), async (req: Request, res: Response) => {
  // Validate MercadoPago HMAC-SHA256 signature
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    const xSignature = req.headers['x-signature'] as string | undefined;
    const xRequestId = req.headers['x-request-id'] as string | undefined;
    const dataId = req.body?.data?.id?.toString() ?? '';

    if (!xSignature || !xRequestId) {
      console.warn('MercadoPago webhook: missing signature headers');
      return res.status(400).send('Missing signature headers');
    }

    // Parse ts and v1 from x-signature header (format: "ts=<ts>,v1=<hash>")
    const sigParts = Object.fromEntries(
      xSignature.split(',').map(part => part.split('=') as [string, string])
    );
    const ts = sigParts['ts'];
    const v1 = sigParts['v1'];

    if (!ts || !v1) {
      console.warn('MercadoPago webhook: malformed x-signature header');
      return res.status(400).send('Malformed signature header');
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) {
      console.error('MercadoPago webhook: signature verification failed');
      return res.status(400).send('Invalid signature');
    }
  } else {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature verification (not safe for production)');
  }

  // MercadoPago sends payment notifications here
  console.log('MercadoPago webhook received:', req.body);
  try {
    // MercadoPago sends topic and id, you may need to fetch payment status
    const { data, type } = req.body;
    if (type === 'payment' && data && data.id) {
      // Fetch payment details from MercadoPago API using SDK v2
      const paymentId = data.id.toString();
      let status = req.body.action || 'unknown';
      try {
        const mpPayment = new MPPayment(mpClient);
        const payment = await mpPayment.get({ id: paymentId });
        status = payment.status || status;
      } catch (err) {
        console.warn('MercadoPago API fetch failed:', err);
      }
      await updateTransactionStatus('mercadopago', paymentId, status);
    }
  } catch (err) {
    console.error('Failed to update transaction status for MercadoPago:', err);
  }
  res.sendStatus(200);
});

export default router;
