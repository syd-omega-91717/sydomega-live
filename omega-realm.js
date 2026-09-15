/* ========================================================================== 
   Ω SYD OMEGA 91717 — REALM COMPATIBILITY ADAPTER

   omega-sculpture.js is the sole WebGL owner. This file preserves the legacy
   OmegaRealm API used by realm/profile/identity/dashboard/ascension/character
   without creating a second Three.js renderer or WebGL context.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaRealm) return;

  /* Keep the published shape consumed by OmegaSculpture and existing callers. */
  var PALETTE = {
    Fire:  { core:'#FF6B35', mid:'#C9A84C', outer:'#8B0000', bg:'#1A0800' },
    Water: { core:'#00E5FF', mid:'#0077FF', outer:'#003366', bg:'#00060F' },
    Wind:  { core:'#E0E0E0', mid:'#90CAF9', outer:'#546E7A', bg:'#080C10' },
    Metal: { core:'#E2C86D', mid:'#C9A84C', outer:'#5D4037', bg:'#0A0800' },
    Sand:  { core:'#FFD54F', mid:'#C9A84C', outer:'#A1887F', bg:'#0E0A00' },
    Soul:  { core:'#CE93D8', mid:'#9B6BF0', outer:'#4A148C', bg:'#060010' },
    Space: { core:'#00E5FF', mid:'#7C4DFF', outer:'#1A0033', bg:'#000005' },
    Void:  { core:'#334466', mid:'#1A1A2E', outer:'#0A0A0F', bg:'#000000' },
    'The All': { core:'#E2C86D', mid:'#3fb27f', outer:'#9B6BF0', bg:'#050510' },
    'The Ninth': { core:'#E2C86D', mid:'#3fb27f', outer:'#9B6BF0', bg:'#050510' }
  };

  var current = 'Void';
  var target = null;
  var scene = null;
  var scriptPromise = null;

  function normalize(value) {
    var raw = String(value || 'Void');
    var keys = Object.keys(PALETTE);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === raw.toLowerCase()) return keys[i];
    }
    return 'Void';
  }

  function loadSculpture() {
    if (window.OmegaSculpture) return Promise.resolve(window.OmegaSculpture);
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src*="/omega-sculpture.js"]');
      if (existing) {
        if (window.OmegaSculpture) return resolve(window.OmegaSculpture);
        existing.addEventListener('load', function () { resolve(window.OmegaSculpture); }, { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      var script = document.createElement('script');
      script.src = '/omega-sculpture.js';
      script.defer = true;
      script.setAttribute('data-omega-sculpture-runtime', '1');
      script.onload = function () { resolve(window.OmegaSculpture); };
      script.onerror = reject;
      (document.head || document.documentElement).appendChild(script);
    });
    return scriptPromise;
  }

  function configure(host) {
    host.setAttribute('data-omega-sculpture', 'elements');
    host.setAttribute('data-sculpt-element', current);
    host.setAttribute('data-sculpt-accent', PALETTE[current].core);
    host.setAttribute('data-sculpt-label', 'Omega element realm: ' + current);
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', 'Omega element realm: ' + current);
  }

  function mount(host, elem) {
    if (!host) return Promise.resolve(null);
    current = normalize(elem || current);
    target = host;

    /* Preserve every legacy id/selector while converting the old canvas
       contract to the canonical sculpture mount. */
    if (host.tagName && host.tagName.toLowerCase() === 'canvas') {
      var replacement = document.createElement('div');
      replacement.id = host.id;
      replacement.className = (host.className || '') + ' omega-realm-scene';
      if (host.getAttribute('style')) replacement.setAttribute('style', host.getAttribute('style'));
      host.parentNode.replaceChild(replacement, host);
      target = replacement;
    }

    configure(target);
    return loadSculpture().then(function (api) {
      if (!api || typeof api.mount !== 'function') throw new Error('OmegaSculpture unavailable');
      api.mount(target);
      scene = target;
      return api;
    }).catch(function (error) {
      console.warn('[OmegaRealm] canonical sculpture load failed', error);
      return null;
    });
  }

  function unmount() {
    if (scene && scene.parentNode) scene.remove();
    scene = null;
    target = null;
  }

  function setElement(elem) {
    current = normalize(elem);
    if (!target) return;
    configure(target);
    /* Recompose the canonical mount so a realm element change is visual, not
       merely metadata. The renderer still belongs exclusively to Sculpture. */
    target.innerHTML = '';
    loadSculpture().then(function (api) {
      if (api && typeof api.mount === 'function') api.mount(target);
    }).catch(function (error) {
      console.warn('[OmegaRealm] element update failed', error);
    });
  }

  window.OmegaRealm = {
    mount: mount,
    unmount: unmount,
    setElement: setElement,
    isActive: function () { return !!scene; },
    palette: PALETTE,
    canonicalRenderer: 'OmegaSculpture'
  };
})();
