/* Static contract: VAULT native projection must remain truth-first and read-only. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'vault.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'omega-vault-native.js'), 'utf8');

function assert(ok, message) {
  if (!ok) throw new Error('VAULT native consolidation: ' + message);
}

assert(html.includes('data-vault-native-state'), 'native state mount is missing');
assert(html.includes('/omega-vault-native.js'), 'native module is not loaded');
assert(js.includes('LIVE') && js.includes('EMPTY') && js.includes('UNAVAILABLE') && js.includes('PLANNED'), 'truth states are incomplete');
assert(js.includes("from('profiles')"), 'canonical profile source is missing');
assert(js.includes("from('task_completions')"), 'canonical task-completion source is missing');
assert(js.includes("from('user_assets')"), 'canonical asset source is missing');
assert(js.includes("select('id,display_name,is_owner,access_approved,is_trial,trial_expires_at,axis_a,axis_b,axis_c')"), 'profile field contract is missing');
assert(!/wallet-total.*=.*[0-9]|467,756,700,000|default.*balance/i.test(js), 'native module must not manufacture financial balances');
assert(!/insert\(|update\(|upsert\(|delete\(/.test(js), 'native module must remain read-only');
console.log('VAULT native consolidation contract: PASS');
