/* ============================================================================
   SYD OMEGA 91717 -- Ω MEMBER STATE MIRROR

   Copies browser-local member data up to public.member_state so it survives a
   cleared cache, a new device, or a private window.

   NOT TO BE CONFUSED WITH omega-state.js, which is a different module: a UI
   component state machine (idle/loading/success/error/empty) owning
   window.OmegaState. This one owns window.OmegaMemberState and touches
   persistence only. The names are close because the concepts are not --
   keep them apart.

   WHY THIS EXISTS

   scripts/evidence-audit.py classifies 48 of 178 pages as LOCAL_ONLY: they
   write member data with localStorage.setItem and make no table, RPC or Edge
   Function call at all. 43 have no export path either. Everything a member
   records in achievements, notes, projects, passport, charter, mentors, lab,
   vocabulary and 26 other pages lives in exactly one browser profile, with no
   server copy and no way to get it out.

   Only the 7 finance pages were a deliberate decision (CLAUDE.md §8.2). The
   other 41 were never chosen -- they accumulated.

   ---------------------------------------------------------------------------
   THIS IS A MIRROR, NOT A SYNC -- read before changing it
   ---------------------------------------------------------------------------

   Data moves UP only. Nothing is ever written back down automatically.

   That asymmetry is the whole safety argument. A LOCAL_ONLY page reads
   localStorage synchronously while rendering; any server read is async and
   lands after. A hydrating two-way sync would therefore race the page's own
   render: the page paints from an empty cache, the member edits what they see,
   and that empty-derived write overwrites good server data. The member would
   lose real data to a feature whose entire purpose is not losing data.

   So restoring is an explicit member action (OmegaMemberState.restore), never
   automatic. The worst failure mode left is a mirror row staler than the
   browser -- the failure mode of every backup, and strictly better than
   today's "no copy exists at all".

   ---------------------------------------------------------------------------
   WHY IT POLLS INSTEAD OF HOOKING WRITES
   ---------------------------------------------------------------------------

   The obvious implementation wraps localStorage.setItem so a mirror write
   follows every page write. It was deliberately not done that way: patching
   Storage.prototype mutates a global for all 178 pages, including the ~130
   this module has no business touching, and any bug in the wrapper becomes a
   platform-wide storage bug.

   A backup does not need write-through. This reads the keys it cares about on
   an interval and when the tab is hidden or closed, hashes each value, and
   sends only what changed. Nothing global is modified, a failure here cannot
   affect a page's own storage, and the cost is bounded latency.

   ---------------------------------------------------------------------------
   GETTING THE CLIENT -- the part that already broke once
   ---------------------------------------------------------------------------

   window.OmegaSB.get() returns a PROMISE, not a client (bg.js:190-206). An
   earlier draft of this file treated it as returning the client synchronously,
   so `client.auth` was undefined and every page threw
   "Cannot read properties of undefined (reading 'getSession')" -- a repo-wide
   scan went from 3 pages with uncaught errors to 177. Resolve it, and tolerate
   it rejecting (the sandbox blocks esm.sh, and so can a flaky network).

   ---------------------------------------------------------------------------
   FAILURE BEHAVIOUR
   ---------------------------------------------------------------------------

   Supabase resolves to {data:null,error} -- it does NOT throw (CLAUDE.md §8.1
   class 1, the single most repeated root cause in this repo). Every write here
   checks .error explicitly. If the table is missing, the member is signed out,
   or a grant is absent, the mirror disables itself and records why in
   OmegaMemberState.status().reason. It never reports a success it did not get.

   The table was applied to production on 2026-08-24, so the mirror is live.
   The disable-on-42P01/42501 path is kept regardless: it is what makes the
   module safe on a branch, a fresh project, or a restored database where the
   migration has not run yet.

   ---------------------------------------------------------------------------
   WHY THE MIRROR IS NOT ENCRYPTED CLIENT-SIDE
   ---------------------------------------------------------------------------

   Considered and rejected, on key management. There is no stable client-side
   secret to derive a key from -- Supabase hands the browser a JWT, not the
   member's password -- which leaves two options, both worse than plaintext
   here:

     a random key kept in localStorage  -- dies with the very cache clear this
       feature exists to survive, producing a backup that silently fails to
       restore. That is CLAUDE.md §8.1 class 1 wearing a different hat.
     a member-remembered passphrase     -- losing it destroys the backup, and
       it needs real crypto plus a recovery flow for a 9-member platform.

   The deciding fact is that this changes no trust boundary: health_logs,
   ai_memory, family_nodes, heritage_records and bloodline_nodes already hold
   medical, genealogical and AI-memory data server-side in plaintext under the
   same RLS. That boundary was tested by member impersonation across 17 tables
   before this was applied -- every populated table scoped, zero cross-member
   reads. member_state extends a defended boundary rather than opening a new one.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaMemberState) return;

  var TABLE = 'member_state';
  var PREFIX = 'omega';
  var POLL_MS = 30000;
  var MAX_VALUE_BYTES = 512 * 1024;   // one row; larger is a page bug, not data

  /* Ephemeral or derived keys. Mirroring these would add churn and, in
     omega_cached_auth's case, copy up a value recomputed from the server
     anyway. Everything else matching PREFIX is treated as member data, so a
     new page's key is covered without editing this list. */
  var SKIP = {
    omega_bg: 1, omega_font: 1, omega_lang: 1, omega_sound: 1, omega_text: 1,
    omega_axis: 1, omega_track: 1, omega_cached_auth: 1, omega_last_online: 1,
    omega_last_gate: 1, omega_genesis_seen: 1
  };

  var state = {
    enabled: false, reason: 'not initialised', pending: 0,
    lastError: null, lastSync: null, mirrored: 0
  };
  var sent = {};        // key -> hash of the value last successfully mirrored
  var client = null;    // resolved Supabase client, or null until init succeeds
  var uid = null;
  var ticking = false;

  /* Resolves the shared client. OmegaSB.get() may return a promise (the normal
     path), and window.__omegaSb may already hold a built client if a page
     module got there first -- bg.js converges both onto the same slot. */
  function resolveClient() {
    try {
      if (window.OmegaSB && typeof window.OmegaSB.get === 'function') {
        var r = window.OmegaSB.get();
        if (r && typeof r.then === 'function') return r;
        if (r) return Promise.resolve(r);
      }
    } catch (e) {}
    if (window.__omegaSb) return Promise.resolve(window.__omegaSb);
    return Promise.reject(new Error('no supabase client published'));
  }

  function mirrored(k) {
    return typeof k === 'string' && k.indexOf(PREFIX) === 0 && !SKIP[k] &&
           k.indexOf('omega_analytics_') !== 0;
  }

  /* Cheap non-cryptographic digest, only ever compared against itself to
     answer "did this value change since the last successful upload". */
  function hash(s) {
    var h = 5381, i = s.length;
    while (i) h = (h * 33 ^ s.charCodeAt(--i)) >>> 0;
    return h.toString(36) + ':' + s.length;
  }

  /* localStorage holds strings; member_state.value is jsonb. A page's value is
     usually JSON already, so parse it and store real structure. When it is a
     bare string, store it as a JSON string scalar -- still valid jsonb -- and
     decode() puts back exactly what the page wrote. */
  function encode(raw) {
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }
  function decode(value) {
    return (typeof value === 'string') ? value : JSON.stringify(value);
  }

  function collect() {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!mirrored(k)) continue;
        var raw = localStorage.getItem(k);
        if (raw == null) continue;
        if (raw.length > MAX_VALUE_BYTES) {
          state.lastError = k + ' exceeds ' + MAX_VALUE_BYTES + ' bytes, not mirrored';
          continue;
        }
        var h = hash(raw);
        if (sent[k] === h) continue;
        out.push({ key: k, raw: raw, h: h });
      }
    } catch (e) {
      state.lastError = 'localStorage unreadable: ' + String(e && e.message || e);
    }
    return out;
  }

  function sync() {
    if (ticking || !state.enabled || !client || !uid) {
      return Promise.resolve(window.OmegaMemberState.status());
    }
    var changed = collect();
    if (!changed.length) return Promise.resolve(window.OmegaMemberState.status());

    ticking = true;
    state.pending = changed.length;

    var stamp = new Date().toISOString();
    var rows = changed.map(function (c) {
      return { user_id: uid, key: c.key, value: encode(c.raw), updated_at: stamp };
    });

    /* onConflict names the table's real primary key (user_id, key). Naming
       columns with no matching unique index raises 42P10 and the statement
       never runs; omitting onConflict lets PostgREST default to the PK and
       raise 23505 forever after the first write. Both shapes have shipped in
       this repo before (CLAUDE.md §8.1 class 7). */
    return client.from(TABLE)
      .upsert(rows, { onConflict: 'user_id,key' })
      .then(function (res) {
        ticking = false;
        state.pending = 0;
        if (res && res.error) {
          state.lastError = (res.error.code || '') + ' ' + (res.error.message || 'upsert failed');
          /* 42P01 undefined_table and 42501 insufficient_privilege are
             structural -- only a migration fixes them, so stop retrying every
             POLL_MS. Anything else may be transient, so stay enabled. */
          if (res.error.code === '42P01' || res.error.code === '42501') {
            state.enabled = false;
            state.reason = 'disabled: ' + state.lastError +
                           ' (has supabase/omega_member_state.sql been applied?)';
          }
          return window.OmegaMemberState.status();
        }
        /* Only record a key as sent after the write actually came back clean.
           Marking them optimistically would silently skip them forever after
           one failed round. */
        for (var i = 0; i < changed.length; i++) sent[changed[i].key] = changed[i].h;
        state.mirrored = Object.keys(sent).length;
        state.lastError = null;
        state.lastSync = stamp;
        return window.OmegaMemberState.status();
      }, function (err) {
        ticking = false;
        state.pending = 0;
        state.lastError = String(err && err.message || err);
        return window.OmegaMemberState.status();
      });
  }

  function init() {
    resolveClient().then(function (c) {
      if (!c || !c.auth || typeof c.auth.getSession !== 'function') {
        state.reason = 'supabase client has no auth interface';
        return;
      }
      client = c;
      return c.auth.getSession().then(function (res) {
        var s = res && res.data && res.data.session;
        if (!s || !s.user) { state.reason = 'signed out -- nothing to mirror'; return; }
        uid = s.user.id;
        state.enabled = true;
        state.reason = 'mirroring';

        sync();
        setInterval(sync, POLL_MS);

        /* A member who closes the tab right after editing should not lose that
           edit. visibilitychange fires reliably on mobile where pagehide often
           does not. */
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'hidden') sync();
        });
        window.addEventListener('pagehide', function () { sync(); });
      });
    }).catch(function (err) {
      /* Never let this module's failure surface as an uncaught rejection --
         the sandbox blocks esm.sh, and a real network can too. */
      state.reason = 'unavailable: ' + String(err && err.message || err);
    });
  }

  window.OmegaMemberState = {
    status: function () {
      return {
        enabled: state.enabled, reason: state.reason, pending: state.pending,
        mirrored: state.mirrored, lastError: state.lastError, lastSync: state.lastSync
      };
    },

    syncNow: function () { return sync(); },

    /* Explicit pull-down. Resolves to {restored, skipped, error}. Never called
       automatically -- see the header. By default it will not overwrite a key
       this browser already holds; pass {overwrite:true} to replace local
       values with the server copy. */
    restore: function (opts) {
      opts = opts || {};
      if (!client || !uid) {
        return Promise.resolve({ restored: 0, skipped: 0, error: 'not signed in' });
      }
      var q = client.from(TABLE).select('key,value').eq('user_id', uid);
      if (opts.key) q = q.eq('key', opts.key);
      return q.then(function (res) {
        if (res && res.error) return { restored: 0, skipped: 0, error: res.error.message };
        var rows = (res && res.data) || [], restored = 0, skipped = 0;
        for (var i = 0; i < rows.length; i++) {
          var k = rows[i].key;
          try {
            if (!opts.overwrite && localStorage.getItem(k) != null) { skipped++; continue; }
            localStorage.setItem(k, decode(rows[i].value));
            restored++;
          } catch (e) { skipped++; }
        }
        return { restored: restored, skipped: skipped, error: null };
      }, function (err) {
        return { restored: 0, skipped: 0, error: String(err && err.message || err) };
      });
    },

    list: function () {
      if (!client || !uid) return Promise.resolve({ rows: [], error: 'not signed in' });
      return client.from(TABLE).select('key,updated_at').eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .then(function (res) {
          if (res && res.error) return { rows: [], error: res.error.message };
          return { rows: (res && res.data) || [], error: null };
        }, function (err) {
          return { rows: [], error: String(err && err.message || err) };
        });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
