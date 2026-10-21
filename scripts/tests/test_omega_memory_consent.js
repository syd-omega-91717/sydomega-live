const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('omega-memory.js', 'utf8');
const privacySource = fs.readFileSync('privacy.html', 'utf8');
assert(privacySource.includes('var granted=!!(rec&&rec.granted===true);'), 'missing consent records must default to denied');
assert(!privacySource.includes('var granted=rec?rec.granted:true;'), 'privacy UI must never default missing consent to granted');
assert(privacySource.includes('if(cr.error)throw cr.error;'), 'consent lookup errors must enter the fail-closed UI path');
assert(source.includes("from('omega_personal_context_preferences')"), 'AI memory must use the dedicated AI personalization preference');
assert(source.includes('hasAiPersonalizationConsent'), 'memory permission check must use the canonical consent function');
assert(!source.includes('hasPersonalisationConsent'), 'no stale legacy consent function calls may remain');
assert(!source.includes("from('consent_records')"), 'legacy presence/activity consent must not authorize AI memory');
const contextSource = fs.readFileSync('omega-personal-context.js', 'utf8');
assert(contextSource.includes("type:'ai_personalization'"), 'personal context must synchronize the canonical AI consent state');

function makeStorage(seed) {
  const data = new Map(Object.entries(seed || {}));
  return {
    get length() { return data.size; },
    key(i) { return Array.from(data.keys())[i] || null; },
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    has(k) { return data.has(k); }
  };
}

function makeClient() {
  const rows = [];
  let aiPersonalization = false;
  let preferenceError = false;
  function query(table) {
    const q = { table, filters: {}, mode: 'select' };
    q.select = function() { this.mode = 'select'; return this; };
    q.eq = function(k, v) { this.filters[k] = v; return this; };
    q.is = function(k, v) { this.filters[k] = v; return this; };
    q.order = function() { return this; };
    q.limit = async function() {
      const found = rows.filter(row => Object.entries(this.filters).every(([k,v]) => row[k] === v));
      return { data: found.slice(0, 10).map(row => ({...row})), error: null };
    };
    q.maybeSingle = async function() {
      if (this.table === 'omega_personal_context_preferences') {
        return {
          data: preferenceError ? null : (aiPersonalization ? {user_id:this.filters.user_id,ai_personalization_enabled:true} : null),
          error: preferenceError ? {message:'unavailable'} : null
        };
      }
      const row = rows.find(row => Object.entries(this.filters).every(([k,v]) => row[k] === v));
      return { data: row ? {...row} : null, error: null };
    };
    q.upsert = async function(row) {
      const i = rows.findIndex(x => x.user_id === row.user_id && x.memory_key === row.memory_key);
      if (i >= 0) rows[i] = {...row}; else rows.push({...row});
      return { data: row, error: null };
    };
    q.delete = function() { this.mode = 'delete'; return this; };
    q.like = function(k, v) { this.filters[k] = v; return this; };
    q.then = function(resolve, reject) {
      if (this.mode === 'delete') {
        for (let i = rows.length - 1; i >= 0; i--) {
          const row = rows[i];
          const matches = Object.entries(this.filters).every(([k,v]) =>
            k === 'memory_key' ? row[k].startsWith(String(v).replace(/%$/, '')) : row[k] === v
          );
          if (matches) rows.splice(i, 1);
        }
      }
      return Promise.resolve({data:null,error:null}).then(resolve,reject);
    };
    return q;
  }
  return {
    from: query,
    rows,
    setAiPersonalization(v) { aiPersonalization = v; preferenceError = false; },
    setPreferenceError(v) { preferenceError = v; }
  };
}

function load(seed) {
  const listeners = {};
  const storage = makeStorage(seed);
  const client = makeClient();
  const win = {__omegaSb:client};
  const document = {addEventListener(name, fn) { listeners[name] = fn; }};
  vm.runInNewContext(source, {
    window: win, document, sessionStorage: storage,
    location: {pathname:'/life.html'}, Date, Math, JSON, Object, String, Number
  });
  return {
    api: win.OmegaMemory, client, storage,
    emit(name, detail) { if (listeners[name]) listeners[name]({detail}); }
  };
}

async function settle() { await Promise.resolve(); await new Promise(resolve => setImmediate(resolve)); }

(async function main() {
  const denied = load({'omega_mem_secret':'{"value":"previous-user-secret"}'});
  denied.emit('omega:populated', {profile:{id:'user-a', display_name:'A'}});
  await settle();
  assert.strictEqual(denied.storage.has('omega_mem_secret'), false, 'legacy unscoped browser memory must be removed');
  assert.strictEqual(await denied.api.store('private-note', 'secret'), false, 'write without consent must be rejected');
  assert.deepStrictEqual(Array.from(await denied.api.recall(10)), [], 'recall without consent must be empty');
  assert.strictEqual(denied.client.rows.length, 0, 'no-consent profile event must not persist profile-derived memory');

  const allowed = load();
  allowed.client.setAiPersonalization(true);
  allowed.emit('omega:populated', {profile:{id:'user-a', display_name:'A'}});
  await settle();
  assert.strictEqual(await allowed.api.store('user-note', 'remember only for me'), true, 'explicitly consented write should persist');
  const aRows = Array.from(await allowed.api.recall(20));
  assert(aRows.some(row => row.key === 'user-note' && row.content === 'remember only for me'), 'consented memory should be readable by its owner');

  allowed.emit('omega:populated', {profile:{id:'user-b', display_name:'B'}});
  await settle();
  const bRows = Array.from(await allowed.api.recall(20));
  assert(!bRows.some(row => row.key === 'user-note' && row.content === 'remember only for me'), 'memory must not cross account boundaries');

  allowed.emit('omega:populated', {profile:{id:'user-a', display_name:'A'}});
  await settle();
  allowed.client.setAiPersonalization(false);
  allowed.emit('omega:consent-changed', {type:'ai_personalization',granted:false});
  assert.deepStrictEqual(Array.from(await allowed.api.recall(10)), [], 'revoking AI personalization must immediately block memory retrieval');
  assert.strictEqual(allowed.storage.has('omega_mem_v2_user-a_user-note'), false, 'revoking AI personalization must clear user-scoped browser memory');
  assert.strictEqual(await allowed.api.store('after-revoke', 'blocked'), false, 'revoking AI personalization must block subsequent writes');

  const unavailable = load();
  unavailable.client.setPreferenceError(true);
  unavailable.emit('omega:populated', {profile:{id:'user-c', display_name:'C'}});
  await settle();
  assert.strictEqual(await unavailable.api.store('blocked', 'no'), false, 'consent lookup errors must fail closed');
  assert.deepStrictEqual(Array.from(await unavailable.api.recall(10)), [], 'consent lookup errors must not expose memory');

  console.log('OMEGA_MEMORY_CONSENT=PASS');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
