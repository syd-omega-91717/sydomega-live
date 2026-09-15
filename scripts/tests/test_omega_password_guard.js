#!/usr/bin/env node
/* Deterministic unit checks for the password-breach compensating control. */
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const source = fs.readFileSync('omega-password-guard.js', 'utf8');
const context = {
  console,
  TextEncoder,
  AbortController,
  setTimeout,
  clearTimeout,
  crypto: { subtle: crypto.webcrypto.subtle }
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'omega-password-guard.js' });
const guard = context.OmegaPasswordGuard;
assert(guard, 'OmegaPasswordGuard must be exported');

const weak = guard.strength('short', 'member@example.com');
assert.strictEqual(weak.ok, false);
assert(weak.reasons.length >= 1);

const strong = guard.strength('Correct-Horse-91717!', 'member@example.com');
assert.strictEqual(strong.ok, true);
assert(strong.classes >= 3);

const emailDerived = guard.strength('member-Password-91717!', 'member@example.com');
assert.strictEqual(emailDerived.ok, false);

(async () => {
  const cleanHash = crypto.createHash('sha1').update('Correct-Horse-91717!').digest('hex').toUpperCase();
  const cleanPrefix = cleanHash.slice(0, 5);
  const cleanSuffix = cleanHash.slice(5);

  const originalFetch = context.fetch;
  context.fetch = async (url) => {
    assert(url.startsWith('https://api.pwnedpasswords.com/range/'));
    const sent = url.split('/').pop();
    assert.strictEqual(sent.length, 5, 'HIBP request must contain only a five-character hash prefix');
    assert.strictEqual(sent, cleanPrefix);
    return { ok: true, text: async () => 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:2\n' };
  };
  const clean = await guard.breachCheck('Correct-Horse-91717!');
  assert.deepStrictEqual(clean, { breached: false, count: 0, checked: true });

  context.fetch = async () => ({
    ok: true,
    text: async () => cleanSuffix + ':7\n'
  });
  const breached = await guard.breachCheck('Correct-Horse-91717!');
  assert.strictEqual(breached.breached, true);
  assert.strictEqual(breached.count, 7);
  assert.strictEqual(breached.checked, true);

  context.fetch = async () => { throw new Error('HIBP unavailable'); };
  const unknown = await guard.breachCheck('Correct-Horse-91717!');
  assert.deepStrictEqual(unknown, { breached: null, count: 0, checked: false });

  context.fetch = originalFetch;
  console.log('OMEGA_PASSWORD_GUARD_TEST=PASS');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
