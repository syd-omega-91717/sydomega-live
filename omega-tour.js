/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN TOUR ENGINE (omega-tour.js)

   Open-source: Shepherd.js v13 (MIT) — the world's most popular site tour library.
   Vendored: /vendor/shepherd.mjs + /vendor/shepherd.css (official npm build).
   The old CDN URL, .../shepherd.js@13.0.3/dist/js/shepherd.min.js, names a file
   13.x does not ship (dist/ holds only esm/, cjs/, css/), so the tour never loaded.

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
     The engine runs a page's tour once per browser (localStorage).

   Step shape:
     { target: '#element-id', title: 'TITLE', text: 'Body copy.', placement: 'bottom' }
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaTourActive) return;
  window.__omegaTourActive = true;

  var SHEPHERD_JS  = '/vendor/shepherd.mjs';
  var SHEPHERD_CSS = '/vendor/shepherd.css';

  var _tours = {};        /* registered page tours */
  var _loaded = false;
  var _cbs    = [];
  var _running = false;   /* a tour is loading or showing */
  var _scheduled = {};    /* autoStart already armed for this page tour */
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
        /* Above the modal overlay (shepherd.css: 9997). At 9994 the overlay's
           click-catching <path> covered the popover, so NEXT and the close
           icon were unclickable and the page stayed dimmed. The element's own
           white background and 400px width showed as a pale strip beside the
           320px themed content, so it is sized to the content and cleared. */
        '.shepherd-element{z-index:9999!important;max-width:320px!important;',
        'background:transparent!important;box-shadow:none!important}',
        '.shepherd-content{background:#0A0A0F!important;border:1px solid rgba(201,168,76,.3)!important;',
        'border-radius:4px!important;box-shadow:0 16px 48px rgba(0,0,0,.7)!important;',
        'font-family:"Courier Prime",monospace!important;color:#e9e6dc!important;',
        'max-width:320px!important}',
        '.shepherd-header{background:rgba(201,168,76,.05)!important;padding:12px 16px!important;',
        'border-bottom:1px solid rgba(201,168,76,.12)!important}',
        '.shepherd-title{font-family:"Cinzel Decorative",serif!important;font-size:12px!important;',
        'letter-spacing:3px!important;color:#C9A84C!important;font-weight:400!important}',
        '.shepherd-text{padding:12px 16px!important;font-size:12px!important;',
        'line-height:1.7!important;letter-spacing:0.5px!important;',
        'color:rgba(233,230,220,.8)!important}',
        '.shepherd-footer{padding:10px 16px 14px!important;display:flex!important;',
        'justify-content:space-between!important;gap:8px!important;',
        'border-top:1px solid rgba(201,168,76,.08)!important}',
        '.shepherd-button{font-family:"Courier Prime",monospace!important;font-size:12px!important;',
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

    /* 13.x ships no UMD build, only an ES module with no imports of its own;
       dynamic import() works from this classic script. */
    import(SHEPHERD_JS).then(function(mod){
      window.Shepherd = mod.default || mod.Shepherd || mod;
      _loaded = true;
      _cbs.forEach(function(fn){ try{fn();}catch(e){} });
      _cbs=[];
    }).catch(function(){ _cbs=[]; _running=false; console.warn('[OmegaTour] Shepherd.js failed to load'); });
  }

  function markDone(name){
    if(typeof name !== 'string') return;
    try{ localStorage.setItem('omega_tour_done_'+name,'1'); }catch(e){}
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

    /* A step whose target is absent or not rendered cannot point at
       anything: Shepherd then centres it, captioned as if it described what
       sits there (the dashboard has no .topbar). Drop those; a step with no
       target at all is a deliberate centred card and stays. */
    steps = steps.filter(function(step){
      if(!step.target) return true;
      var el = document.querySelector(step.target);
      if(!el) return false;
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if(!steps.length) return null;

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
      /* One tour at a time. omega:populated fires more than once per page,
         and each firing used to start another tour: every one adds its own
         modal overlay above the last tour's popover, so the visible NEXT and
         close buttons sat under a click-catching layer and the page stayed
         dimmed with no way out. */
      if(_running) return;
      _running = true;
      loadShepherd(function(){
        if(typeof Shepherd==='undefined'){ _running = false; console.warn('[OmegaTour] Shepherd not ready'); return; }
        var tour = buildTour(steps);
        if(!tour){ _running = false; return; }
        tour.on('complete', function(){ _running = false; });
        tour.on('cancel', function(){ _running = false; });
        /* Closing the tour counts as seen, not only finishing it: a dismissed
           tour used to come back on the next page load of every session. */
        tour.on('cancel', function(){ markDone(nameOrSteps); });
        if(!opts.silent){
          tour.on('complete', function(){
            markDone(nameOrSteps);
            if(window.OmegaNotify && window.OmegaNotify.showToast){
              window.OmegaNotify.showToast('Tour complete. Press ? for keyboard shortcuts.','success');
            }
          });
        }
        tour.start();
      });
    },

    /* Seen once per browser, not per session (localStorage is a per-viewer
       convenience here; an unreadable store reads as done, so a blocked
       store never loops the tour). */
    isDone: function(name){
      try{
        return !!(localStorage.getItem('omega_tour_done_'+name) ||
                  sessionStorage.getItem('omega_tour_done_'+name));
      }catch(e){ return true; }
    },

    /* Auto-start if not done and steps registered */
    autoStart: function(name, delayMs){
      if(API.isDone(name) || _scheduled[name]) return;
      _scheduled[name] = true;
      var delay = delayMs != null ? delayMs : 3000;
      setTimeout(function(){
        if(_tours[name] && _tours[name].length) API.start(name);
      }, delay);
    },
  };

  window.OmegaTour = API;

  /* Auto-start tour for first-time session per page */
  document.addEventListener('omega:populated', function(e){
    var slug = (location.pathname||'/').replace(/^\/|\.html$/g,'') || 'dashboard';
    if(_tours[slug]){
      API.autoStart(slug, slug === 'dashboard' ? 4000 : 3000);
    }
  });

  /* Register dashboard tour (default) — pages can override or add more */
  API.register('dashboard', [
    {
      target: '.topbar',
      title: 'SOVEREIGN COMMAND BAR',
      text: 'Your authority level, navigation, and live stats are always visible here. Press <kbd style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);padding:0 5px;border-radius:2px">?</kbd> anytime for keyboard shortcuts.',
      placement: 'bottom'
    },
    {
      target: '#omega-side, .side',
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

  /* Evolution page tour */
  API.register('evolution', [
    {
      target: '.topbar',
      title: 'PROGRESSION ENGINE',
      text: 'Your authority ring and AUTH score appear here. AUTH = sqrt(A³+B³+C³)×φ/e. Your axis values grow as you complete tasks across all three domains.',
      placement: 'bottom'
    },
    {
      target: '.kpi-row',
      title: 'SOVEREIGN KPIs',
      text: 'Live authority, current gate, tasks completed, and next-gate delta update in real time after each task. Your element and sign are assigned at onboarding.',
      placement: 'bottom'
    },
    {
      target: '.axis-wrap',
      title: 'THREE SOVEREIGN AXES',
      text: '<b style="color:#00E5FF">Axis A</b> = Knowledge (study &amp; research). <b style="color:#9B6BF0">Axis B</b> = Mastery (gaming &amp; certifications). <b style="color:#3fb27f">Axis C</b> = Contribution (publishing &amp; creation). Each runs 0.001 → 9.000.',
      placement: 'bottom'
    },
    {
      target: '.gate-row',
      title: '12 AUTHORITY GATES',
      text: 'From INITIATE (2.3197) to APEX (27.8367) — 12 thresholds to unlock. Gold = reached, cyan = next. Reaching APEX requires all three axes at 9.000.',
      placement: 'top'
    },
    {
      target: '.ev-table',
      title: 'EVOLUTION EVENTS',
      text: 'Every axis increment is recorded here — the sovereign audit trail of your growth. Each event marks a real task completion and axis contribution.',
      placement: 'top'
    },
  ]);

  /* Gates page tour */
  API.register('gates', [
    {
      target: '.topbar',
      title: 'THE SOVEREIGN GATE SYSTEM',
      text: 'GATES is the M12 authority threshold system. Your authority ring shows your current progress toward the 12 stages of sovereign ascension.',
      placement: 'bottom'
    },
    {
      target: '.kpi-row',
      title: 'YOUR AUTHORITY STATS',
      text: 'AUTH, Axis A, Axis B, and Axis C — the four pillars of the authority formula. AUTH = sqrt(A³+B³+C³)×φ/e. Your goal is APEX at 27.8367.',
      placement: 'bottom'
    },
    {
      target: '.hero',
      title: 'THE GATES',
      text: 'The M12 system has 12 gates: INITIATE, ACOLYTE, SCHOLAR, KEEPER, GUARDIAN, ARCHITECT, SOVEREIGN, VANGUARD, HERALD, ORACLE, PRIME, APEX. Each unlocks at a defined authority threshold.',
      placement: 'bottom'
    },
  ]);

  /* Leaderboard page tour */
  API.register('leaderboard', [
    {
      target: '.topbar',
      title: 'AUTHORITY LEADERBOARD',
      text: 'Rankings are computed daily at midnight using the PageRank-inspired authority formula. Your ring shows your authority relative to APEX (27.8367).',
      placement: 'bottom'
    },
    {
      target: '.podium',
      title: 'SOVEREIGN PODIUM',
      text: 'The top 3 members by authority score. Gold = Rank 1 (APEX). Authority cannot be purchased — it is earned through verified knowledge, mastery, and contribution.',
      placement: 'bottom'
    },
    {
      target: '.lb-table',
      title: 'FULL AUTHORITY RANKING',
      text: 'Every approved member appears here. Your row is highlighted in gold. Rankings update every 24 hours — no real-time manipulation is possible.',
      placement: 'top'
    },
  ]);

  /* Achievements page tour */
  API.register('achievements', [
    {
      target: '.topbar',
      title: 'SOVEREIGN ACHIEVEMENTS',
      text: 'Your authority ring tracks your position from INITIATE to APEX. Achievement honors (Trophies, Medals, Certificates) are awarded as your axes progress.',
      placement: 'bottom'
    },
    {
      target: '.grid',
      title: 'YOUR HONORS',
      text: '<b style="color:#E2C86D">Trophies</b> = Axis B milestones. <b style="color:#00E5FF">Medals</b> = Axis C milestones. <b style="color:#3fb27f">Certificates</b> = Axis A milestones. Maximum 12 of each (36 total) at full APEX.',
      placement: 'bottom'
    },
    {
      target: '#milestone-grid',
      title: 'AUTHORITY MILESTONES',
      text: 'The 12 gates you\'ve reached are highlighted in gold. Each gate represents a verified authority threshold — from INITIATE at 2.3197 to APEX at 27.8367.',
      placement: 'top'
    },
  ]);

  /* Publishing page tour */
  API.register('publishing', [
    {
      target: '.topbar',
      title: 'THE CREATOR\'S HALL',
      text: 'This is your authorship portal. Every work you commit here advances your <b style="color:#3fb27f">Axis C Contribution</b>. Your first publication unlocks a permanent +0.25 to Axis C.',
      placement: 'bottom'
    },
    {
      target: '.card',
      title: 'COMMIT A WORK',
      text: 'Choose a form — Manuscript, Treatise, Report, Article, or Codex Entry. Give it a title and write your work. Your first submission advances the Contribution axis immediately on approval.',
      placement: 'bottom'
    },
  ]);

  /* Settings page tour */
  API.register('settings', [
    {
      target: '.topbar',
      title: 'SOVEREIGN PREFERENCES',
      text: 'Customize your sovereign environment — background void, language, privacy, and appearance. Your preferences are saved on this device and synced to your profile.',
      placement: 'bottom'
    },
    {
      target: '[data-membership-card]',
      title: 'YOUR MEMBERSHIP',
      text: 'Your current subscription tier and access status. Upgrade to unlock higher gates, premium content, and advanced features across the platform.',
      placement: 'bottom'
    },
  ]);

  /* Identity page tour */
  API.register('identity', [
    {
      target: '.topbar',
      title: 'DIGITAL IDENTITY',
      text: 'This page shows your private sovereign credentials — member ID, cosmology chain, subscription tier, and KYC status. This data is visible only to you.',
      placement: 'bottom'
    },
    {
      target: '.hero-band',
      title: 'AUTHORITY READOUT',
      text: 'Your name and live authority score (AUTH = sqrt(A³+B³+C³)×φ/e). The orbital ring represents your position from INITIATE to APEX across the 12 sovereign gates.',
      placement: 'bottom'
    },
    {
      target: '.card',
      title: 'YOUR CREDENTIALS',
      text: 'Every field here is private — member ID, sign, element, Olympian, agent, tier, and KYC status. These are the pillars of your sovereign identity record.',
      placement: 'top'
    },
  ]);

  /* Production Studio tour */
  API.register('studio', [
    {
      target: '.topbar',
      title: 'PRODUCTION COMMAND BAR',
      text: 'Your Axis C contribution ring and live authority are visible here. Press <kbd style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);padding:0 5px;border-radius:2px">+ NEW WORK</kbd> to start a new creation.',
      placement: 'bottom'
    },
    {
      target: '.pipeline',
      title: 'CREATION PIPELINE',
      text: 'Your works flow through DRAFT → IN REVIEW → APPROVED stages. Every committed work is private by default and visible only in your archive.',
      placement: 'bottom'
    },
    {
      target: '.create-grid',
      title: 'QUICK CREATE',
      text: 'Choose a form — Manuscript, Treatise, Report, Article, or Codex Entry. Each advances your <b style="color:#C9A84C">Axis C Contribution</b>. Your first publication unlocks +0.25 immediately.',
      placement: 'top'
    },
    {
      target: '.axis-grid',
      title: 'YOUR AXIS PROGRESSION',
      text: 'These live rings show your position on all three axes. Knowledge (A), Mastery (B), and Contribution (C) each run 0.001 to 9.000. The Creator\'s Hall powers Axis C.',
      placement: 'top'
    },
  ]);
})();
