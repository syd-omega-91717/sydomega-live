/* ==========================================================================
   Ω SYD OMEGA 91717 — ACCESSIBILITY ENGINE (omega-a11y.js)
   WCAG 2.1 AA compliance layer, injected globally via bg.js.

   A. SKIP NAVIGATION LINK — "Skip to main content" appears on Tab press.
      Jumps to #app, .main, or <main> — whichever exists.
   B. FOCUS TRAP MANAGER — exported OmegaA11y.trapFocus(el) / .releaseFocus()
      for modals/overlays. Used by omega-keyboard.js help overlay, copilot, etc.
   C. LIVE REGION ANNOUNCER — OmegaA11y.announce(msg, priority) for screen readers.
      Used by omega-sdt.js gate celebrations, omega-notify.js toasts, etc.
   D. LANDMARK ARIA — ensures every page has at least one <main> landmark.
      Wraps #app in <main> role if no <main> exists.
   E. FORM LABEL AUDIT — finds <input> without <label> and adds aria-label
      from placeholder as a last-resort fallback (logs a console warning).
   F. MOTION PREFERENCE CSS — reinforce prefers-reduced-motion at the CSS layer,
      scoped to omega-* classes so it cannot accidentally undo page styles.
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaA11yActive) return;
  window.__omegaA11yActive = true;

  /* ── A. SKIP NAVIGATION LINK ────────────────────────────────────────── */
  (function(){
    if(document.getElementById('omega-skip')) return;
    var skip = document.createElement('a');
    skip.id = 'omega-skip';
    skip.href = '#omega-main-content';
    skip.textContent = 'Skip to main content';
    skip.style.cssText = [
      'position:fixed;top:-100px;left:8px;z-index:99999;',
      'background:#0A0A0F;color:#C9A84C;',
      'font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;',
      'padding:8px 16px;border:1px solid rgba(201,168,76,.4);border-radius:2px;',
      'text-decoration:none;',
      'transition:top .2s ease',
    ].join('');
    skip.addEventListener('focus', function(){ skip.style.top='8px'; });
    skip.addEventListener('blur',  function(){ skip.style.top='-100px'; });

    function attach(){
      if(!document.body) { requestAnimationFrame(attach); return; }
      document.body.insertBefore(skip, document.body.firstChild);
    }
    attach();

    /* Ensure the target exists */
    function ensureTarget(){
      if(document.getElementById('omega-main-content')) return;
      var main = document.querySelector('main') ||
                 document.querySelector('.main') ||
                 document.getElementById('app');
      if(main && !main.id) main.id = 'omega-main-content';
      else if(main && main.id !== 'omega-main-content'){
        main.setAttribute('id', main.id); /* keep existing id */
        skip.href = '#' + main.id;
      }
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', ensureTarget);
    } else { ensureTarget(); }
  })();

  /* ── B. FOCUS TRAP ──────────────────────────────────────────────────── */
  var _trapEl = null;
  var _trapPrev = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function trapFocus(el){
    if(!el) return;
    releaseFocus();
    _trapEl = el;
    _trapPrev = document.activeElement;
    var focusable = Array.from(el.querySelectorAll(FOCUSABLE));
    if(!focusable.length) return;
    focusable[0].focus();
    el.addEventListener('keydown', _trapHandler);
  }

  function _trapHandler(e){
    if(e.key !== 'Tab') return;
    var focusable = Array.from(_trapEl.querySelectorAll(FOCUSABLE));
    if(!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length-1];
    if(e.shiftKey){
      if(document.activeElement === first){ e.preventDefault(); last.focus(); }
    } else {
      if(document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }

  function releaseFocus(){
    if(_trapEl){ _trapEl.removeEventListener('keydown', _trapHandler); _trapEl = null; }
    if(_trapPrev){ try{ _trapPrev.focus(); }catch(e){} _trapPrev = null; }
  }

  /* ── C. LIVE REGION ANNOUNCER ───────────────────────────────────────── */
  var _politeRegion = null, _assertiveRegion = null;
  function getRegion(priority){
    if(priority === 'assertive'){
      if(!_assertiveRegion){
        _assertiveRegion = document.createElement('div');
        _assertiveRegion.setAttribute('role','alert');
        _assertiveRegion.setAttribute('aria-live','assertive');
        _assertiveRegion.setAttribute('aria-atomic','true');
        _assertiveRegion.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
        document.body.appendChild(_assertiveRegion);
      }
      return _assertiveRegion;
    }
    if(!_politeRegion){
      _politeRegion = document.createElement('div');
      _politeRegion.setAttribute('role','status');
      _politeRegion.setAttribute('aria-live','polite');
      _politeRegion.setAttribute('aria-atomic','true');
      _politeRegion.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
      document.body.appendChild(_politeRegion);
    }
    return _politeRegion;
  }

  function announce(msg, priority){
    if(!msg) return;
    var region = getRegion(priority||'polite');
    /* Clear and re-set forces a re-announcement */
    region.textContent = '';
    setTimeout(function(){ region.textContent = String(msg); }, 50);
  }

  /* ── D. LANDMARK ARIA ───────────────────────────────────────────────── */
  (function(){
    function ensureLandmark(){
      /* If no <main> or [role=main] exists, promote #app */
      if(document.querySelector('main,[role="main"]')) return;
      var app = document.getElementById('app') || document.querySelector('.main');
      if(app && app.tagName !== 'MAIN' && !app.getAttribute('role')){
        app.setAttribute('role','main');
      }
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', ensureLandmark);
    } else { ensureLandmark(); }
  })();

  /* ── E. FORM LABEL AUDIT ────────────────────────────────────────────── */
  function auditLabels(){
    document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button])').forEach(function(input){
      /* Already has label via id, aria-label, or aria-labelledby */
      if(input.labels && input.labels.length) return;
      if(input.getAttribute('aria-label')) return;
      if(input.getAttribute('aria-labelledby')) return;
      /* Use placeholder as emergency fallback */
      var ph = input.placeholder || input.name || input.type;
      if(ph){
        input.setAttribute('aria-label', ph);
        if(window.__omegaDevMode){
          console.warn('[OmegaA11y] input missing label, aria-label="'+ph+'" applied:', input);
        }
      }
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', auditLabels);
  } else { auditLabels(); }
  document.addEventListener('omega:populated', auditLabels);

  /* ── F. MOTION PREFERENCE CSS ───────────────────────────────────────── */
  (function(){
    if(document.getElementById('omega-a11y-motion')) return;
    var s = document.createElement('style');
    s.id = 'omega-a11y-motion';
    s.textContent = [
      '@media(prefers-reduced-motion:reduce){',
      '.chip-dot{animation:none!important}',
      '.omega-shell-spinner{animation:none!important;border-top-color:currentColor;opacity:.35}',
      '#omega-bg{display:none!important}',   /* hide particle canvas */
      '.omega-shimmer{animation:none!important}',
      '}',
    ].join('');
    (document.head||document.documentElement).appendChild(s);
  })();

  /* ── PUBLIC API ──────────────────────────────────────────────────────── */
  window.OmegaA11y = {
    trapFocus:    trapFocus,
    releaseFocus: releaseFocus,
    announce:     announce,
    auditLabels:  auditLabels,
  };
})();
