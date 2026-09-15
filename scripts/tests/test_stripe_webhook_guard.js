const fs = require('fs');
const assert = require('assert');

const webhookPath = 'supabase/functions/stripe-webhook/index.ts';
const migrationPath = 'supabase/migrations/20260915141500_stripe_subscription_row_integrity.sql';
const source = fs.readFileSync(webhookPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');

assert.match(source, /if \(!secret\)\s*\{[\s\S]*?return json\(\{ error: "webhook_not_configured" \}, 503\);/, 'webhook must fail closed when signing secret is missing');
assert.doesNotMatch(source, /configured: false/, 'webhook must not acknowledge an unconfigured endpoint');
assert.match(source, /if \(age > 300 \|\| age < -300\) return false;/, 'webhook signature timestamp must be bounded');
assert.match(source, /if \(!Number\.isFinite\(timestampSeconds\)\) return false;/, 'webhook must reject malformed timestamps');

assert.match(source, /typeof event\.id === "string"/, 'webhook must require Stripe event ID');
assert.match(source, /p_event_id: args\.eventId/, 'webhook must pass Stripe event ID');
assert.match(source, /p_event_type: args\.eventType/, 'webhook must pass event type');

assert.match(source, /typeof obj\.subscription === "string"/, 'checkout webhook must recognize subscription IDs');
assert.match(source, /fetchStripeSubscription\(subscriptionId\)/, 'checkout webhook must resolve authoritative subscription data');
assert.match(source, /if \(subscriptionId && !sub\)\s*\{[\s\S]*?return json\(\{ error: "stripe_lookup_failed" \}, 503\);/, 'checkout must fail closed when its authoritative subscription lookup fails');
assert.doesNotMatch(source, /Date\.now\(\) \+ 30 \* 24 \* 3600 \* 1000/, 'webhook must not invent a 30-day entitlement');

assert.match(source, /result\)\.ok !== true/, 'webhook must reject a non-success RPC result');
assert.doesNotMatch(source, /if \(!result\)/, 'webhook must not treat result presence alone as success');
assert.doesNotMatch(source, /detail:\s*error\.message/, 'webhook must not expose database error details');
assert.match(source, /return json\(\{ error: "db_error" \}, 500\);/, 'database failures must remain retryable');
assert.match(source, /return json\(\{ error: "stripe_lookup_failed" \}, 503\);/, 'Stripe lookup failures must remain retryable');

assert.match(migration, /GET DIAGNOSTICS updated_count = ROW_COUNT;/, 'RPC must inspect affected profile rows');
assert.match(migration, /IF updated_count <> 1 THEN/, 'RPC must reject a missing or unexpected profile update');
assert.match(migration, /RAISE EXCEPTION 'subscription_profile_not_found';/, 'missing profile must rollback the webhook transaction');

console.log('Stripe webhook guard: PASS');
