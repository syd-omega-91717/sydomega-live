/* ============================================================================
   SYD OMEGA 91717 -- USER APPEARANCE
   Lets a verified member personalize their view: background colour, text
   colour, and font style. Choices are saved per-device and applied on every
   page via bg.js. Set from Settings -> Appearance. Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaAppearance) return;
  window.__omegaAppearance = 1;

  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }

  var FONTS = {
    modern:  "'Rajdhani', sans-serif",
    mono:    "'Courier Prime', monospace",
    classic: "'Cinzel Decorative', serif"
  };

  function apply() {
    var bg = get('omega_bg'), tx = get('omega_text'), ft = get('omega_font');
    var css = '';
    if (bg) css += 'body{background:' + bg + ' !important}';
    if (tx) css += 'body,p,span,div,td,th,li,h1,h2,h3,h4,label{color:' + tx + ' !important}';
    if (ft && FONTS[ft]) css += 'body,button,input,select{font-family:' + FONTS[ft] + ' !important}';
    var old = document.getElementById('omega-appearance');
    if (old) old.remove();
    if (css) {
      var s = document.createElement('style');
      s.id = 'omega-appearance';
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    }
  }
  apply();

  // API used by the Settings page
  window.OmegaAppearance = {
    get: function () { return { bg: get('omega_bg'), text: get('omega_text'), font: get('omega_font') }; },
    set: function (bg, text, font) {
      try {
        if (bg !== undefined)   localStorage.setItem('omega_bg', bg || '');
        if (text !== undefined) localStorage.setItem('omega_text', text || '');
        if (font !== undefined) localStorage.setItem('omega_font', font || '');
      } catch (e) {}
      apply();
    },
    reset: function () {
      try { ['omega_bg', 'omega_text', 'omega_font'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
      var old = document.getElementById('omega-appearance'); if (old) old.remove();
    }
  };
})();
