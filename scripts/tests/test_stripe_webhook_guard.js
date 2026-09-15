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

console.log('Stripe webhook guard: PASS');
