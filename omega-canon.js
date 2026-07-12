/* ============================================================================
   SYD OMEGA 91717 -- CANON LOADER (single source of truth, global)
   Loads omega-canon.json + omega-elements.json once and exposes them to every
   page, so nothing is ever redefined (no duplication). Any page can read the 12
   named medals/trophies/certificates/gods/gates/tokens/agents and the 9 elements
   from ONE place: window.OmegaCanon. Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaCanonLoader) return;
  window.__omegaCanonLoader = 1;

  var api = {
    ready: false, tracks: [], elements: [], _cbs: [],
    onReady: function (cb) { if (this.ready) cb(this); else this._cbs.push(cb); },
    track: function (n) { return this.tracks[(n - 1)] || null; },
    medal: function (n) { var t = this.track(n); return t ? t.medal : null; },
    trophy: function (n) { var t = this.track(n); return t ? t.trophy : null; },
    certificate: function (n) { var t = this.track(n); return t ? t.certificate : null; },
    god: function (n) { var t = this.track(n); return t ? t.god : null; },
    gate: function (n) { var t = this.track(n); return t ? t.gate : null; },
    sign: function (n) { var t = this.track(n); return t ? t.sign : null; },
    elementFor: function (sign) { var e = (this.signElement || {})[sign]; return e || null; }
  };
  window.OmegaCanon = api;

  Promise.all([
    fetch('/omega-canon.json').then(function (r) { return r.json(); }).catch(function () { return null; }),
    fetch('/omega-elements.json').then(function (r) { return r.json(); }).catch(function () { return null; })
  ]).then(function (res) {
    var canon = res[0], els = res[1];
    if (canon) { api.tracks = canon.tracks || []; api.structure = canon.structure; api.elementSystem = canon.element_system; }
    if (els) { api.elements = els.elements || []; api.signElement = els.sign_element || {}; }
    api.ready = true;
    api._cbs.forEach(function (cb) { try { cb(api); } catch (e) {} });
    document.dispatchEvent(new CustomEvent('omega-canon-ready', { detail: api }));
  });
})();
