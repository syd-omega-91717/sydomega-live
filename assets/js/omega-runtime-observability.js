/*
 * Ω Runtime Observability
 * Privacy-safe client telemetry foundation. No cookies, no keystrokes, no
 * form values and no raw query strings are collected. Data stays local unless
 * OMEGA_TELEMETRY_ENDPOINT is explicitly configured by the application.
 */
(function omegaRuntimeObservability(global) {
  'use strict';
  if (global.__OMEGA_RUNTIME_OBSERVABILITY__) return;
  global.__OMEGA_RUNTIME_OBSERVABILITY__ = true;

  var started = Date.now();
  var events = [];
  var maxEvents = 50;

  function safePath() {
    try { return global.location.pathname || '/'; } catch (_) { return '/'; }
  }

  function record(type, data) {
    var event = {
      type: String(type).slice(0, 64),
      path: safePath(),
      t: Date.now(),
      data: data || {}
    };
    events.push(event);
    if (events.length > maxEvents) events.shift();
  }

  function publish() {
    var endpoint = global.OMEGA_TELEMETRY_ENDPOINT;
    if (!endpoint || !global.navigator || !navigator.sendBeacon) return;
    try {
      navigator.sendBeacon(endpoint, new Blob([JSON.stringify({
        version: 1,
        events: events.slice(-20)
      })], { type: 'application/json' }));
    } catch (_) {}
  }

  global.addEventListener('error', function (event) {
    record('error', {
      kind: 'window',
      message: String(event && event.message || 'runtime error').slice(0, 240),
      source: String(event && event.filename || '').split('/').pop().slice(0, 120),
      line: Number(event && event.lineno || 0)
    });
  }, { passive: true });

  global.addEventListener('unhandledrejection', function (event) {
    record('error', { kind: 'promise', message: 'unhandled rejection' });
  }, { passive: true });

  if ('PerformanceObserver' in global) {
    try {
      var observer = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (entry.entryType === 'navigation') {
            record('navigation', {
              domContentLoaded: Math.round(entry.domContentLoadedEventEnd || 0),
              load: Math.round(entry.loadEventEnd || 0),
              transfer: Math.round(entry.transferSize || 0)
            });
          }
        });
      });
      observer.observe({ type: 'navigation', buffered: true });
    } catch (_) {}
  }

  global.omegaRuntime = {
    version: '1.0.0',
    startedAt: started,
    record: record,
    snapshot: function () { return events.slice(); },
    flush: publish
  };

  global.addEventListener('pagehide', publish, { passive: true });
  record('boot', { version: '1.0.0' });
})(window);
