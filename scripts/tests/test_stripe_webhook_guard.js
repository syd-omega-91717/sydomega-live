const fs = require('fs');
const assert = require('assert');

const path = 'supabase/functions/stripe-webhook/index.ts';
const source = fs.readFileSync(path, 'utf8');

// A webhook endpoint must never acknowledge payment events when its signing
// secret is absent. This is a source-level regression guard because the Edge
// Function is Deno code and is not imported into the Node test process.
assert.match(
  source,
  /if \(!secret\)\s*\{[\s\S]*?return json\(\{ error: "webhook_not_configured" \}, 503\);/,
  'stripe webhook must fail closed with HTTP 503 when STRIPE_WEBHOOK_SECRET is missing'
);
assert.doesNotMatch(
  source,
  /if \(!secret\)\s*\{[\s\S]*?return json\(\{ received: true, configured: false \}\);/,
  'stripe webhook must not acknowledge an unconfigured endpoint'
);

// Replay protection must reject both stale and implausibly future timestamps.
assert.match(
  source,
  /if \(age > 300 \|\| age < -300\) return false;/,
  'stripe webhook signature verification must enforce a bounded timestamp tolerance'
);
assert.match(
  source,
  /if \(!Number\.isFinite\(timestampSeconds\)\) return false;/,
  'stripe webhook signature verification must reject malformed timestamps'
);

// Stripe Checkout normally carries a subscription ID, not an embedded
// Subscription object. The handler must resolve that ID against Stripe before
// deriving the billing period and must not manufacture a 30-day entitlement.
assert.match(
  source,
  /typeof obj\.subscription === "string"/, 
  'checkout webhook must recognize Stripe subscription IDs'
);
assert.match(
  source,
  /fetchStripeSubscription\(subscriptionId\)/,
  'checkout webhook must resolve the authoritative subscription when available'
);
assert.doesNotMatch(
  source,
  /Date\.now\(\) \+ 30 \* 24 \* 3600 \* 1000/,
  'checkout webhook must not silently invent a 30-day billing period'
);

// Provider/database internals must never be returned to an untrusted webhook
// caller. Keep detailed diagnostics in server logs only.
assert.doesNotMatch(
  source,
  /detail:\s*error\.message/,
  'webhook must not expose database error details'
);
assert.match(
  source,
  /return json\(\{ error: "db_error" \}, 500\);/,
  'database failures must remain retryable without leaking internals'
);

// A failed subscription lookup is a transient integration failure and must
// remain retryable rather than being acknowledged as successfully processed.
assert.match(
  source,
  /return json\(\{ error: "stripe_lookup_failed" \}, 503\);/,
  'failed Stripe subscription lookup must return a retryable 503'
);

console.log('Stripe webhook guard: PASS');
