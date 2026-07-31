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
      api.nineFold = canon.nine_fold || null;
      /* Guard: both lattices must satisfy their formulas exactly.
         twelve-fold = 12 x 12 x 9 x 9 x 9 = 104,976
         nine-fold   = 9 x 9 x 9 x 9 x 9   =  59,049
         If either drifts, log immediately rather than shipping a wrong
         node count into the UI. */
      (function () {
        var T = api.structure && Number(api.structure.total_nodes);
        var N = api.nineFold && Number(api.nineFold.total_nodes);
        if (T && T !== 12 * 12 * 9 * 9 * 9)
          console.error('OmegaCanon: twelve-fold total_nodes is ' + T + ', expected ' + (12 * 12 * 9 * 9 * 9));
        if (N && N !== Math.pow(9, 5))
          console.error('OmegaCanon: nine-fold total_nodes is ' + N + ', expected ' + Math.pow(9, 5));
        /* the apex must stay consistent with the axis count: sqrt(depth^2 * axes) */
        var ax = api.structure && Number(api.structure.axes);
        var dp = api.structure && Number(api.structure.axis_depth);
        var apex = api.structure && Number(api.structure.authority_apex);
        if (ax && dp && apex) {
          /* AUTH = sqrt(A³+B³+C³)×φ/e; at max depth each axis = dp,
             so apex = sqrt(dp³ × axes) × φ/e */
          var PHI_C = 1.6180339887, EU_C = 2.7182818285;
          var expect = Math.sqrt(Math.pow(dp, 3) * ax) * PHI_C / EU_C;
          if (Math.abs(expect - apex) > 0.001)
            console.error('OmegaCanon: authority_apex is ' + apex + ' but ' + ax +
                          ' axes at depth ' + dp + ' give ' + expect.toFixed(3));
        }
      })();
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
    /* Fill any element marked data-canon-nodes="nine" | "twelve" with the
       canonical node count, so a displayed figure can never drift from canon. */
    try {
      var map = {
        nine:   api.nineFold   && api.nineFold.total_nodes,
        twelve: api.structure  && api.structure.total_nodes,
        /* non-standard lattices (B requirements) */
        '28': 28*28*9*9*9,
        '21': 21*21*9*9*9,
        '18': 18*18*9*9*9
      };
      /* data-canon-lattice="twelve|nine" -> the FULL formula + node count that
         EVERY individual member of that system carries (fractal rule, see
         structure.per_member_rule). Used on each gate, agent, sign, token,
         NFT line, article, phase and outer layer. */
      try {
        var lat = document.querySelectorAll('[data-canon-lattice]');
        for (var L = 0; L < lat.length; L++) {
          var kind = lat[L].getAttribute('data-canon-lattice');
          var nodes = kind === 'nine' ? (api.nineFold && api.nineFold.total_nodes)
                                      : (api.structure && api.structure.total_nodes);
          var formula = kind === 'nine' ? '9\u00d79\u00d79\u00d79\u00d79'
                                        : '12\u00d712\u00d79\u00d79\u00d79';
          if (nodes) lat[L].textContent = formula + ' \u00b7 ' +
                       Number(nodes).toLocaleString('en-US') + ' NODES';
        }
      } catch (e) {}

      var els = document.querySelectorAll('[data-canon-nodes]');
      for (var i = 0; i < els.length; i++) {
        var v = map[els[i].getAttribute('data-canon-nodes')];
        if (v) els[i].textContent = Number(v).toLocaleString('en-US');
      }
    } catch (e) {}

    api.ready = true;
    api._cbs.forEach(function (cb) { try { cb(api); } catch (e) {} });
    document.dispatchEvent(new CustomEvent('omega-canon-ready', { detail: api }));
  });
})();
