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
    ready: false, tracks: [], elements: [], tiers: [], tierFeatures: {}, _cbs: [],
    onReady: function (cb) { if (this.ready) cb(this); else this._cbs.push(cb); },
    track: function (n) { return this.tracks[(n - 1)] || null; },
    trackBySign: function (sign) {
      if (!sign) return null;
      var s = String(sign).toLowerCase();
      for (var i = 0; i < this.tracks.length; i++) {
        if (String(this.tracks[i].sign || '').toLowerCase() === s) return this.tracks[i];
      }
      return null;
    },
    medal: function (n) { var t = this.track(n); return t ? t.medal : null; },
    trophy: function (n) { var t = this.track(n); return t ? t.trophy : null; },
    certificate: function (n) { var t = this.track(n); return t ? t.certificate : null; },
    god: function (n) { var t = this.track(n); return t ? t.god : null; },
    gate: function (n) { var t = this.track(n); return t ? t.gate : null; },
    sign: function (n) { var t = this.track(n); return t ? t.sign : null; },
    elementFor: function (sign) { var e = (this.signElement || {})[sign]; return e || null; },
    tier: function (n) { return this.tiers[(n - 1)] || null; },
    // does membership_tier n unlock featureKey? tiers cascade (each tier keeps everything below it).
    tierUnlocks: function (memberTierNum, featureKey) {
      var n = Number(memberTierNum) || 0;
      for (var i = 0; i < n && i < this.tiers.length; i++) {
        var u = this.tiers[i].unlocks || [];
        if (u.indexOf(featureKey) !== -1 || u.indexOf('all') !== -1) return true;
      }
      return false;
    },
    // first tier number (1-9) that unlocks featureKey, for "upgrade to Seeker" style messaging
    tierRequiredFor: function (featureKey) {
      for (var i = 0; i < this.tiers.length; i++) {
        var u = this.tiers[i].unlocks || [];
        if (u.indexOf(featureKey) !== -1) return this.tiers[i].n;
      }
      return null;
    }
  };
  window.OmegaCanon = api;

  Promise.all([
    fetch('/omega-canon.json').then(function (r) { return r.json(); }).catch(function () { return null; }),
    fetch('/omega-elements.json').then(function (r) { return r.json(); }).catch(function () { return null; })
  ]).then(function (res) {
    var canon = res[0], els = res[1];
    if (canon) {
      api.tracks = canon.tracks || []; api.structure = canon.structure; api.elementSystem = canon.element_system;
      api.economy = canon.economy || null;
      /* Guard: the master vault must be exactly 51% of total supply. The Charter
         once published a supply that yielded 50.988%. If these ever drift apart
         again this logs immediately instead of shipping a wrong constitutional
         figure to members. */
      if (api.economy) {
        var _s = Number(api.economy.total_supply), _v = Number(api.economy.master_vault),
            _p = Number(api.economy.master_vault_pct);
        if (_s && _v && Math.round(_s * _p / 100) !== _v) {
          console.error('OmegaCanon: economy mismatch -- ' + _p + '% of ' + _s + ' is ' +
                        Math.round(_s * _p / 100) + ', but master_vault is ' + _v);
        }
      }
      api.tiers = canon.tiers || []; api.tierFeatures = canon.tier_features || {};
      api.loreLattice = canon.lore_lattice || null;
    }
    if (els) { api.elements = els.elements || []; api.signElement = els.sign_element || {}; }
    api.ready = true;
    api._cbs.forEach(function (cb) { try { cb(api); } catch (e) {} });
    document.dispatchEvent(new CustomEvent('omega-canon-ready', { detail: api }));
  });
})();
