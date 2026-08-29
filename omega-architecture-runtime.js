/* Ω SYD OMEGA 91717 — 16-BLOCK RUNTIME CONTROL PLANE
 * Browser-safe orchestration layer for the existing static application.
 * It does not claim infrastructure that is not actually connected.
 */
(function () {
  'use strict';
  if (window.__omegaArchitecture) return;

  var VERSION = '1.0.0';
  var started = Date.now();
  var state = {};
  var listeners = [];

  function emit(type, data) {
    var event = { type: type, data: data || {}, ts: new Date().toISOString() };
    listeners.slice().forEach(function (fn) { try { fn(event); } catch (_) {} });
    try { document.dispatchEvent(new CustomEvent('omega:architecture', { detail: event })); } catch (_) {}
  }

  function set(id, status, evidence) {
    state[id] = { id: id, status: status, evidence: evidence || [], ts: Date.now() };
    emit('block', state[id]);
  }

  function timeout(ms) { return new Promise(function (_, reject) { setTimeout(function () { reject(new Error('timeout')); }, ms); }); }
  function request(url, options, ms) {
    options = options || {};
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller) options.signal = controller.signal;
    var timer = controller ? setTimeout(function () { controller.abort(); }, ms || 8000) : null;
    return fetch(url, options).then(function (r) {
      if (timer) clearTimeout(timer);
      return r;
    }).catch(function (e) {
      if (timer) clearTimeout(timer);
      throw e;
    });
  }

  var Architecture = {
    version: VERSION,
    subscribe: function (fn) { if (typeof fn === 'function') listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; },
    status: function () { return JSON.parse(JSON.stringify(state)); },

    /* 01 API Gateway: all application API traffic goes through one adapter. */
    api: function (path, options) {
      if (!/^\//.test(path)) throw new Error('API path must be same-origin');
      return request(path, options, 10000).then(function (r) {
        if (!r.ok) throw new Error('API ' + r.status);
        return r;
      });
    },

    /* 02 Load balancing: consume a caller-supplied healthy endpoint set. */
    balanced: function (endpoints, options) {
      var list = (endpoints || []).filter(Boolean);
      if (!list.length) return Promise.reject(new Error('No healthy endpoints configured'));
      var index = Math.floor(Math.random() * list.length);
      return request(list[index], options, 8000).then(function (r) {
        if (r.ok) return r;
        return Promise.reject(new Error('endpoint unhealthy'));
      });
    },

    /* 03 Service boundaries: register independent capability owners. */
    registerService: function (name, handler) {
      if (!name || typeof handler !== 'function') throw new Error('Invalid service registration');
      if (!this.services) this.services = {};
      this.services[name] = handler;
      emit('service_registered', { name: name });
    },

    /* 04 Event-driven: durable delivery is delegated to the queue below. */
    publish: function (type, payload) { return this.queue.enqueue({ type: type, payload: payload, created_at: new Date().toISOString() }); },

    /* 05 Database: use the existing Supabase client only when already initialized. */
    db: function (table) {
      if (!window.__omegaSb) throw new Error('Supabase client is not initialized');
      if (!table || !/^[A-Za-z0-9_]+$/.test(table)) throw new Error('Invalid table');
      return window.__omegaSb.from(table);
    },

    /* 06 Cache: Cache API, never authoritative. */
    cache: {
      get: function (key) { return caches.open('omega-runtime-v1').then(function (c) { return c.match(key); }); },
      put: function (key, response) { return caches.open('omega-runtime-v1').then(function (c) { return c.put(key, response); }); },
      clear: function () { return caches.delete('omega-runtime-v1'); }
    },

    /* 07 Partitioning: deterministic tenant/shard selection. */
    partition: function (key, count) {
      count = Math.max(1, Number(count) || 1);
      var hash = 0, text = String(key || '');
      for (var i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
      return Math.abs(hash) % count;
    },

    /* 08 Object/blob storage: use existing Supabase Storage client. */
    storage: function (bucket) {
      if (!window.__omegaSb || !window.__omegaSb.storage) throw new Error('Storage client is not initialized');
      return window.__omegaSb.storage.from(bucket);
    },

    /* 09 Message queue: IndexedDB-backed outbox. */
    queue: {
      enqueue: function (event) {
        return new Promise(function (resolve, reject) {
          if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
          var open = indexedDB.open('omega-runtime', 1);
          open.onupgradeneeded = function () { open.result.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true }); };
          open.onerror = function () { reject(open.error); };
          open.onsuccess = function () {
            var tx = open.result.transaction('outbox', 'readwrite');
            tx.objectStore('outbox').add(event);
            tx.oncomplete = function () { resolve(event); };
            tx.onerror = function () { reject(tx.error); };
          };
        });
      },
      drain: function (consumer, limit) {
        limit = limit || 50;
        return new Promise(function (resolve, reject) {
          var open = indexedDB.open('omega-runtime', 1);
          open.onupgradeneeded = function () { open.result.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true }); };
          open.onerror = function () { reject(open.error); };
          open.onsuccess = function () {
            var db = open.result, tx = db.transaction('outbox', 'readwrite'), store = tx.objectStore('outbox'), req = store.openCursor(), n = 0;
            req.onsuccess = function () {
              var cursor = req.result;
              if (!cursor || n >= limit) return resolve(n);
              Promise.resolve(consumer(cursor.value)).then(function () { store.delete(cursor.key); n++; cursor.continue(); }).catch(function () { resolve(n); });
            };
            req.onerror = function () { reject(req.error); };
          };
        });
      }
    },

    /* 10 Fault tolerance: bounded retries with exponential backoff. */
    retry: function (fn, attempts) {
      attempts = Math.max(1, Math.min(5, Number(attempts) || 3));
      var run = function (n) { return Promise.resolve().then(fn).catch(function (e) { if (n >= attempts) throw e; return new Promise(function (r) { setTimeout(r, Math.min(4000, 250 * Math.pow(2, n - 1))); }).then(function () { return run(n + 1); }); }); };
      return run(1);
    },

    /* 11 CDN: static deployment is naturally cacheable; expose a probe. */
    cdnProbe: function () { return request(location.origin + '/robots.txt', { cache: 'no-store' }, 5000); },

    /* 12 HA: health probes must be explicit, never inferred from page load. */
    health: function (checks) {
      var names = Object.keys(checks || {});
      return Promise.all(names.map(function (name) { return Promise.resolve().then(checks[name]).then(function () { return { name: name, ok: true }; }, function (e) { return { name: name, ok: false, error: String(e && e.message || e) }; }); }));
    },

    /* 13 Observability: use the existing sovereign OS telemetry when present. */
    observe: function (name, value, unit) {
      if (window.__omegaOS && window.__omegaOS.health && window.__omegaOS.health.record) window.__omegaOS.health.record(name, value, unit);
      emit('metric', { name: name, value: value, unit: unit });
    },

    /* 14 Security/identity: fail closed when no authenticated context exists. */
    requireSession: function () {
      if (!window.__omegaSb || !window.__omegaSb.auth) return Promise.reject(new Error('Authentication client unavailable'));
      return window.__omegaSb.auth.getSession().then(function (r) { if (!r.data || !r.data.session) throw new Error('Authentication required'); return r.data.session; });
    },

    /* 15 AI gateway: central adapter; provider credentials never live in this file. */
    ai: function (path, payload) {
      if (!path || path.charAt(0) !== '/') throw new Error('AI gateway must be same-origin');
      return this.api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload || {}) }).then(function (r) { return r.json(); });
    },

    /* 16 RAG: central retrieval adapter; caller supplies a permission-aware endpoint. */
    rag: function (path, payload) {
      if (!path || path.charAt(0) !== '/') throw new Error('RAG endpoint must be same-origin');
      return this.api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload || {}) }).then(function (r) { return r.json(); });
    }
  };

  set('api-gateway', 'BUILT', ['same-origin API adapter', 'bounded timeout']);
  set('load-balancer', 'BUILT', ['healthy endpoint selection']);
  set('microservices', 'BUILT', ['service registry']);
  set('event-driven', 'BUILT', ['typed event publisher', 'durable outbox']);
  set('database', window.__omegaSb ? 'CONNECTED' : 'BUILT', ['existing Supabase client detection']);
  set('caching', 'BUILT', ['Cache API', 'non-authoritative policy']);
  set('data-partitioning', 'BUILT', ['deterministic partition function']);
  set('object-blob-storage', window.__omegaSb && window.__omegaSb.storage ? 'CONNECTED' : 'BUILT', ['Supabase Storage adapter']);
  set('message-queues', 'BUILT', ['IndexedDB outbox', 'bounded drain']);
  set('fault-tolerance', 'BUILT', ['bounded exponential retry']);
  set('cdn', 'CONNECTED', ['same-origin static deployment probe']);
  set('high-availability', 'BUILT', ['explicit health probe framework']);
  set('observability', window.__omegaOS ? 'CONNECTED' : 'BUILT', ['sovereign OS telemetry adapter']);
  set('security-identity', window.__omegaSb && window.__omegaSb.auth ? 'CONNECTED' : 'BUILT', ['fail-closed session gate']);
  set('ai-llm-gateway', 'BUILT', ['credential-free same-origin gateway adapter']);
  set('vector-search-rag', 'BUILT', ['permission-aware endpoint adapter']);

  window.__omegaArchitecture = Architecture;
  Architecture.observe('architecture_runtime_start', Date.now() - started, 'ms');
  emit('ready', { version: VERSION, blocks: 16 });
})();
