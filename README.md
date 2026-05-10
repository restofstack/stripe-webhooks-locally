# Test Stripe webhooks locally — companion code

Minimal Express demo for testing Stripe webhooks locally with the Stripe CLI. Companion code to the walkthrough:

- 📝 Written walkthrough: [How to Test Stripe Webhooks Locally — Stripe CLI, Replay, Logs](https://dev.to/restofstack/how-to-test-stripe-webhooks-locally-stripe-cli-replay-logs-7of)
- 📺 Video walkthrough: *link added after upload*

What's demonstrated: forward real Stripe test events to `localhost` via the Stripe CLI, verify signatures against the raw request body, replay events by ID after a code fix, and prove idempotency by skipping duplicate event IDs.

## Prerequisites

- Node.js 20+
- [Stripe CLI](https://docs.stripe.com/stripe-cli) installed and logged in (`stripe login`)
- A Stripe test account (no real charges — everything runs in test mode)

## Quick start

```bash
# 1. Install
cd server
npm install
cp ../.env.example .env

# 2. In a second terminal — start the Stripe CLI listener
stripe listen --forward-to "http://localhost:8000/api/stripe-webhook-dev"
# Copy the printed whsec_... into server/.env as STRIPE_WEBHOOK_SECRET_DEV

# 3. Back in the first terminal — start the server
npm run dev

# 4. In a third terminal — trigger a test event
stripe trigger payment_intent.succeeded
```

You should see a line like `[stripe] payment_intent.succeeded evt_...` in the server log.

## The four-command loop

The whole workflow boils down to four commands. Full list in [`commands.sh`](./commands.sh).

```bash
# listen
stripe listen --forward-to "http://localhost:8000/api/stripe-webhook-dev"

# trigger
stripe trigger payment_intent.succeeded

# replay (paste the evt_... ID from the listener output)
stripe events resend evt_xxx

# replay again — handler should skip the duplicate
stripe events resend evt_xxx
```

## What's in here

- [`server/server.js`](./server/server.js) — Express app with `POST /api/stripe-webhook-dev`. Verifies the Stripe signature against the raw body, logs `event.type event.id`, and keeps an in-memory dedupe set so you can demo idempotency.
- [`server/.env.example`](./server/.env.example) — copy to `server/.env` and paste the `whsec_...` printed by `stripe listen`.
- [`commands.sh`](./commands.sh) — every command shown on screen, in order.
- [`snippets/handler.ts`](./snippets/handler.ts) — the handler-shape snippet shown in the video.
- [`snippets/checklist.md`](./snippets/checklist.md) — the pre-production checklist (five things to verify before pointing Stripe at production).

## Why a separate dev route

Local webhook testing uses a different signing secret than production — the one printed by the Stripe CLI, not the one on the Stripe dashboard. Mixing them on the same route is the most common source of "signature verification failed" pain. This demo uses a dedicated `/api/stripe-webhook-dev` route to keep that boundary obvious.

## License

[MIT](./LICENSE) — copy freely.
