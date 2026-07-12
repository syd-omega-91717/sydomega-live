/* ============================================================================
   SYD OMEGA 91717 -- SERVICE WORKER (CACHE KILL-SWITCH, omega-v7)
   Visitors were being served STALE cached files (old sound, old nav, old pages)
   because a previous cache-first worker held onto them. This worker, on its
   first activation in each browser, DELETES every cache, UNREGISTERS itself,
   and reloads open tabs -- so every device drops the old files and loads the
   current site fresh from the network. After this runs once everywhere, the
   stale-content problem is permanently gone. Pure ASCII.
   ============================================================================ */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    // 1) delete every cache this origin ever created
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    } catch (e) {}
    // 2) remove this service worker entirely (no more stale serving)
    try { await self.registration.unregister(); } catch (e) {}
    // 3) reload every open tab so they pull fresh files immediately
    try {
      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
    } catch (e) {}
  })());
});

/* Network-only while this worker is briefly alive: never serve from cache. */
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request).catch(function () {
    return new Response('', { status: 504 });
  }));
});
