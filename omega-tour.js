/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN TOUR ENGINE (omega-tour.js)

   Open-source: Shepherd.js v13 (MIT) — the world's most popular site tour library.
   CDN: https://cdn.jsdelivr.net/npm/shepherd.js@13/dist/js/shepherd.min.js

   Architecture:
   - First-time members get a guided tour of the dashboard automatically.
   - Tours are per-page and registered by the host page via OmegaTour.register().
   - Members can re-run the tour at any time via the ? overlay or the help button.
   - Sovereign dark theme applied to all Shepherd poppers.
   - Respects prefers-reduced-motion: skips entrance animations when set.

   Usage (from a page):
     OmegaTour.start('dashboard')   // Start named tour manually

   Auto-tour on first visit:
     A page sets the tour steps by calling OmegaTour.register('dashboard', steps)
     The engine checks sessionStorage and runs once per session per page.

   Step shape:
     { target: '#element-id', title: 'TITLE', text: 'Body copy.', placement: 'bottom' }
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaTourActive) return;
  window.__omegaTourActive = true;

  var SHEPHERD_JS  = 'https://cdn.jsdelivr.net/npm/shepherd.js@13/dist/js/shepherd.min.js';
  var SHEPHERD_CSS = 'https://cdn.jsdelivr.net/npm/shepherd.js@13/dist/css/shepherd.css';

  var _tours = {};        /* registered page tours */
  var _loaded = false;
  var _cbs    = [];
  var REDUCE  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── LOADER ─────────────────────────────────────────────────────────── */
  function loadShepherd(cb){
    if(_loaded){ cb(); return; }
    _cbs.push(cb);
    if(_cbs.length > 1) return;

    /* CSS first — non-blocking */
    if(!document.getElementById('shepherd-css')){
      var link = document.createElement('link');
      link.rel='stylesheet'; link.id='shepherd-css';
      link.href=SHEPHERD_CSS;
      document.head.appendChild(link);
    }
    /* Override Shepherd styles with sovereign theme */
    if(!document.getElementById('omega-tour-css')){
      var s=document.createElement('style');
      s.id='omega-tour-css';
      s.textContent=[
        '.shepherd-element{z-index:9994!important}',
        '.shepherd-content{background:#0A0A0F!important;border:1px solid rgba(201,168,76,.3)!important;',
        'border-radius:4px!important;box-shadow:0 16px 48px rgba(0,0,0,.7)!important;',
        'font-family:"Courier Prime",monospace!important;color:#e9e6dc!important;',
        'max-width:320px!important}',
        '.shepherd-header{background:rgba(201,168,76,.05)!important;padding:12px 16px!important;',
        'border-bottom:1px solid rgba(201,168,76,.12)!important}',
        '.shepherd-title{font-family:"Cinzel Decorative",serif!important;font-size:11px!important;',
        'letter-spacing:3px!important;color:#C9A84C!important;font-weight:400!important}',
        '.shepherd-text{padding:12px 16px!important;font-size:10px!important;',
        'line-height:1.7!important;letter-spacing:0.5px!important;',
        'color:rgba(233,230,220,.8)!important}',
        '.shepherd-footer{padding:10px 16px 14px!important;display:flex!important;',
        'justify-content:space-between!important;gap:8px!important;',
        'border-top:1px solid rgba(201,168,76,.08)!important}',
        '.shepherd-button{font-family:"Courier Prime",monospace!important;font-size:8px!important;',
        'letter-spacing:2px!important;padding:6px 14px!important;border-radius:2px!important;',
        'border:1px solid!important;cursor:pointer!important;transition:.18s!important;background:none!important}',
        '.shepherd-button-primary{color:#C9A84C!important;border-color:rgba(201,168,76,.35)!important}',
        '.shepherd-button-primary:hover{background:rgba(201,168,76,.1)!important}',
        '.shepherd-button-secondary{color:rgba(138,134,118,.7)!important;border-color:rgba(138,134,118,.2)!important}',
        '.shepherd-button-secondary:hover{background:rgba(138,134,118,.06)!important}',
        '.shepherd-arrow::before{background:#0A0A0F!important}',
        '.shepherd-element[data-popper-placement^="top"] .shepherd-arrow::before{border-bottom-color:rgba(201,168,76,.3)!important}',
        '.shepherd-element[data-popper-placement^="bottom"] .shepherd-arrow::before{border-top-color:rgba(201,168,76,.3)!important}',
      ].join('');
      document.head.appendChild(s);
    }

    var js = document.createElement('script');
    js.src = SHEPHERD_JS; js.async = true; js.crossOrigin = 'anonymous';
    js.onload = function(){
      _loaded = true;
      _cbs.forEach(function(fn){ try{fn();}catch(e){} });
      _cbs=[];
    };
    js.onerror = function(){ console.warn('[OmegaTour] Shepherd.js failed to load'); };
    document.head.appendChild(js);
  }

  /* ── TOUR BUILDER ────────────────────────────────────────────────────── */
  function buildTour(steps){
    var tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        scrollTo: { behavior: REDUCE ? 'auto' : 'smooth', block: 'center' },
        modalOverlayOpeningRadius: 4,
        popperOptions: { modifiers: [{ name: 'offset', options: { offset: [0, 12] } }] },
      },
    });

    steps.forEach(function(step, idx){
      var isLast = idx === steps.length - 1;
      var buttons = [];
      if(idx > 0){
        buttons.push({ text: '← BACK', classes: 'shepherd-button shepherd-button-secondary', action: function(){ tour.back(); } });
      }
      if(!isLast){
        buttons.push({ text: 'NEXT →', classes: 'shepherd-button shepherd-button-primary', action: function(){ tour.next(); } });
      } else {
        buttons.push({ text: 'DONE ✓', classes: 'shepherd-button shepherd-button-primary', action: function(){ tour.complete(); } });
      }

      tour.addStep({
        id: 'step-'+idx,
        attachTo: step.target ? { element: step.target, on: step.placement||'bottom' } : undefined,
        title: step.title||'',
        text: step.text||'',
        buttons: buttons,
        when: {
          show: function(){
            /* Highlight target with a gold glow ring */
            var el = step.target && document.querySelector(step.target);
            if(el) el.classList.add('omega-tour-highlight');
          },
          hide: function(){
            var el = step.target && document.querySelector(step.target);
            if(el) el.classList.remove('omega-tour-highlight');
          },
        },
      });
    });

    /* Inject highlight ring CSS once */
    if(!document.getElementById('omega-tour-highlight-css')){
      var hs = document.createElement('style');
      hs.id = 'omega-tour-highlight-css';
      hs.textContent =
        '.omega-tour-highlight{outline:2px solid rgba(201,168,76,.6)!important;'+
        'outline-offset:4px!important;'+
        'box-shadow:0 0 20px rgba(201,168,76,.25)!important;'+
        'transition:outline .2s,box-shadow .2s!important}';
      document.head.appendChild(hs);
    }

    return tour;
  }

  /* ── PUBLIC API ──────────────────────────────────────────────────────── */
  var API = {
    /* Register steps for a named tour */
    register: function(name, steps){
      _tours[name] = steps;
    },

    /* Start a named or ad-hoc tour */
    start: function(nameOrSteps, opts){
      opts = opts || {};
      var steps = Array.isArray(nameOrSteps) ? nameOrSteps : _tours[nameOrSteps];
      if(!steps || !steps.length){ console.warn('[OmegaTour] No steps for: '+nameOrSteps); return; }
      loadShepherd(function(){
        if(typeof Shepherd==='undefined'){ console.warn('[OmegaTour] Shepherd not ready'); return; }
        var tour = buildTour(steps);
        if(!opts.silent){
          tour.on('complete', function(){
            try{ sessionStorage.setItem('omega_tour_done_'+nameOrSteps,'1'); }catch(e){}
            if(window.OmegaNotify && window.OmegaNotify.showToast){
              window.OmegaNotify.showToast('Tour complete. Press ? for keyboard shortcuts.','success');
            }
          });
        }
        tour.start();
      });
    },

    /* Check if tour was already done this session */
    isDone: function(name){
      try{ return !!sessionStorage.getItem('omega_tour_done_'+name); }catch(e){ return true; }
    },

    /* Auto-start if not done and steps registered */
    autoStart: function(name, delayMs){
      if(API.isDone(name)) return;
      var delay = delayMs != null ? delayMs : 3000;
      setTimeout(function(){
        if(_tours[name] && _tours[name].length) API.start(name);
      }, delay);
    },
  };

  window.OmegaTour = API;

  /* Register dashboard tour (default) — pages can override or add more */
  API.register('dashboard', [
    {
      target: '.topbar',
      title: 'SOVEREIGN COMMAND BAR',
      text: 'Your authority level, navigation, and live stats are always visible here. Press <kbd style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);padding:0 5px;border-radius:2px">?</kbd> anytime for keyboard shortcuts.',
      placement: 'bottom'
    },
    {
      target: '.side',
      title: 'NAVIGATION SPINE',
      text: 'Click any icon to navigate. Or press <kbd style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);padding:0 5px;border-radius:2px">g</kbd> then a letter — try <kbd style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);padding:0 5px;border-radius:2px">g d</kbd> for Dashboard.',
      placement: 'right'
    },
    {
      target: '.kpi-row',
      title: 'YOUR SOVEREIGN METRICS',
      text: 'Live KPIs drawn from your matrix position. Every task you complete advances these numbers in real time.',
      placement: 'bottom'
    },
    {
      target: null,
      title: 'WELCOME TO THE PLATFORM',
      text: 'Ω SYD OMEGA 91717 is a living sovereign system. Complete tasks to advance your authority. Explore the Gates, Evolution, and Knowledge tracks to grow across all three axes.',
      placement: 'top'
    },
  ]);
})();
