const fs = require('fs');
const assert = require('assert');

const webhookPath = 'supabase/functions/stripe-webhook/index.ts';
const migrationPath = 'supabase/migrations/20260915150404_reconcile_stripe_webhook_rpc_boundary.sql';
const source = fs.readFileSync(webhookPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');

assert.match(source, /if \(!secret\)\s*\{[\s\S]*?return json\(\{ error: "webhook_not_configured" \}, 503\);/, 'webhook must fail closed when signing secret is missing');
assert.doesNotMatch(source, /configured: false/, 'webhook must not acknowledge an unconfigured endpoint');
assert.match(source, /if \(age > 300 \|\| age < -300\) return false;/, 'webhook signature timestamp must be bounded');
assert.match(source, /if \(!Number\.isFinite\(timestampSeconds\)\) return false;/, 'webhook must reject malformed timestamps');
assert.match(source, /const signatures: string\[\] = \[\];/, 'webhook must retain multiple Stripe v1 signatures during secret rotation');
assert.match(source, /signatures\.some\(\(candidate\) =>/, 'webhook must accept any valid Stripe v1 signature');

assert.match(source, /typeof event\.id === "string"/, 'webhook must require Stripe event ID');
assert.match(source, /admin\.rpc\("apply_subscription_event"/, 'webhook must use the canonical event RPC boundary');
assert.match(source, /p_event_id: args\.eventId/, 'webhook must pass Stripe event ID');
assert.match(source, /p_event_type: args\.eventType/, 'webhook must pass event type');
assert.match(source, /!obj \|\| typeof obj !== "object"/, 'webhook must reject malformed event data before processing');

assert.match(source, /typeof obj\.subscription === "string"/, 'checkout webhook must recognize subscription IDs');
assert.match(source, /fetchStripeSubscription\(subscriptionId\)/, 'checkout webhook must resolve authoritative subscription data');
assert.match(source, /if \(!sub\)\s*\{[\s\S]*?return json\(\{ error: "stripe_lookup_failed" \}, 503\);/, 'checkout must fail closed when its authoritative subscription lookup fails');
assert.match(source, /const STRIPE_LOOKUP_TIMEOUT_MS = 8_000;/, 'Stripe API lookups must have a bounded timeout');
assert.match(source, /signal: controller\.signal/, 'Stripe API lookups must be cancellable');
assert.match(source, /setTimeout\(\(\) => controller\.abort\(\), STRIPE_LOOKUP_TIMEOUT_MS\)/, 'Stripe lookup timeout must abort the request');
assert.match(source, /clearTimeout\(timeout\)/, 'Stripe lookup timeout must always be released');
assert.doesNotMatch(source, /Date\.now\(\) \+ 30 \* 24 \* 3600 \* 1000/, 'webhook must not invent a 30-day entitlement');

assert.match(source, /result\)\.ok !== true/, 'webhook must reject a non-success RPC result');
assert.doesNotMatch(source, /if \(!result\)/, 'webhook must not treat result presence alone as success');
assert.doesNotMatch(source, /detail:\s*error\.message/, 'webhook must not expose database error details');
assert.match(source, /return json\(\{ error: "db_error" \}, 500\);/, 'database failures must remain retryable');
assert.match(source, /return json\(\{ error: "stripe_lookup_failed" \}, 503\);/, 'Stripe lookup failures must remain retryable');

assert.match(migration, /DROP FUNCTION IF EXISTS public\.apply_subscription_event\(uuid, text, text, timestamptz, text, text, text\);/, 'conflicting event RPC overload must be removed');
assert.match(migration, /DROP FUNCTION IF EXISTS public\.apply_subscription\(uuid, text, text, timestamptz, text, text, text\);/, 'conflicting subscription RPC overload must be removed');
assert.match(migration, /subscription_profile_not_found/, 'missing profile must rollback the subscription transaction');
assert.match(migration, /REVOKE ALL ON FUNCTION public\.apply_subscription_event/, 'event RPC must not be publicly executable');
assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.apply_subscription_event[\s\S]*TO service_role;/, 'event RPC must be callable by the server-side service role');

console.log('Stripe webhook guard: PASS');
