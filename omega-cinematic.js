/* ==========================================================================
   Ω SYD OMEGA 91717 — CINEMATIC TRANSITION ENGINE (omega-cinematic.js)

   Delivers the "cinematic and animated" quality standard the platform
   demands. Every page navigation feels like a sovereign production.

   FEATURES
   ────────
   A. PAGE TRANSITION CURTAIN
      Gold-accented slide curtain on navigation (anchor clicks).
      Respects prefers-reduced-motion (instant if reduced).

   B. SCROLL-TRIGGERED REVEALS
      Elements with [data-reveal] animate in as they enter the viewport.
      Variants: fade-up (default), fade-left, fade-right, zoom-in.
      Uses IntersectionObserver — zero scroll event listeners.

   C. NUMBER COUNT-UP
      Elements with [data-countup] animate their numeric content from 0.
      Triggered once on first viewport entry. Respects motion preference.

   D. STAGGER GROUPS
      Parent elements with [data-stagger] reveal children in sequence.
      Gap controlled by [data-stagger-gap="100"] (ms, default 80).

   E. SOVEREIGN SCAN LINE EFFECT
      Optional [data-scan] class adds a CRT-style scan sweep animation
      to hero banners and stat panels — CSS only, zero JS overhead.

   All animations are GPU-accelerated (transform + opacity only).
   Never blocks or jitters the main thread.
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaCinActive) return;
  window.__omegaCinActive = true;

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── CSS ─────────────────────────────────────────────────────────────── */
  (function injectCSS(){
    if(document.getElementById('omega-cin-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-cin-css';
    s.textContent = [
      /* Page transition curtain */
      '#omega-curtain{position:fixed;inset:0;z-index:9999;pointer-events:none;',
      'background:linear-gradient(135deg,#020206 60%,rgba(201,168,76,.07) 100%);',
      'transform:scaleX(0);transform-origin:left;transition:transform .38s cubic-bezier(.4,0,1,1)}',
      '#omega-curtain.omega-in{transform:scaleX(1);transform-origin:left}',
      '#omega-curtain.omega-out{transform:scaleX(0);transform-origin:right;',
      'transition:transform .32s cubic-bezier(0,0,.6,1)}',
      '#omega-curtain-line{position:absolute;top:0;bottom:0;right:0;width:2px;',
      'background:linear-gradient(180deg,transparent,rgba(201,168,76,.8) 40%,rgba(201,168,76,.8) 60%,transparent);',
      'opacity:0;transition:opacity .1s}',
      '#omega-curtain.omega-in #omega-curtain-line{opacity:1}',

      /* Reveal base state — hidden until observed */
      '[data-reveal]{opacity:0;will-change:opacity,transform}',
      '[data-reveal="fade-up"]{transform:translateY(22px)}',
      '[data-reveal="fade-left"]{transform:translateX(-22px)}',
      '[data-reveal="fade-right"]{transform:translateX(22px)}',
      '[data-reveal="zoom-in"]{transform:scale(.94)}',
      '[data-reveal].omega-revealed{opacity:1!important;transform:none!important;',
      'transition:opacity .5s ease,transform .5s ease}',

      /* Stagger children initially hidden */
      '[data-stagger]>[data-reveal]{opacity:0}',

      /* Count-up */
      '[data-countup]{display:inline-block}',

      /* Scan line effect */
      '[data-scan]{position:relative;overflow:hidden}',
      '[data-scan]::after{content:"";position:absolute;inset:0;pointer-events:none;',
      'background:repeating-linear-gradient(180deg,transparent,transparent 3px,rgba(0,0,0,.04) 3px,rgba(0,0,0,.04) 4px);',
      'animation:omega-scan 6s linear infinite}',
      '@keyframes omega-scan{0%{background-position:0 0}100%{background-position:0 100%}}',

      /* Reduced motion overrides */
      '@media(prefers-reduced-motion:reduce){',
      '#omega-curtain{transition:none!important}',
      '[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}',
      '[data-scan]::after{animation:none!important}',
      '}',

      /* Gold shimmer utility */
      '.omega-shimmer{background:linear-gradient(90deg,transparent 0%,rgba(201,168,76,.15) 50%,transparent 100%);',
      'background-size:200% 100%;animation:omega-shimmer-move 2s infinite}',
      '@keyframes omega-shimmer-move{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  })();

  /* ── A. PAGE TRANSITION CURTAIN ─────────────────────────────────────── */
  var _curtain = null;
  function getCurtain(){
    if(!_curtain){
      _curtain = document.createElement('div');
      _curtain.id = 'omega-curtain';
      _curtain.innerHTML = '<div id="omega-curtain-line"></div>';
      document.body.appendChild(_curtain);
    }
    return _curtain;
  }

  function curtainIn(cb){
    if(REDUCE){ cb&&cb(); return; }
    var c = getCurtain();
    c.className = 'omega-in';
    setTimeout(function(){ cb&&cb(); }, 380);
  }

  function curtainOut(){
    if(REDUCE || !_curtain) return;
    _curtain.className = 'omega-out';
    setTimeout(function(){
      if(_curtain) _curtain.className = '';
    }, 320);
  }

  /* Intercept internal anchor clicks for transition */
  document.addEventListener('click', function(e){
    if(REDUCE) return;
    var a = e.target.closest('a');
    if(!a || !a.href) return;
    /* Only same-origin, non-hash, non-external, non-download links */
    if(a.hostname !== location.hostname) return;
    if(a.hash && a.pathname === location.pathname) return;
    if(a.hasAttribute('download') || a.getAttribute('target') === '_blank') return;
    if(a.getAttribute('data-no-transition') !== null) return;
    var dest = a.href;
    if(dest === location.href) return;
    e.preventDefault();
    curtainIn(function(){
      location.href = dest;
    });
  });

  /* Animate out on page show (back/forward cache) */
  window.addEventListener('pageshow', function(e){
    curtainOut();
  });

  /* Also animate out on DOMContentLoaded (normal navigation) */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(curtainOut, 80);
    });
  } else {
    setTimeout(curtainOut, 80);
  }

  /* ── B. SCROLL-TRIGGERED REVEALS ─────────────────────────────────────── */
  function initReveals(){
    if(REDUCE){
      /* Instantly reveal all — no animation */
      document.querySelectorAll('[data-reveal]').forEach(function(el){
        el.classList.add('omega-revealed');
      });
      return;
    }
    if(!('IntersectionObserver' in window)){
      document.querySelectorAll('[data-reveal]').forEach(function(el){
        el.classList.add('omega-revealed');
      });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        entry.target.classList.add('omega-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(function(el){
      io.observe(el);
    });
    window._omegaRevealIO = io; /* keep ref for dynamic content */
  }

  /* ── C. NUMBER COUNT-UP ──────────────────────────────────────────────── */
  function countUp(el){
    var raw = el.textContent.trim();
    var num = parseFloat(raw.replace(/[^0-9.]/g,''));
    var prefix = raw.match(/^[^0-9]*/)[0];
    var suffix = raw.match(/[^0-9.]*$/)[0];
    var decimals = (raw.indexOf('.')>-1) ? (raw.split('.')[1]||'').length : 0;
    if(isNaN(num)||num===0) return;
    if(REDUCE){ return; }
    var duration = Math.min(1600, Math.max(800, num * 10));
    var start = performance.now();
    function step(now){
      var p = Math.min((now-start)/duration, 1);
      /* Ease out cubic */
      var ease = 1 - Math.pow(1-p, 3);
      var val = num * ease;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCountUps(){
    if(!('IntersectionObserver' in window)){
      document.querySelectorAll('[data-countup]').forEach(countUp);
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-countup]').forEach(function(el){
      io.observe(el);
    });
  }

  /* ── D. STAGGER GROUPS ───────────────────────────────────────────────── */
  function initStagger(){
    if(REDUCE){ return; }
    document.querySelectorAll('[data-stagger]').forEach(function(parent){
      var gap = parseInt(parent.getAttribute('data-stagger-gap')||'80',10);
      var children = parent.querySelectorAll('[data-reveal]');
      children.forEach(function(child, i){
        child.style.transitionDelay = (i * gap) + 'ms';
      });
    });
  }

  /* ── INIT ────────────────────────────────────────────────────────────── */
  function boot(){
    initReveals();
    initCountUps();
    initStagger();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Re-init after dynamic content renders */
  document.addEventListener('omega:populated', function(){
    setTimeout(function(){
      /* Observe any newly added [data-reveal] elements */
      if(window._omegaRevealIO && !REDUCE){
        document.querySelectorAll('[data-reveal]:not(.omega-revealed)').forEach(function(el){
          window._omegaRevealIO.observe(el);
        });
      }
      initCountUps();
      initStagger();
    }, 100);
  });

  /* ── PUBLIC API ──────────────────────────────────────────────────────── */
  window.OmegaCinematic = {
    curtainIn:  curtainIn,
    curtainOut: curtainOut,
    reveal:     initReveals,
    countUp:    initCountUps,
    stagger:    initStagger,
    isReduced:  REDUCE,
  };
})();
