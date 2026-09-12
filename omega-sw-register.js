/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-sw-register.js

   Registers sw.js. Audit finding F-6: sw.js and manifest.json both existed,
   but no page ever registered the worker — the entire offline/caching layer
   was built and switched off.

   Includes an escape hatch. A service worker is the one piece of client code
   that can persist a broken deploy across reloads, so this exposes
   window.OmegaSW.nuke() to unregister and clear all caches. Keep it.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaSW) return;

  var API = {
    reg: null,
    version: null,
    nuke: function () {
      if (!('serviceWorker' in navigator)) return Promise.resolve();
      return navigator.serviceWorker.getRegistrations()
        .then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })
        .then(function () { return caches.keys(); })
        .then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
        .then(function () { console.warn('[OmegaSW] unregistered and caches cleared. Reload.'); });
    },
    update: function () { if (API.reg) API.reg.update(); }
  };
  window.OmegaSW = API;

  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function (reg) {
        API.reg = reg;

        // A waiting worker means a new deploy is ready. Activate it on the
        // next navigation rather than trapping members on the old version.
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

        reg.addEventListener('updatefound', function () {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function () {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              sw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Check for a new worker periodically on long-lived tabs.
        setInterval(function () { reg.update(); }, 60 * 60 * 1000);
      })
      .catch(function (err) {
        console.warn('[OmegaSW] registration failed:', err && err.message);
      });

    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'VERSION') API.version = e.data.version;
    });

    /* An in-memory flag here only blocks a double-fire within THIS page
       instance -- it resets on every fresh load, so it cannot stop
       controllerchange firing again on the reloaded page itself, which is
       exactly what a real reload loop looks like. sessionStorage survives
       the reload; a genuine one-time update still gets its single reload,
       but a second controllerchange within the window is refused instead
       of compounding. */
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return;
      reloading = true;
      try {
        var k = 'omega_sw_reload_at';
        var last = +sessionStorage.getItem(k) || 0;
        if (Date.now() - last < 10000) {
          console.error('[OmegaSW] controllerchange fired again within 10s of the last reload -- stopping to avoid a reload loop. Call OmegaSW.nuke() if the page looks stale.');
          return;
        }
        sessionStorage.setItem(k, String(Date.now()));
      } catch (e) {}
      location.reload();
    });
  });
})();
