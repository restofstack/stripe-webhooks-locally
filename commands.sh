#!/usr/bin/env bash
# Commands shown on screen during the video, in order.
# This file is for copy-paste — don't execute it top-to-bottom.
# Each block is a separate terminal pane / take.

# ──────────────────────────────────────────────────────────────────────
# Terminal 1 — the local app (port 8000)
# Shown around 0:40
# ──────────────────────────────────────────────────────────────────────
cd videos/01-stripe-webhooks-locally/server
npm run dev


# ──────────────────────────────────────────────────────────────────────
# Terminal 2 — Stripe CLI listener
# Shown around 1:10
# Copy the whsec_... it prints into server/.env, then restart Terminal 1.
# ──────────────────────────────────────────────────────────────────────
stripe listen --forward-to "http://localhost:8000/api/stripe-webhook-dev"


# ──────────────────────────────────────────────────────────────────────
# Terminal 3 — trigger real Stripe test events
# Shown around 2:50 and 3:55
# ──────────────────────────────────────────────────────────────────────
stripe trigger payment_intent.succeeded

stripe trigger charge.failed

stripe trigger customer.subscription.created

stripe trigger invoice.payment_failed


# ──────────────────────────────────────────────────────────────────────
# Replay an event by ID — the moment that "changes everything" (4:35)
# Grab a real evt_... from Terminal 2 output before recording this take.
# ──────────────────────────────────────────────────────────────────────
stripe events resend evt_REPLACE_WITH_REAL_ID


# ──────────────────────────────────────────────────────────────────────
# (Optional) tail logs in a fourth pane if you want a separate log view.
# The server logs to stdout by default, so this is only needed if you
# redirect output to a file. Shown briefly in the four-command summary.
# ──────────────────────────────────────────────────────────────────────
tail -f /tmp/app.log
