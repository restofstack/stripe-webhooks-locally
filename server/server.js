// Demo Express server for the centrali.io YouTube tutorial:
// "How to Test Stripe Webhooks Locally Without Guessing"
//
// Listens on port 8000 (the YouTube channel standard demo port).
// Exposes POST /api/stripe-webhook-dev — the dev-only Stripe webhook handler.
//
// Why a separate /api/stripe-webhook-dev route: local debugging and
// production trust rules should not share a path. Keep them split.

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const Stripe = require('stripe');

const PORT = Number(process.env.PORT) || 8000;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_DEV;

const stripe = new Stripe('sk_test_unused_for_signature_only', { apiVersion: '2024-06-20' });
const app = express();

// In-memory store so we can demo idempotency without standing up a database.
// Restart the server and it forgets — that's fine for a tutorial.
const seenEvents = new Map();

app.post(
  '/api/stripe-webhook-dev',
  // CRITICAL: raw body parser. Stripe signature verification needs the exact
  // bytes Stripe sent. JSON parsing destroys them.
  express.raw({ type: 'application/json' }),
  (req, res) => {
    if (!WEBHOOK_SECRET) {
      console.error('[stripe] STRIPE_WEBHOOK_SECRET_DEV is not set — paste the whsec_ from `stripe listen` into .env');
      return res.status(500).json({ error: 'webhook secret not configured' });
    }

    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error(`[stripe] signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[stripe] ${event.type} ${event.id}`);

    if (seenEvents.has(event.id)) {
      console.log(`[stripe] skipped duplicate ${event.id}`);
      return res.json({ received: true, skipped: true });
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        handlePaymentSucceeded(event.data.object);
        break;
      case 'charge.failed':
        handleChargeFailed(event.data.object);
        break;
      case 'customer.subscription.created':
        handleSubscriptionCreated(event.data.object);
        break;
      case 'invoice.payment_failed':
        handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        // Intentional no-op. Returning 200 stops Stripe from retrying noise
        // and keeps real failures visible.
        console.log(`[stripe] no-op for ${event.type}`);
    }

    seenEvents.set(event.id, Date.now());

    return res.json({ received: true });
  },
);

function handlePaymentSucceeded(paymentIntent) {
  console.log(`[stripe]   → payment succeeded ${paymentIntent.id} amount=${paymentIntent.amount}`);
}

function handleChargeFailed(charge) {
  console.log(`[stripe]   → charge failed ${charge.id} reason=${charge.failure_message}`);
}

function handleSubscriptionCreated(subscription) {
  console.log(`[stripe]   → subscription created ${subscription.id} status=${subscription.status}`);
}

function handleInvoicePaymentFailed(invoice) {
  console.log(`[stripe]   → invoice payment failed ${invoice.id}`);
}

app.get('/', (_req, res) => {
  res.type('text/plain').send(
    'centrali.io YouTube demo — Stripe webhook receiver\n' +
    `POST http://localhost:${PORT}/api/stripe-webhook-dev\n`,
  );
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] webhook route: POST /api/stripe-webhook-dev`);
  if (!WEBHOOK_SECRET) {
    console.log('[server] (no STRIPE_WEBHOOK_SECRET_DEV yet — paste whsec_ from `stripe listen` into .env)');
  }
});
