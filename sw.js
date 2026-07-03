/* ============================================================================
   SYD OMEGA 91717 -- Service Worker
   v4: NETWORK-FIRST. Every deploy now reaches users immediately -- the worker
   always fetches the fresh file when online and uses the cache only as an
   offline fallback. This ends the "I deployed but the site looks the same"
   problem caused by the old cache-first (cached || network) strategy.
   Supabase and cross-origin requests are never cached.
   NOTE: bump CACHE (v4 -> v5 -> ...) on any future deploy to force a clean
   cache reset for returning users.
   ============================================================================ */
const CACHE = 'omega-v6';
const STATIC = ['/', '/index.html', '/bg.js', '/nav.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC.map(u => {
      try { return new Request(u, { cache: 'reload' }); } catch (x) { return u; }
    }))).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('supabase.co')) return;               // never touch the API
  try { if (new URL(req.url).origin !== location.origin) return; } catch (x) { return; }

  // NETWORK-FIRST: always try the fresh file; fall back to cache only offline.
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
