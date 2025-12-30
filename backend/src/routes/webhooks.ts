
import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateTransactionStatus } from '../models/transaction';

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' as any });
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
  // MercadoPago sends payment notifications here
  console.log('MercadoPago webhook received:', req.body);
  try {
    // MercadoPago sends topic and id, you may need to fetch payment status
    const { data, type } = req.body;
    if (type === 'payment' && data && data.id) {
      const paymentId = data.id.toString();
      let status = req.body.action || 'unknown';

      try {
        const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
        const paymentClient = new Payment(mpClient);
        const payment = await paymentClient.get({ id: paymentId });
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
