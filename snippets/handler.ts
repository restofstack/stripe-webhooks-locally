// @ts-nocheck
// Shown on screen around 5:20 in the video.
// Pseudocode-ish — the framework-agnostic shape, not the runnable Express
// version that lives in ../server/server.js. Helpers are intentionally
// undefined; this file is for display, not execution.

export default async function handler(req, res) {
  const event = verifySignature(req); // raw body in, parsed event out

  console.log(`[stripe] ${event.type} ${event.id}`);

  const existing = await findEvent(event.id);

  if (existing) {
    console.log(`[stripe] skipped duplicate ${event.id}`);
    return res.json({ received: true, skipped: true });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSucceeded(event.data.object);
      break;

    case "charge.failed":
      await handleChargeFailed(event.data.object);
      break;

    default:
      console.log(`[stripe] no-op for ${event.type}`);
  }

  await recordEvent(event);

  return res.json({ received: true });
}
