const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('cosmos.html', 'utf8');
const js = fs.readFileSync('omega-cosmos-native.js', 'utf8');

assert(html.includes('data-cosmos-native-state'), 'COSMOS native state mount is missing');
assert(html.includes('/omega-cosmos-native.js'), 'COSMOS native module is not loaded');
assert(html.includes('LIVE'), 'COSMOS LIVE truth state is missing');
assert(html.includes('EMPTY'), 'COSMOS EMPTY truth state is missing');
assert(html.includes('UNAVAILABLE'), 'COSMOS UNAVAILABLE truth state is missing');

assert(js.includes("from('profiles')"), 'Native projection must read the canonical profiles table');
assert(js.includes("select('sign,axis_a,axis_b,axis_c,element,display_name')"), 'Canonical profile projection fields are incomplete');
assert(js.includes("render('LIVE'"), 'LIVE state is not implemented');
assert(js.includes("render('EMPTY'"), 'EMPTY state is not implemented');
assert(js.includes("render('UNAVAILABLE'"), 'UNAVAILABLE state is not implemented');

assert(!/Level\s*1|0\s*points|default.*mastery/i.test(js), 'Synthetic/default state must not be introduced');

console.log('COSMOS native consolidation contract: PASS');
