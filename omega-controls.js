/* ============================================================================
   SYD OMEGA 91717 -- UNIFIED CONTROL DOCK
   Relocates and consolidates LANGUAGE and SOUND into one clean, consistent
   cluster on every page (top-right), plus a quick HOME. Replaces the scattered
   floating controls with a single, discoverable, user-friendly dock. Pure ASCII
   (SVG icons, no emoji), keyboard-accessible, reduced-motion safe. Global.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaControls) return;
  window.__omegaControls = 1;

  var LANGS = [['en', 'EN'], ['ar', 'AR'], ['fr', 'FR'], ['es', 'ES']];
  var LANG_NAME = { en: 'English', ar: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', fr: 'Fran\u00E7ais', es: 'Espa\u00F1ol' };

  function curLang() { try { return localStorage.getItem('omega_lang') || 'en'; } catch (e) { return 'en'; } }
  function setLang(c) { try { localStorage.setItem('omega_lang', c); } catch (e) {} location.reload(); }
  function soundOn() { try { return localStorage.getItem('omega_sound') !== 'off'; } catch (e) { return true; } }
  function setSound(on) {
    try { localStorage.setItem('omega_sound', on ? 'on' : 'off'); } catch (e) {}
    var med = document.querySelectorAll('audio,video');
    for (var i = 0; i < med.length; i++) { try { med[i].muted = !on; if (!on) med[i].pause(); } catch (e) {} }
    try { window.dispatchEvent(new CustomEvent('omega-sound', { detail: { on: on } })); } catch (e) {}
  }

  var css = [
    '#omega-dock{position:fixed;top:10px;right:12px;z-index:9000;display:flex;gap:6px;align-items:center;font-family:"Courier Prime",monospace}',
    '.od-btn{display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border:1px solid rgba(201,168,76,.28);background:rgba(10,10,15,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#C9A84C;font-size:11px;letter-spacing:2px;border-radius:18px;cursor:pointer;transition:all .2s;line-height:0}',
    '.od-btn:hover{border-color:rgba(201,168,76,.6);color:#E2C86D;background:rgba(10,10,15,.8)}',
    '.od-btn svg{width:15px;height:15px}',
    '.od-menu{position:absolute;top:40px;right:0;min-width:150px;border:1px solid rgba(201,168,76,.28);background:rgba(8,8,14,.96);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:12px;padding:6px;display:none;flex-direction:column;gap:2px;box-shadow:0 12px 40px rgba(0,0,0,.6)}',
    '.od-menu.open{display:flex}',
    '.od-item{text-align:left;padding:9px 12px;border:0;background:none;color:#c8c5ba;font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:1px;cursor:pointer;border-radius:8px}',
    '.od-item:hover{background:rgba(201,168,76,.12);color:#E2C86D}',
    '.od-item.sel{color:#00E5FF}',
    '.od-wrap{position:relative}',
    '@media(max-width:760px){#omega-dock{top:auto;bottom:74px;right:10px}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'omega-dock-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  var ICON_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg>';
  var ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l6 6M23 9l-6 6"/></svg>';
  var ICON_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';

  function build() {
    if (document.getElementById('omega-dock')) return;
    // hide any legacy floating language switcher so we do not double up
    ['#omega-lang', '.i18n-switcher', '#lang-switch'].forEach(function (sel) {
      var e = document.querySelector(sel); if (e) e.style.display = 'none';
    });

    var dock = document.createElement('div'); dock.id = 'omega-dock';

    // language
    var lw = document.createElement('div'); lw.className = 'od-wrap';
    var lb = document.createElement('button'); lb.className = 'od-btn'; lb.type = 'button';
    lb.setAttribute('aria-label', 'Language');
    lb.innerHTML = ICON_GLOBE + '<span>' + curLang().toUpperCase() + '</span>';
    var lm = document.createElement('div'); lm.className = 'od-menu';
    LANGS.forEach(function (L) {
      var it = document.createElement('button'); it.className = 'od-item' + (L[0] === curLang() ? ' sel' : '');
      it.type = 'button'; it.textContent = LANG_NAME[L[0]];
      it.onclick = function () { setLang(L[0]); };
      lm.appendChild(it);
    });
    lb.onclick = function (e) { e.stopPropagation(); lm.classList.toggle('open'); };
    lw.appendChild(lb); lw.appendChild(lm); dock.appendChild(lw);

    // sound
    var sb = document.createElement('button'); sb.className = 'od-btn'; sb.type = 'button';
    sb.setAttribute('aria-label', 'Sound');
    function paintSound() { sb.innerHTML = soundOn() ? ICON_ON : ICON_OFF; }
    paintSound();
    sb.onclick = function () { setSound(!soundOn()); paintSound(); };
    dock.appendChild(sb);

    // home
    var hb = document.createElement('a'); hb.className = 'od-btn'; hb.href = '/dashboard.html';
    hb.setAttribute('aria-label', 'Home'); hb.innerHTML = ICON_HOME;
    dock.appendChild(hb);

    document.body.appendChild(dock);
    document.addEventListener('click', function () { lm.classList.remove('open'); });

    // apply saved sound state to any media on load
    if (!soundOn()) setSound(false);
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
