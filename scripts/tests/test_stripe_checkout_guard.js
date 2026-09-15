const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('supabase/functions/checkout/index.ts', 'utf8');

assert.match(
  source,
  /if \(!url \|\| !svc \|\| !anon\)\s*\{[\s\S]*?return json\(\{ error: "checkout_not_configured" \}, 503\);/,
  'checkout must fail closed when required Supabase secrets are missing'
);
assert.match(
  source,
  /if \(flagError\)\s*\{[\s\S]*?return json\(\{ error: "checkout_not_configured" \}, 503\);/,
  'checkout must fail closed when the payment feature flag cannot be read'
);
assert.match(
  source,
  /return json\(\{ error: "stripe_error" \}, 502\);/,
  'Stripe provider failures must return a generic retryable response'
);
assert.doesNotMatch(
  source,
  /return json\(\{ error: "stripe_error", detail: session\?\.error\?\.message \}, 400\);/,
  'Stripe provider error details must not be exposed to clients'
);
assert.match(
  source,
  /return json\(\{ error: "checkout_failed" \}, 500\);/,
  'unexpected checkout failures must use a generic response'
);
assert.doesNotMatch(
  source,
  /return json\(\{ error: String\(e\) \}, 500\);/,
  'unexpected exception details must not be exposed to clients'
);
assert.match(
  source,
  /if \(!session\?\.url\)\s*\{[\s\S]*?return json\(\{ error: "stripe_response_invalid" \}, 502\);/,
  'checkout must reject a successful-but-malformed Stripe response'
);

console.log('Stripe checkout guard: PASS');
