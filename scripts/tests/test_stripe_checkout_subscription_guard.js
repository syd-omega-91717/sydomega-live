const fs = require('fs');
const assert = require('assert');

const webhook = fs.readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
const checkout = fs.readFileSync('supabase/functions/checkout/index.ts', 'utf8');

assert.match(checkout, /form\.set\("mode", "subscription"\)/, 'checkout must remain subscription-only');
assert.match(webhook, /const subscriptionId = typeof obj\.subscription === "string" \? obj\.subscription : null;/, 'webhook must read the Stripe subscription ID');
assert.match(webhook, /if \(!subscriptionId\)\s*\{[\s\S]*?return json\(\{ error: "subscription_missing" \}, 503\);/, 'subscription checkout must fail closed when the subscription ID is missing');
assert.match(webhook, /const sub = await fetchStripeSubscription\(subscriptionId\);/, 'webhook must resolve the authoritative Stripe subscription');
assert.match(webhook, /if \(!sub\)\s*\{[\s\S]*?return json\(\{ error: "stripe_lookup_failed" \}, 503\);/, 'webhook must remain retryable when authoritative Stripe lookup fails');
assert.doesNotMatch(webhook, /periodEndSeconds\(sub \|\| obj\.subscription\)/, 'checkout entitlement must not fall back to unvalidated checkout subscription data');

console.log('Stripe checkout subscription guard: PASS');
