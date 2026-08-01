/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN SERVICE WORKER  (v5)

   REPLACES the existing sw.js, which was never registered by any page.
   Three defects in v3 are fixed here — register that version and you would
   have shipped a caching bug to every member at once.

   FIXED — 1. CACHE-FIRST ON HTML (critical)
     v3 served every non-Supabase request cache-first, including .html pages.
     Once a member loaded dashboard.html it was frozen at that version until
     CACHE_NAME changed. You would ship a fix and nobody would receive it, with
     no way to tell them how to clear it. v4 uses network-first for HTML and
     navigations (stale-while-revalidate as fallback), cache-first only for
     genuinely static assets.

   FIXED — 2. NULL ACCEPT HEADER (crash)
     v3 called e.request.headers.get('accept').includes(...). When the Accept
     header is absent that is a TypeError inside the fetch handler, which fails
     the request entirely. v4 guards it.

   FIXED — 3. PRECACHE OF A NON-EXISTENT FILE
     v3 precached '/omega-tokens.json', which does not exist in the repository.
     Silently swallowed, but it meant the precache list was never verified.
     Removed. Keep this list honest — CI checks it.

   ADDED — version reporting, cross-origin exclusion, and an explicit
   SKIP_WAITING message channel so you can push an update without waiting for
   every tab to close.

   Registered by omega-sw-register.js, which bg.js injects.
   ========================================================================== */

var CACHE_VERSION = 'v7';
var CACHE_NAME    = 'omega-91717-' + CACHE_VERSION;

/* Static shell only. Every entry must exist in the repository — the CI
   "Broken local asset references" step will fail the build if one does not. */
var CORE_ASSETS = [
  '/404.html',
  '/offline.html',
  '/bg.js',
  '/nav.js',
  '/omega-shell.js',
  '/omega-user.js',
  '/omega-matrix.js',
  '/omega-chrono.js',
  '/omega-sdt.js',
  '/omega-search.js',
  '/omega-notify.js',
  '/omega-canon.js',
  '/omega-canon.json',
  '/omega-page-emblem.js',
  '/manifest.json',
  '/favicon.ico'
];

/* Never cache: auth, live data, anything with a query string. */
function isNeverCache(url) {
  return url.includes('supabase.co') ||
         url.includes('api.anthropic') ||
         url.includes('esm.sh') ||
         url.includes('/auth/') ||
         url.indexOf('?') > -1;
}

function isHtml(request) {
  if (request.mode === 'navigate') return true;
  var accept = request.headers.get('accept') || '';   // guard: may be null
  return accept.indexOf('text/html') > -1;
}

/* ------------------------------------------------------------------ install */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // allSettled + per-asset catch: one missing file must not abort install.
      return Promise.allSettled(
        CORE_ASSETS.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn('[sw] precache failed:', url, err && err.message);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

/* ----------------------------------------------------------------- activate */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (n) { return n !== CACHE_NAME; })
          .map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* -------------------------------------------------------------------- fetch */
self.addEventListener('fetch', function (e) {
  var req = e.request;

  // Only handle GET. POST/PATCH/DELETE must always hit the network.
  if (req.method !== 'GET') return;

  var url = req.url;

  // Same-origin only. Do not intercept third-party requests.
  if (new URL(url).origin !== self.location.origin) {
    if (isNeverCache(url)) {
      e.respondWith(
        fetch(req).catch(function () { return caches.match(req); })
      );
    }
    return;
  }

  if (isNeverCache(url)) {
    e.respondWith(fetch(req).catch(function () { return caches.match(req); }));
    return;
  }

  /* HTML — NETWORK FIRST. This is the v3 bug fix. Members always get the
     current page when online; the cache is a fallback for offline only. */
  if (isHtml(req)) {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(req, clone); });
          }
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match('/offline.html') || caches.match('/404.html');
          });
        })
    );
    return;
  }

  /* Static assets — cache first, revalidate in the background so an updated
     bg.js propagates on the next load rather than never. */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req)
        .then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(req, clone); });
          }
          return res;
        })
        .catch(function () { return cached; });
      return cached || network;
    })
  );
});

/* ----------------------------------------------------------------- messages */
self.addEventListener('message', function (e) {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data.type === 'GET_VERSION' && e.source) {
    e.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  }
  if (e.data.type === 'CLEAR_CACHE') {
    caches.keys().then(function (names) {
      names.forEach(function (n) { caches.delete(n); });
    });
  }
});
