/* -- DATA-FETCH RECORDER (must be the first thing this file does) -----------
   Records the timing and outcome of every request to this platform's own
   backend, so omega-dataguard.js can tell a page that is WAITING on data from
   a page that has finished loading nothing. Those look identical today: the
   placeholders a page paints up front ("--", empty tables, zeroed KPIs) are
   simply never replaced when a query does not resolve, and Supabase resolves
   to {data:null,error} rather than throwing, so the bare try/catch blocks
   these pages use catch nothing (CLAUDE.md 8.1 class 1).

   It lives HERE, inline and synchronous, rather than in the module, because a
   dynamically injected script is async by default and would install its
   wrapper AFTER the page's own `<script type="module">` had already issued
   its first queries -- which are exactly the ones that hang on a page that
   never finishes loading. bg.js runs during parse, so this wraps fetch before
   any module script executes.

   It OBSERVES ONLY. The request is passed through untouched and both
   settlement paths re-emit exactly what the caller would have seen, so no
   existing call site can behave differently because this ran. */
(function(){
  if(window.__omegaFetchWatch) return; window.__omegaFetchWatch=1;
  var real=window.fetch; if(typeof real!=='function') return;
  var W=window.__omegaData={inflight:0,ok:0,failed:0,firstAt:0};
  /* Only this platform's backend. A slow avatar or webfont is not a data failure. */
  function watched(u){
    try{ u=String(u);
      return u.indexOf('.supabase.co/')>-1||u.indexOf('/rest/v1/')>-1||
             u.indexOf('/auth/v1/')>-1||u.indexOf('/functions/v1/')>-1;
    }catch(e){ return false; }
  }
  function emit(d){ try{ document.dispatchEvent(new CustomEvent('omega:fetch-settled',{detail:d})); }catch(e){} }
  window.fetch=function(input,init){
    var u=(input&&input.url)?input.url:input;
    if(!watched(u)) return real.apply(this,arguments);
    W.inflight++; if(!W.firstAt) W.firstAt=Date.now();
    var settled=false; function done(){ if(!settled){ settled=true; W.inflight--; } }
    var p; try{ p=real.apply(this,arguments); }catch(e){ done(); throw e; }
    return p.then(function(res){
      done();
      /* 4xx is a real answer -- an unauthorised or absent row is not a
         connectivity failure. 5xx is. */
      if(res&&res.status>=500){ W.failed++; emit({ok:false,status:res.status}); }
      else { if(res&&res.ok) W.ok++; emit({ok:!!(res&&res.ok),status:res&&res.status}); }
      return res;
    },function(err){ done(); W.failed++; emit({ok:false,err:1}); throw err; });
  };
})();

/* -- BODY-APPEND QUEUE (defined before every injection below) --------------
   Each dynamic injection in this file guarded its append with
   `if(document.body)` and SILENTLY DID NOTHING when body was absent. That is
   harmless on the ~140 pages that load bg.js with defer or from <body>, but 7
   pages (council.html, graphify.html and the five graph-*.html views) load it
   as a plain <script src="/bg.js"> inside <head>, where it runs during head
   parsing while document.body is still null. There the design-system <style>
   still landed (it appends to <head>), so those pages LOOKED styled while
   every one of the ~90 platform modules -- nav, the approval guard's runtime,
   omega-a11y, copilot, notify, telemetry -- was dropped with no error.
   Measured on council.html: 5 script tags loaded, against dashboard's 98.

   Queuing instead of discarding fixes the whole class -- append now when body
   exists, otherwise on DOMContentLoaded, preserving relative order -- and
   keeps working for any future page however it loads bg.js. Same shape of gap
   as the nav.js injection bug recorded in CLAUDE.md section 8.

   The two `if(document.body){...}else requestAnimationFrame(...)` sites in
   this file are deliberately left alone: they already retry rather than drop,
   and they are the only two that were written that way. */
function __omegaAppend(el){
  if(document.body){ document.body.appendChild(el); return; }
  document.addEventListener('DOMContentLoaded', function(){
    var b = document.body; if(b) b.appendChild(el);
  });
}
/* Platform nervous system */
  if(!document.querySelector('script[data-omega-motion]')){var mo=document.createElement('script');mo.src='/omega-motion.js';mo.setAttribute('data-omega-motion','1');mo.defer=true;__omegaAppend(mo);}
  if(!document.querySelector('script[data-omega-motion-v3]')){var mov3=document.createElement('script');mov3.src='/omega-motion-v3.js';mov3.setAttribute('data-omega-motion-v3','1');mov3.defer=true;__omegaAppend(mov3);}
  if(!document.querySelector('script[data-omega-dataguard]')){var dg=document.createElement('script');dg.src='/omega-dataguard.js';dg.setAttribute('data-omega-dataguard','1');dg.defer=true;__omegaAppend(dg);}
  if(!document.querySelector('script[data-omega-os]')){var os_data_omega_os=document.createElement('script');os_data_omega_os.src='/omega-sovereign-os.js';os_data_omega_os.setAttribute('data-omega-os','1');os_data_omega_os.defer=true;__omegaAppend(os_data_omega_os);}
  /* AI copilot on every page */
  if(!document.querySelector('script[data-omega-copilot]')){var os_data_omega_copilot=document.createElement('script');os_data_omega_copilot.src='/omega-copilot.js';os_data_omega_copilot.setAttribute('data-omega-copilot','1');os_data_omega_copilot.defer=true;__omegaAppend(os_data_omega_copilot);}
  /* Zero Trust threat detection */
  if(!document.querySelector('script[data-omega-threat]')){var os_data_omega_threat=document.createElement('script');os_data_omega_threat.src='/omega-threat.js';os_data_omega_threat.setAttribute('data-omega-threat','1');os_data_omega_threat.defer=true;__omegaAppend(os_data_omega_threat);}
  /* Real-time knowledge graph integration engine */
  if(!document.querySelector('script[data-omega-graphify-integration]')){var os_data_omega_graphify_integration=document.createElement('script');os_data_omega_graphify_integration.src='/omega-graphify-integration.js';os_data_omega_graphify_integration.setAttribute('data-omega-graphify-integration','1');os_data_omega_graphify_integration.defer=true;__omegaAppend(os_data_omega_graphify_integration);}
  /* Phase D.1: Page feature registry and capability discovery */
  if(!document.querySelector('script[data-omega-page-features]')){var os_data_omega_page_features=document.createElement('script');os_data_omega_page_features.src='/omega-page-features.js';os_data_omega_page_features.setAttribute('data-omega-page-features','1');os_data_omega_page_features.defer=true;__omegaAppend(os_data_omega_page_features);}
  /* Phase D.2: Data binding framework for reactive page updates */
  if(!document.querySelector('script[data-omega-data-binding]')){var os_data_omega_data_binding=document.createElement('script');os_data_omega_data_binding.src='/omega-data-binding.js';os_data_omega_data_binding.setAttribute('data-omega-data-binding','1');os_data_omega_data_binding.defer=true;__omegaAppend(os_data_omega_data_binding);}
  /* Phase C.2: SVG emblem system for all 184 pages */
  if(!document.querySelector('script[data-omega-emblems]')){var os_data_omega_emblems=document.createElement('script');os_data_omega_emblems.src='/omega-emblems-catalog.js';os_data_omega_emblems.setAttribute('data-omega-emblems','1');os_data_omega_emblems.defer=true;__omegaAppend(os_data_omega_emblems);}
  /* Phase C.3: Emblem integration with sidebar navigation and glass effects */
  if(!document.querySelector('script[data-omega-emblem-integration]')){var os_data_omega_emblem_integration=document.createElement('script');os_data_omega_emblem_integration.src='/omega-emblem-integration.js';os_data_omega_emblem_integration.setAttribute('data-omega-emblem-integration','1');os_data_omega_emblem_integration.defer=true;__omegaAppend(os_data_omega_emblem_integration);}
  /* Phase C.4: Page archetype system for consistent visual treatment */
  if(!document.querySelector('script[data-omega-archetype]')){var os_data_omega_archetype=document.createElement('script');os_data_omega_archetype.src='/omega-archetype-system.js';os_data_omega_archetype.setAttribute('data-omega-archetype','1');os_data_omega_archetype.defer=true;__omegaAppend(os_data_omega_archetype);}
  /* Phase C.5: Archetype-specific motion and visual styling rules */
  if(!document.querySelector('script[data-omega-archetype-motion]')){var os_data_omega_archetype_motion=document.createElement('script');os_data_omega_archetype_motion.src='/omega-archetype-motion.js';os_data_omega_archetype_motion.setAttribute('data-omega-archetype-motion','1');os_data_omega_archetype_motion.defer=true;__omegaAppend(os_data_omega_archetype_motion);}
  /* Phase C.6: Archetype visual surface configuration */
  if(!document.querySelector('script[data-omega-archetype-surfaces]')){var os_data_omega_archetype_surfaces=document.createElement('script');os_data_omega_archetype_surfaces.src='/omega-archetype-surfaces.js';os_data_omega_archetype_surfaces.setAttribute('data-omega-archetype-surfaces','1');os_data_omega_archetype_surfaces.defer=true;__omegaAppend(os_data_omega_archetype_surfaces);}
  /* Phase A: Agent brand mythology, sigil identity, constellation visualization */
  if(!document.querySelector('script[data-omega-agent-personas]')){var os_data_omega_agent_personas=document.createElement('script');os_data_omega_agent_personas.src='/omega-agent-personas-v3.js';os_data_omega_agent_personas.setAttribute('data-omega-agent-personas','1');os_data_omega_agent_personas.defer=true;__omegaAppend(os_data_omega_agent_personas);}
  /* Phase 1: Depth Tilt -- Pointer-driven 3D card tilt (micro-parallax).
     Guard: only loaded if a matching element exists on the page. */
  if(!document.querySelector('script[data-omega-depth-tilt]')){var os_data_omega_depth_tilt=document.createElement('script');os_data_omega_depth_tilt.src='/omega-depth-tilt.js';os_data_omega_depth_tilt.setAttribute('data-omega-depth-tilt','1');os_data_omega_depth_tilt.defer=true;__omegaAppend(os_data_omega_depth_tilt);}
  /* Phase 1: Telemetry Sweep -- Animated line sweep on data load/state transition.
     Global instance: window.omegaSweep; also callable via window.OmegaTelemetrySweep. */
  if(!document.querySelector('script[data-omega-telemetry-sweep]')){var os_data_omega_telemetry_sweep=document.createElement('script');os_data_omega_telemetry_sweep.src='/omega-telemetry-sweep.js';os_data_omega_telemetry_sweep.setAttribute('data-omega-telemetry-sweep','1');os_data_omega_telemetry_sweep.defer=true;__omegaAppend(os_data_omega_telemetry_sweep);}
  /* Phase 1: Orbital Ring -- SVG-based interactive navigation ring.
     Guard: only loaded if a matching element exists on the page. */
  if(!document.querySelector('script[data-omega-orbital-ring]')){var os_data_omega_orbital_ring=document.createElement('script');os_data_omega_orbital_ring.src='/omega-orbital-ring.js';os_data_omega_orbital_ring.setAttribute('data-omega-orbital-ring','1');os_data_omega_orbital_ring.defer=true;__omegaAppend(os_data_omega_orbital_ring);}
  /* Phase 1: Kinetic Reveal -- Character-by-character animation for kinetic typography.
     Wraps text in spans for staggered reveal; respects prefers-reduced-motion. */
  if(!document.querySelector('script[data-omega-cinematic-animations-phase1]')){var os_data_omega_cinematic_animations_phase1=document.createElement('script');os_data_omega_cinematic_animations_phase1.src='/omega-cinematic-animations-phase1.js';os_data_omega_cinematic_animations_phase1.setAttribute('data-omega-cinematic-animations-phase1','1');os_data_omega_cinematic_animations_phase1.defer=true;__omegaAppend(os_data_omega_cinematic_animations_phase1);}
  /* Phase 2: 3D Depth, Volumetric Lighting, Scroll Parallax -- Advanced
     cinematic effects. Scroll-tracking via rAF; constellation orbits;
     depth-card tilt. Safe global; respects prefers-reduced-motion. */
  if(!document.querySelector('script[data-omega-cinematic-animations-phase2]')){var os_data_omega_cinematic_animations_phase2=document.createElement('script');os_data_omega_cinematic_animations_phase2.src='/omega-cinematic-animations-phase2.js';os_data_omega_cinematic_animations_phase2.setAttribute('data-omega-cinematic-animations-phase2','1');os_data_omega_cinematic_animations_phase2.defer=true;__omegaAppend(os_data_omega_cinematic_animations_phase2);}
  /* Phase 3: Particle Systems Integration -- State-driven particle emission, constellation-
     particle cluster linkage, data load indicators. Integrates with omega-particles.js;
     synchronizes orbit timing with Phase 2. Safe global; respects prefers-reduced-motion. */
  if(!document.querySelector('script[data-omega-cinematic-animations-phase3]')){var os_data_omega_cinematic_animations_phase3=document.createElement('script');os_data_omega_cinematic_animations_phase3.src='/omega-cinematic-animations-phase3.js';os_data_omega_cinematic_animations_phase3.setAttribute('data-omega-cinematic-animations-phase3','1');os_data_omega_cinematic_animations_phase3.defer=true;__omegaAppend(os_data_omega_cinematic_animations_phase3);}
  /* Phase 4: Elemental Theming -- Seasonal/elemental color cycling synchronized with nav axis.
     Tier 3+ feature; reads element affiliation, manages --page-accent/soft/glow tokens,
     persists to localStorage with 24h expiry. Grounded in: proposal #22. */
  if(!document.querySelector('script[data-omega-theme-elemental]')){var os_data_omega_theme_elemental=document.createElement('script');os_data_omega_theme_elemental.src='/omega-theme-elemental.js';os_data_omega_theme_elemental.setAttribute('data-omega-theme-elemental','1');os_data_omega_theme_elemental.defer=true;__omegaAppend(os_data_omega_theme_elemental);}/* ===== APPROVAL GUARD (must run before anything reveals content) ==========
   40 pages checked only that a session EXISTS, not that the member was
   APPROVED. Each page's own boot did `#app.style.display='flex'` after the
   session check, while the approval redirect below needs three async hops
   (import -> getSession -> profile query). In that window an unapproved member
   saw the page -- and if bg.js failed to load at all, saw it permanently.

   This closes it structurally rather than by timing: a CSS rule with
   !important keeps #app hidden no matter what inline style a page sets, until
   the body carries `omega-approved`. That class is added only after approval
   is confirmed, so failure of any kind leaves content hidden.

   Public pages (account, enter, reset, terms, pending, index) are exempt --
   they must render to signed-out visitors. */
(function(){

/* Inject shared class definitions + load external stylesheet */
(function(){
  if(document.getElementById('omega-global-css')) return;
  var sharedCSS='.tab-bar,.tab-nav{overflow-x:auto;white-space:nowrap;-ms-overflow-style:none;scrollbar-width:none}.tab-row{display:flex;flex-wrap:wrap;gap:2px;border-bottom:1px solid var(--line);margin-bottom:14px}.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(200px,25vw,280px),1fr));gap:12px;margin-bottom:16px}.card-title{position:relative;padding-left:16px;font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--gold);margin-bottom:8px}.card-body{font-size:13px;color:var(--muted);line-height:1.6}.kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(120px,15vw,160px),1fr));gap:10px;margin-bottom:16px;align-items:start}.kpi-label{font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-top:4px}.kpi-n{font-family:var(--D);font-size:clamp(16px,2.5vw,22px);color:var(--kc,var(--gold));line-height:1}.kpi-l{font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-top:4px}.btn-gold{background:none;color:var(--gold);border-color:rgba(201,168,76,.3)}.btn-gold:hover{background:rgba(201,168,76,.08);border-color:var(--gold)}.btn-cyan{background:none;color:var(--cyan);border-color:rgba(0,229,255,.2)}.btn-cyan:hover{background:rgba(0,229,255,.06);border-color:var(--cyan)}.btn-crim{background:none;color:var(--crim);border-color:rgba(139,0,0,.3)}.btn-crim:hover{background:rgba(139,0,0,.08);border-color:var(--crim)}.tbl-head{display:grid;padding:8px 12px;background:rgba(201,168,76,.04);border-bottom:1px solid rgba(201,168,76,.08)}.tbl-hcell{font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--solar)}.tbl-row{display:grid;padding:9px 12px;border-bottom:1px solid rgba(201,168,76,.05)}.tbl-row:hover{background:rgba(201,168,76,.02)}.tbl-row:last-child{border-bottom:none}.bar-track{height:6px;background:rgba(255,255,255,.04);border-radius:3px;overflow:hidden}.chip{font-family:var(--M);font-size:12px;letter-spacing:1.2px;padding:3px 10px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.15);border-radius:3px;display:inline-block}.chip-dot{width:5px;height:5px;border-radius:50%;background:currentColor}.card.card-edge.card-edge::before{top:0;bottom:0;left:0;right:auto;width:var(--card-edge-w,3px);height:auto}';
  var st=document.createElement('style');st.id='omega-global-css';st.textContent=sharedCSS;
  (document.head||document.documentElement).appendChild(st);
  var link=document.createElement('link');
  link.rel='stylesheet';link.href='/css/omega-system.css';link.type='text/css';
  (document.head||document.documentElement).appendChild(link);
})();

/* Omega-GVP: brand webfonts (Cinzel Decorative / Rajdhani / Courier Prime) --
   were referenced by every page's CSS but never actually loaded anywhere in
   the repo (zero @font-face rules, zero font links, zero font files exist),
   so every page has silently been falling back to default browser fonts
   this whole time. Loaded once here so the platform's real typography
   renders, on every page, with no build step. */
(function(){
  if(document.getElementById('omega-fonts')) return;
  var pre1=document.createElement('link');
  pre1.rel='preconnect'; pre1.href='https://fonts.googleapis.com';
  var pre2=document.createElement('link');
  pre2.rel='preconnect'; pre2.href='https://fonts.gstatic.com'; pre2.crossOrigin='anonymous';
  var link=document.createElement('link');
  link.id='omega-fonts'; link.rel='stylesheet';
  link.href='https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap';
  var head=document.head||document.documentElement;
  head.appendChild(pre1); head.appendChild(pre2); head.appendChild(link);
})();

/* Ω v3 Evolution Layers: Visual System Modernization
   Loaded after system.css and fonts. Each layer extends v2 without replacing.
   - omega-visual-evolution-v3.css: Prismatic glass, geometric typography, depth layering
   - omega-component-library.css: Information density patterns, dashboard components
   - omega-accessibility-audit.css: WCAG 2.1 AA compliance, mobile optimization */
(function(){
  var head=document.head||document.documentElement;
  if(!document.getElementById('omega-visual-v3-css')){
    var link=document.createElement('link');
    link.id='omega-visual-v3-css'; link.rel='stylesheet';
    link.href='/omega-visual-evolution-v3.css'; link.type='text/css';
    head.appendChild(link);
  }
  if(!document.getElementById('omega-component-library-css')){
    var link=document.createElement('link');
    link.id='omega-component-library-css'; link.rel='stylesheet';
    link.href='/omega-component-library.css'; link.type='text/css';
    head.appendChild(link);
  }
  if(!document.getElementById('omega-accessibility-audit-css')){
    var link=document.createElement('link');
    link.id='omega-accessibility-audit-css'; link.rel='stylesheet';
    link.href='/omega-accessibility-audit.css'; link.type='text/css';
    head.appendChild(link);
  }
  if(!document.getElementById('omega-agent-identity-css')){
    var link=document.createElement('link');
    link.id='omega-agent-identity-css'; link.rel='stylesheet';
    link.href='/omega-agent-identity-v3.css'; link.type='text/css';
    head.appendChild(link);
  }
  /* omega-cinematic-system.css: additive-only (see its own header) --
     styles four namespaced classes (.omega-cinematic/.omega-emblem/
     .omega-depth-card/.omega-node) and invents its own token names, so it
     is safe platform-wide. Previously linked from index.html alone despite
     both this file's and the sheet's own header comments already claiming
     sitewide reach (CLAUDE.md 4.1 / FIXES_LOG.md 114) -- wiring it here
     makes that claim true instead of fixing the claim to match reality. */
  if(!document.getElementById('omega-cinematic-css')){
    var link=document.createElement('link');
    link.id='omega-cinematic-css'; link.rel='stylesheet';
    link.href='/omega-cinematic-system.css'; link.type='text/css';
    head.appendChild(link);
  }
  /* Phase 1: Cinematic Glass -- Enhanced glass shimmer with pointer-tracking
     highlight on .card, .kpi-card, .glass, .inp. Additive-only; safe to load
     globally. Includes backdrop-filter enhancements and hover glow effects. */
  if(!document.getElementById('omega-cinematic-glass-css')){
    var link=document.createElement('link');
    link.id='omega-cinematic-glass-css'; link.rel='stylesheet';
    link.href='/css/omega-cinematic-glass.css'; link.type='text/css';
    head.appendChild(link);
  }
  /* Phase 1: Signal Pulse -- Status indicator animations (active/busy/away/warning).
     Attribute-driven via data-status; safe global. Respects prefers-reduced-motion. */
  if(!document.getElementById('omega-signal-pulse-css')){
    var link=document.createElement('link');
    link.id='omega-signal-pulse-css'; link.rel='stylesheet';
    link.href='/css/omega-signal-pulse.css'; link.type='text/css';
    head.appendChild(link);
  }
  /* Phase 1: Cinematic Animations -- Comprehensive motion enhancements: character-reveal
     for kinetic typography, button ripples, form field validation feedback, toast
     notifications with progress bars, link underlines, callout pulses, autocomplete
     stagger. All GPU-safe (transform/opacity/filter); respects prefers-reduced-motion
     and high-contrast mode. Safe to load globally on all 202 pages. */
  if(!document.getElementById('omega-cinematic-animations-phase1-css')){
    var link=document.createElement('link');
    link.id='omega-cinematic-animations-phase1-css'; link.rel='stylesheet';
    link.href='/css/omega-cinematic-animations-phase1.css'; link.type='text/css';
    head.appendChild(link);
  }
  /* Phase 2: Cinematic Animations -- Advanced 3D and scroll-driven effects: depth cards
     with perspective layering, volumetric lighting with radial gradients, scroll-driven
     parallax, constellation backdrop orbital mechanics. All GPU-safe transforms;
     respects prefers-reduced-motion. Safe global on all 202 pages. */
  if(!document.getElementById('omega-cinematic-animations-phase2-css')){
    var link=document.createElement('link');
    link.id='omega-cinematic-animations-phase2-css'; link.rel='stylesheet';
    link.href='/css/omega-cinematic-animations-phase2.css'; link.type='text/css';
    head.appendChild(link);
  }
  /* Phase 3: Cinematic Animations -- Particle systems integration and state-driven effects:
     particle emission control tied to system states (loading, processing, active, idle,
     error, success); constellation-particle cluster linkage; data load indicators with
     state transitions. All GPU-safe transforms; respects prefers-reduced-motion. Safe
     global on all 202 pages. */
  if(!document.getElementById('omega-cinematic-animations-phase3-css')){
    var link=document.createElement('link');
    link.id='omega-cinematic-animations-phase3-css'; link.rel='stylesheet';
    link.href='/css/omega-cinematic-animations-phase3.css'; link.type='text/css';
    head.appendChild(link);
  }
})();

/* Omega-GVP: ambient noise overlay + cursor-reactive glass light.
   Pure progressive enhancement -- no functional dependency, safe no-op
   if it runs twice. Cursor tracking is passive + rAF-throttled (one
   getBoundingClientRect per animation frame, only while hovering a
   matched .card/.kpi/.glass element) to stay GPU-cheap. */
(function(){
  /* compound `document.body && ...` guard, so the sweep that converted the 89
     plain guards above did not reach it -- this one dropped the overlay on the
     same head-loading pages. getElementById works with no body (returns null),
     so only the append needs queueing. */
  if(!document.getElementById('omega-noise-overlay')){
    var n=document.createElement('div');
    n.id='omega-noise-overlay';
    n.setAttribute('aria-hidden','true');
    __omegaAppend(n);
  }
  /* Atmospheric depth field. body is a flat fill of --void on every page, so
     the platform had no luminance range at all: the particle canvas
     (#omega-atmosphere, omega-genesis.js) drew stars, but against a uniform
     background they read as specks on black rather than depth.

     Injected as a real element for the same reason the noise overlay is --
     cosmos/family/offline/reset/terms already define their own body::before,
     so a bare pseudo-element rule would collide with five pages. Kept at
     z-index 0, matching #omega-atmosphere: both are behind content, and DOM
     order then puts the particles in front of this gradient, which is the
     intended stacking. pointer-events:none so it never takes a click. */
  if(!document.getElementById('omega-depth-field')){
    var df=document.createElement('div');
    df.id='omega-depth-field';
    df.setAttribute('aria-hidden','true');
    __omegaAppend(df);
  }
  var sel='.card,.kpi,.kpi-card,.glass,.glass-cyan';
  var raf=null, lastEvt=null;
  function apply(){
    raf=null;
    if(!lastEvt) return;
    var el = lastEvt.target && lastEvt.target.closest ? lastEvt.target.closest(sel) : null;
    if(!el) return;
    var r=el.getBoundingClientRect();
    el.style.setProperty('--mx',(lastEvt.clientX-r.left)+'px');
    el.style.setProperty('--my',(lastEvt.clientY-r.top)+'px');
  }
  document.addEventListener('pointermove',function(e){
    lastEvt=e;
    if(!raf) raf=requestAnimationFrame(apply);
  },{passive:true});

  /* Ω-HORIZON v2: drive --sy (0..1 down the page) for the depth field's
     parallax. Same shape as the pointer handler above deliberately -- one
     passive listener, rAF-throttled, writing a custom property and nothing
     else. It reads scrollY and clientHeight only, never a per-element
     getBoundingClientRect, so it cannot cause layout thrash however long the
     page is.

     Skipped entirely under prefers-reduced-motion rather than merely
     neutralised in CSS: with no listener there is no work at all, and a user
     who asked for less motion should not pay for a rAF loop that computes a
     value the stylesheet then throws away. */
  if(!(window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches)){
    var sraf=null;
    function applyScroll(){
      sraf=null;
      var doc=document.documentElement;
      var max=(doc.scrollHeight-doc.clientHeight)||1;
      var y=(window.scrollY||doc.scrollTop||0)/max;
      doc.style.setProperty('--sy', (y<0?0:y>1?1:y).toFixed(4));
    }
    window.addEventListener('scroll',function(){
      if(!sraf) sraf=requestAnimationFrame(applyScroll);
    },{passive:true});
    applyScroll();
  }
})();

/* ===== FLAG GATE: hide first, reveal on a confirmed flag ====================
   Same reasoning as the approval guard below, for the same reason it exists.
   omega-flags.js does the RPC and the reveal, but it is injected as a dynamic
   script and therefore loads ASYNCHRONOUSLY -- it cannot be relied on to have
   parsed before `omega-approved` reveals the shell. So the hide rule is written
   here, synchronously, where the guard's own rule is written.

   Unlike the approval guard this is NOT skipped on public pages: a signed-out
   visitor must not see a dormant revenue figure either. Revealing is an
   attribute flip (`data-omega-flag-on`) that only omega-flags.js performs, and
   only after `get_platform_flag` answers true. If that module never loads, the
   gated content stays hidden -- which is the correct failure direction.
   ========================================================================== */
(function(){try{
  if(document.getElementById('omega-flag-css')) return;
  var fs=document.createElement('style');
  fs.id='omega-flag-css';
  fs.textContent='[data-omega-flag]:not([data-omega-flag-on]){display:none!important}'+
    '.omega-flag-dormant{border:1px solid rgba(201,168,76,.18);background:rgba(201,168,76,.04);'+
    'border-radius:4px;padding:14px 16px;font-family:var(--M,monospace);font-size:12px;'+
    'line-height:1.7;color:var(--muted,rgba(138,134,118,.7))}'+
    '.omega-flag-dormant b{display:block;font-size:12px;letter-spacing:2.5px;'+
    'color:var(--gold,#C9A84C);margin-bottom:6px;font-weight:400}'+
    '.omega-flag-dormant code{color:var(--ink,rgba(220,210,180,.8))}';
  (document.head||document.documentElement).appendChild(fs);
}catch(e){}})();
/* ═══════════════════════════════════════════════════════════════════════════
   Phase C/D GLOBAL ACTIVATION — CINEMATIC VISUAL EVOLUTION v2
   Wires all 8 archetype, emblem, motion and density systems globally on every
   page. Adds cinematic 3D transforms, parallax, scroll-reactive lighting,
   and aggressive motion saturation with zero page changes needed.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  if(window.__omegaPhaseCD_active) return;
  window.__omegaPhaseCD_active = true;

  function activateCinematicDesign(){
    /* 1. AUTO-DETECT ARCHETYPE AND APPLY SYSTEM */
    if(window.OmegaArchetype && typeof window.OmegaArchetype.applyToPage === 'function'){
      if(document.body) window.OmegaArchetype.applyToPage(document.body);
    }

    /* 2. GLOBAL MOTION ACTIVATION */
    if(window.OmegaArchetypeMotion && typeof window.OmegaArchetypeMotion.activateGlobally === 'function'){
      window.OmegaArchetypeMotion.activateGlobally();
    }

    /* 3. APPLY VISUAL DENSITY BASED ON ARCHETYPE */
    if(window.OmegaArchetypeSurfaces && typeof window.OmegaArchetypeSurfaces.applyDensity === 'function'){
      var arch = document.body.getAttribute('data-archetype') || 'neutral';
      var densityMap = {
        'sentinel':'regular', 'merchant':'comfortable', 'scout':'sparse',
        'warden':'dense', 'sovereign':'ultra', 'auditor':'regular',
        'proxy':'comfortable', 'oracle':'sparse', 'beacon':'comfortable',
        'analyst':'regular', 'tutor':'comfortable', 'historian':'sparse'
      };
      window.OmegaArchetypeSurfaces.applyDensity(densityMap[arch] || 'regular');
    }

    /* 4. RENDER EMBLEMS ACROSS THE PAGE */
    if(window.OmegaEmblemIntegration && typeof window.OmegaEmblemIntegration.renderEmblems === 'function'){
      window.OmegaEmblemIntegration.renderEmblems();
    }

    /* 5. DETECT ALL PLATFORM CAPABILITIES */
    if(window.OmegaPageFeatures && typeof window.OmegaPageFeatures.detectAllCapabilities === 'function'){
      window.OmegaPageFeatures.detectAllCapabilities();
    }

    /* 6. CINEMATIC MOTION ON ALL INTERACTIVE ELEMENTS */
    var interactiveElements = document.querySelectorAll('button, a, [role="button"], .card, .kpi, .btn, [class*="card"], input, select, textarea');
    interactiveElements.forEach(function(el){
      /* Wire each element ONCE. Without this flag the MutationObserver below
         re-ran the whole activation on every DOM insertion and attached a fresh
         pair of closures every time -- measured on dashboard.html at 62,245
         hover listeners for 580 elements on load alone, with ten ordinary
         insertions adding 4,640 more. */
      if (el.__omgCdWired) return;
      el.__omgCdWired = 1;
      /* An explicit property list, not `all`: `transition:all` inline animates
         every property including layout ones, and beats the design system's own
         transitions on .card, .kpi and .btn, which bg.js and
         omega-visual-evolution.css already own. */
      el.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.18s ease';
      el.style.transformStyle = 'preserve-3d';
      /* No will-change here: it was promoting all 580 matched elements to their
         own compositing layer at once, which costs far more than the hover
         transform it was meant to smooth. */

      /* Hover: 3D tilt + lift + glow */
      el.addEventListener('mouseenter', function(){
        if(!el.classList.contains('omg-no-tilt')){
          el.style.transform = 'perspective(1000px) translateZ(8px) rotateX(2deg) rotateY(-2deg)';
        }
        if(window.OmegaArchetypeMotion && typeof window.OmegaArchetypeMotion.activateMotion === 'function'){
          window.OmegaArchetypeMotion.activateMotion(el);
        }
      });

      el.addEventListener('mouseleave', function(){
        el.style.transform = 'perspective(1000px) translateZ(0) rotateX(0) rotateY(0)';
      });

      /* Scroll-reactive parallax on cards */
      if(el.classList.contains('card') || el.classList.contains('kpi') || el.classList.contains('kpi-card')){
        el.setAttribute('data-parallax', '1');
      }
    });

    /* 7. SCROLL-REACTIVE 3D PARALLAX ON CARDS */
    var parallaxElements = document.querySelectorAll('[data-parallax="1"]');
    /* Bind once. This sat inside the activation, so every DOM insertion added
       another scroll listener, each one walking every parallax element on every
       scroll event. */
    if(parallaxElements.length > 0 && window.requestAnimationFrame && !window.__omgCdScrollBound){
      window.__omgCdScrollBound = 1;
      window.addEventListener('scroll', function(){
        parallaxElements = document.querySelectorAll('[data-parallax="1"]');
        var scrollY = window.scrollY || 0;
        parallaxElements.forEach(function(el){
          var rect = el.getBoundingClientRect();
          var elementCenter = rect.top + rect.height / 2;
          var screenCenter = window.innerHeight / 2;
          var distance = (screenCenter - elementCenter) / window.innerHeight;
          var rotX = Math.max(-6, Math.min(6, distance * 12));
          var scale = 1 + Math.abs(distance) * 0.04;
          el.style.transform = 'perspective(800px) rotateX('+rotX.toFixed(2)+'deg) scale('+scale.toFixed(3)+')';
        });
      }, {passive: true});
    }

    /* 8. EMBLEM ANIMATION ON PAGE (if Ω sigil exists, spin it) */
    var omegaSigils = document.querySelectorAll('[class*="sigil"], [class*="emblem-mark"], #ph-sigil');
    omegaSigils.forEach(function(el){
      if(!el.classList.contains('omega-spin-slow')){
        el.classList.add('omega-spin-slow');
      }
    });

    /* 9. GLOW ANIMATION ON FEATURED CARDS */
    var featuredCards = document.querySelectorAll('.card[data-featured], .kpi-card[data-featured], .glass[data-featured]');
    featuredCards.forEach(function(el){
      el.style.animation = 'cinematic-glow 4s ease-in-out infinite';
    });
  }

  /* INJECT CINEMATIC GLOW KEYFRAME */
  if(!document.getElementById('omg-cinematic-css')){
    var cinemaStyle = document.createElement('style');
    cinemaStyle.id = 'omg-cinematic-css';
    cinemaStyle.textContent = `
      @keyframes cinematic-glow{
        0%, 100%{
          box-shadow: 0 0 20px -4px rgba(201,168,76,.3),
                      inset 0 1px 0 rgba(255,255,255,.055)
        }
        50%{
          box-shadow: 0 0 40px 0px rgba(201,168,76,.5),
                      0 12px 32px rgba(0,0,0,.5),
                      inset 0 1px 0 rgba(255,255,255,.09)
        }
      }
      @keyframes cinematic-shimmer{
        0%{background-position: -1000px 0}
        100%{background-position: 1000px 0}
      }
      .cinematic-motion{
        animation: cinematic-shimmer 3s ease-in-out infinite;
      }
    `;
    (document.head || document.documentElement).appendChild(cinemaStyle);
  }

  /* ACTIVATE ONCE THERE IS A BODY TO ACT ON.
     `readyState !== 'loading'` does NOT imply document.body exists, and every
     entry point below touches it -- applyToPage(document.body), a
     document-wide querySelectorAll, and observe(document.body). bg.js is
     loaded from <head> on much of the estate, so this ran with body === null
     and threw "parameter 1 is not of type 'Node'", which killed the rest of
     bg.js on 40 pages: 38 with an uncaught error and 2 whose approval guard
     then never lifted. CLAUDE.md 8.1 class 5a, which is why bg.js routes its
     own injections through __omegaAppend(). */
  function whenBodyReady(fn){
    if(document.body){ fn(); return; }
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      /* Parsed but bodyless: poll the next frames rather than give up. */
      var tries = 0;
      (function wait(){
        if(document.body) return fn();
        if(++tries > 60) return;
        (window.requestAnimationFrame || setTimeout)(wait, 16);
      })();
    }
  }
  whenBodyReady(function(){ setTimeout(activateCinematicDesign, 50); });

  /* REACTIVATE ON DYNAMIC CONTENT INSERTION */
  if(window.MutationObserver){
    /* Coalesced to one run per frame. Unthrottled, a page that renders a list
       ran the full document-wide querySelectorAll once per inserted node. */
    var queued = false;
    var observer = new MutationObserver(function(){
      if (queued) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(function(){
        queued = false;
        activateCinematicDesign();
      });
    });
    whenBodyReady(function(){ observer.observe(document.body, { childList: true, subtree: true }); });
  }
})();

  try{
    /* Must stay in step with the ACCESS GUARD's own EX list further down
       (search "ACCESS GUARD + TRIAL ENGINE"). They had drifted: EX exempted
       'charter' and this list did not, so charter.html got the hiding CSS while
       the code that lifts it returned early -- the page rendered nothing, for
       anyone, permanently. charter.html makes zero Supabase calls; it is static
       governance text sitting beside terms in that same EX list, so the two are
       reconciled in this direction. Changing either list means changing both.
       CLAUDE.md 8.1 class 8 (two divergent copies of one canonical list). */
    var PUBLIC = ['/account','/enter','/reset','/terms','/pending','/index','/','/charter'];
    var path = (location.pathname || '/').replace(/\.html$/,'');
    for (var i=0;i<PUBLIC.length;i++){ if (path === PUBLIC[i]) return; }

    var s=document.createElement('style');
    s.id='omega-approval-guard';
    s.textContent='body:not(.omega-approved) #app,'+
                  'body:not(.omega-approved) .shell,'+
                  'body:not(.omega-approved) main.main{display:none!important}';
    (document.head||document.documentElement).appendChild(s);

    /* Safety valve: if the check cannot complete (offline, RPC down) we do NOT
       silently reveal. We send the member somewhere honest instead. */
    window.__omegaApprove = function(ok){
      if (ok) document.body && document.body.classList.add('omega-approved');
    };
  }catch(e){}
})();

/* ===== SHARED SUPABASE CLIENT (must be defined before anything loads) ======
   Ten shared scripts each called createClient(), producing nine GoTrueClient
   instances on one page load, all competing for the same auth-token storage
   key. Supabase warns this "may produce undefined behavior when used
   concurrently" -- a token refresh from one client can invalidate another's
   in-flight request, intermittently and very hard to trace.

   Defined inline here rather than loaded as a file because bg.js injects the
   omega-* scripts dynamically; a separate file would race them. Callers keep
   their own createClient() fallback, so if this ever fails they behave exactly
   as before.
   ========================================================================= */

  /* Ω SPATIAL REALMS — additive loader; WebGL remains owned by omega-sculpture.js. */
  if (!document.querySelector('[data-omega-spatial-realms-js]')) {
    var _osr = document.createElement('script');
    _osr.src = '/omega-spatial-realms.js';
    _osr.setAttribute('data-omega-spatial-realms-js', '1');
    _osr.defer = true;
    (document.head || document.documentElement).appendChild(_osr);
  }
(function () {
  if (window.OmegaSB) return;
  var URL = "https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var KEY = "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";
  var _p = null;
  /* Compatibility slot for the knowledge-graph and council code.

     Eleven files read `window.OmegaSupabase.sb`, and exactly ONE ever assigned
     it: graphify.html:168. Confirmed by rendering all nine consumer pages --
     OmegaSupabase was `undefined` on eight of them (intelligence, graph-admin,
     graph-explorer, graph-timeline, graph-anomalies, graph-centrality,
     graph-evidence, council) while window.OmegaSB was present on every one.

     So that whole feature set has never initialised anywhere but graphify.html.
     graph-admin.html:83 does `if(!window.OmegaSupabase){setTimeout(init,100);
     return;}` -- it has been re-polling every 100ms forever, never advancing.
     It also means the column bugs in those pages could never surface as
     symptoms: the code never got far enough to issue a query.

     Publishing here rather than editing eleven call sites keeps one source of
     truth for the client (still window.__omegaSb) and fixes every consumer at
     once. Deliberately NOT resolved eagerly: that would add an esm.sh import to
     public pages that currently never build a client. Gated pages already call
     get() during the approval-guard check, which is well before any page
     script reads the slot. */
  function publish(sb) {
    if (!window.OmegaSupabase) window.OmegaSupabase = { sb: sb };
    else if (!window.OmegaSupabase.sb) window.OmegaSupabase.sb = sb;
    return sb;
  }
  function get() {
    /* A page module may already have built a client (window.__omegaSb). Which
       runs first depends on where bg.js sits relative to the module, so BOTH
       directions must converge on the same slot -- otherwise the page builds
       one, this builds another, and two GoTrueClients share the storage key. */
    if (window.__omegaSb) return Promise.resolve(publish(window.__omegaSb));
    if (_p) return _p;
    _p = import('/vendor/supabase-js.js').then(function (mod) {
      var cc = mod.createClient || (mod.default && mod.default.createClient);
      if (!cc) throw new Error('supabase createClient unavailable');
      /* publish it so any page module loading later reuses this one */
      window.__omegaSb = window.__omegaSb || cc(URL, KEY);
      return publish(window.__omegaSb);
    }).catch(function (e) { _p = null; throw e; });
    return _p;
  }
  window.OmegaSB = { get: get, url: URL, key: KEY };
})();

(function(){try{var m=document.createElement('meta');m.name='robots';m.content='noindex,nofollow,noarchive';(document.head||document.documentElement).appendChild(m);}catch(e){}})();

/* ===== CLIENT ERROR MONITORING =============================================
   Runtime failures on the live site were invisible: a member hit a broken
   page, nothing was recorded, and the only way it surfaced was a screenshot.
   Static analysis cannot find these -- a syntactically perfect script still
   throws when an element is missing or data arrives in an unexpected shape.

   Reports to public.report_client_error (own database, not a third party).
   Safety rules, because a logger that misbehaves is worse than none:
     - never reports an error raised by this block itself (recursion guard)
     - de-duplicates by signature, so one error in a loop logs once
     - hard cap of 5 unique errors per page load
     - fails silently if the RPC or network is unavailable
     - sends no form data, tokens, or page text -- message/source/line only
   ========================================================================= */

/* =========================================================================
   SILENT-WRITE GUARD  --  window.__omegaWriteFail(op, result) -> boolean
   Supabase RESOLVES to {data:null,error}; it does not throw. So a failed
   write takes the success path unless the result is inspected, and a
   try/catch around one catches nothing. That is the single most repeated
   root cause of real bugs in this repo (CLAUDE.md section 8.1, class 1).
   Every non-read call in this file routes its result through here, so a
   failure is recorded instead of lost. Returns true when the write failed,
   so a caller can branch on it.
   Deliberately never throws: observability must not break its caller, and
   window.omegaRuntime is absent until assets/js/omega-runtime-observability.js
   loads (the built artifact injects it; a raw source page may not have it).
   ========================================================================= */
(function () {
  'use strict';
  if (window.__omegaWriteFail) return;
  window.__omegaWriteFail = function (op, res) {
    var err = res && res.error;
    if (!err) return false;
    try {
      if (window.omegaRuntime && typeof window.omegaRuntime.record === 'function') {
        window.omegaRuntime.record('write_failed', {
          op: String(op).slice(0, 64),
          code: err.code || '',
          message: String(err.message || '').slice(0, 200)
        });
      }
    } catch (e) { /* never let recording a failure become a second failure */ }
    return true;
  };
})();

(function () {
  'use strict';
  if (window.__omegaErrHooked) return;
  window.__omegaErrHooked = true;

  var MAX_PER_LOAD = 5;
  var seen = {}, sent = 0, busy = false;

  function signature(msg, src, line) { return (msg || '') + '|' + (src || '') + '|' + (line || ''); }

  function report(kind, msg, src, line, col, stack) {
    try {
      if (busy || sent >= MAX_PER_LOAD) return;
      msg = String(msg || '').slice(0, 500);
      if (!msg) return;
      /* ignore noise we cannot act on and errors from this reporter */
      if (msg.indexOf('__omegaErr') !== -1) return;
      if (msg === 'Script error.' && !src) return;   // opaque cross-origin
      var sig = signature(msg, src, line);
      if (seen[sig]) return;
      seen[sig] = 1; sent++;
      busy = true;

      window.OmegaSB.get().then(function (sb) {
        return sb.rpc('report_client_error', {
          p_page: String(location.pathname || '').slice(0, 300),
          p_message: msg,
          p_source: String(src || '').slice(0, 300),
          p_line: line || null,
          p_col: col || null,
          p_stack: String(stack || '').slice(0, 2000),
          p_kind: kind,
          p_ua: String(navigator.userAgent || '').slice(0, 300)
        });
      }).then(function () { busy = false; })
        .catch(function () { busy = false; });   /* never surface a logging failure */
    } catch (e) { busy = false; }
  }

  window.addEventListener('error', function (ev) {
    try {
      report('error', ev && ev.message, ev && ev.filename, ev && ev.lineno, ev && ev.colno,
             ev && ev.error && ev.error.stack);
    } catch (e) {}
  });

  window.addEventListener('unhandledrejection', function (ev) {
    try {
      var r = ev && ev.reason;
      report('unhandledrejection',
             (r && (r.message || r.error_description)) || String(r),
             '', null, null, r && r.stack);
    } catch (e) {}
  });
})();

/* ===== PWA: make every page installable on mobile =====
   manifest.json + icons existed but only 2 of 80 pages linked them, so the
   "Add to Home Screen" prompt never appeared anywhere else. Injecting the
   tags here covers every page that loads bg.js, with no per-file edits.
   NOTE: sw.js is deliberately a cache KILL-SWITCH (it unregisters itself),
   so this gives an installable home-screen app -- not offline caching. */
(function(){
  try{
    var head = document.head || document.documentElement;
    function add(tag, attrs){
      for (var sel in attrs){ break; }
      var el = document.createElement(tag);
      for (var k in attrs){ el.setAttribute(k, attrs[k]); }
      head.appendChild(el);
    }
    if(!document.querySelector('link[rel="manifest"]'))
      add('link', {rel:'manifest', href:'/manifest.json'});
    if(!document.querySelector('meta[name="theme-color"]'))
      add('meta', {name:'theme-color', content:'#C9A84C'});
    if(!document.querySelector('link[rel="apple-touch-icon"]'))
      add('link', {rel:'apple-touch-icon', href:'/icon-192.png'});
    if(!document.querySelector('meta[name="apple-mobile-web-app-capable"]')){
      add('meta', {name:'mobile-web-app-capable', content:'yes'});
      add('meta', {name:'apple-mobile-web-app-capable', content:'yes'});
      add('meta', {name:'apple-mobile-web-app-status-bar-style', content:'black-translucent'});
      add('meta', {name:'apple-mobile-web-app-title', content:'OMEGA'});
    }
    if(!document.querySelector('link[rel="icon"]'))
      add('link', {rel:'icon', type:'image/png', href:'/icon-192.png'});
  }catch(e){}
})();
/* ===== MOBILE GLOBAL FIXES -- ALL PAGES ===== */
(function(){
  var s=document.createElement('style');
  s.textContent=[
    /* Touch targets -- all buttons at least 44px */
    '@media(max-width:760px){',
    '.tab-btn{padding:14px 10px;min-height:48px}',
    '.btn-primary,.btn-add,.btn-book,.btn-save{width:100%;padding:14px;font-size:13px;text-align:center}',
    /* Mobile sidebar hidden, main takes full width */
    'aside.omega-side,aside.side{display:none!important}',
    '.main{padding-left:0!important;padding-right:0!important}',
    '.shell{flex-direction:column}',
    /* Content grids stack on mobile */
    '.content-grid{grid-template-columns:1fr!important}',
    '.col-side{display:none}',
    /* Metrics band 2-col on mobile */
    '.metrics-band{grid-template-columns:1fr 1fr}',
    '.metrics-band .mb-item:nth-child(2n){border-right:none}',
    /* Card grids minimum 1 column */
    '.domains-grid,.franchise-grid,.trophy-grid,.ach-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}',
    '.nft-gallery{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}',
    /* Topbar font size */
    '.topbar .t{font-size:15px}',
    /* Agent mesh canvas height */
    '#mesh-cv{height:180px}',
    /* Search bar full width */
    '.search-bar{padding:10px 14px}',
    '.sb-input{font-size:13px;padding:10px 36px 10px 12px}',
    /* Profile hero compact */
    '.ph-inner{flex-direction:column;padding:80px 14px 20px}',
    '.profile-hero{min-height:auto}',
    /* Matrix strip stack */
    '.matrix-strip{flex-direction:column}',
    '.ms-axis{border-right:none;border-bottom:1px solid rgba(201,168,76,.12)}',
    /* Constellation canvas height */
    '#constellation-cv,#con-cv{height:220px}',
    /* family roles single column */
    '.family-roles,.status-grid{grid-template-columns:1fr}',
    /* Tab nav scroll */
    '.tab-nav{overflow-x:auto;scrollbar-width:none}',
    '.tab-nav::-webkit-scrollbar{display:none}',
    '.tab-btn{min-width:80px;flex-shrink:0}',
    /* Gate canvas */
    '#gate-cv{height:80px}',
    /* Console grid single col */
    '.console-grid{grid-template-columns:1fr}',
    /* Period row wrap */
    '.period-row{gap:4px}',
    '.pr-opt{padding:7px 9px;font-size:12px}',
    /* Member row stack */
    '.mbr-row{flex-direction:column;align-items:flex-start}',
    '.mbr-actions{width:100%;justify-content:flex-start}',
    '}',
    /* ===== SHARED HEADER COMPONENTS -- centralizes .topbar (54 pages) and .hero-band ===== */
    /* (6 pages), previously each page carried its own separate (and drifting) copy.    */
    '.topbar{border-bottom:1px solid rgba(201,168,76,.16);padding:20px clamp(14px,3vw,36px);background:rgba(8,8,15,.9)}',
    '.topbar .t{font-family:"Cinzel Decorative",serif;font-weight:700;color:#C9A84C;font-size:clamp(18px,3vw,26px);letter-spacing:2px}',
    '.topbar .t small{display:block;font-family:"Courier Prime",monospace;font-size:12px;color:#85837b;letter-spacing:3px;margin-top:4px}',
    '.hero-band{padding:3rem 2rem 2rem;max-width:1400px;margin:0 auto}',
    /* ===== ACCESSIBILITY -- ALL PAGES (WCAG 2.3.3 + 2.4.7) ===== */
    /* Visible keyboard focus everywhere, not reliant on each page defining its own */
    ':focus-visible{outline:2px solid #00E5FF!important;outline-offset:2px!important}',
    'a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid #00E5FF!important;outline-offset:2px!important;border-radius:2px}',
    /* Respect prefers-reduced-motion sitewide -- stop/shorten CSS animations & transitions */
    '@media(prefers-reduced-motion:reduce){',
    '*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}',
    '}',
  ].join('');
  (document.head||document.documentElement).appendChild(s);
})();

/* bg.js     SYD OMEGA 91717     aurora backdrop + access guard + trial engine + UI injections */
(function(){try{var c=localStorage.getItem("omega_bg");if(c){document.documentElement.style.setProperty("--void",c);document.body&&(document.body.style.background=c);}}catch(e){} })();
(function(){
  if(document.getElementById('omega-bg'))return;
  var cv=document.createElement('canvas');cv.id='omega-bg';
  cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  function attach(){if(document.body){document.body.appendChild(cv);start();}else{requestAnimationFrame(attach);}}
  var ctx=cv.getContext('2d');var W=0,H=0,DPR=Math.min(window.devicePixelRatio||1,2);
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P=[],t=0,raf=null;
  function resize(){W=window.innerWidth;H=window.innerHeight;cv.width=Math.floor(W*DPR);cv.height=Math.floor(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);}
  function init(){var n=Math.max(28,Math.min(66,Math.floor((W*H)/22000)));P=[];for(var i=0;i<n;i++){var depth=0.35+Math.random()*0.65;P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.16*depth,vy:(Math.random()-0.5)*0.16*depth,r:(0.5+Math.random()*1.5)*depth,d:depth,ph:Math.random()*6.283,gold:Math.random()<0.74});}}
  function aurora(){var cx=W*0.5,cy=H*0.42,rad=Math.max(W,H)*0.55;var ax=cx+Math.cos(t*0.6)*W*0.22,ay=cy+Math.sin(t*0.5)*H*0.18;var g1=ctx.createRadialGradient(ax,ay,10,ax,ay,rad);g1.addColorStop(0,'rgba(201,168,76,0.075)');g1.addColorStop(0.5,'rgba(201,168,76,0.022)');g1.addColorStop(1,'rgba(7,7,11,0)');ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);var bx=cx+Math.cos(-t*0.45+2.1)*W*0.26,by=cy+Math.sin(-t*0.55+1.3)*H*0.2;var g2=ctx.createRadialGradient(bx,by,10,bx,by,rad*0.9);g2.addColorStop(0,'rgba(0,229,255,0.05)');g2.addColorStop(0.5,'rgba(0,229,255,0.015)');g2.addColorStop(1,'rgba(7,7,11,0)');ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);var ex=W*0.82,ey=H*0.82;var g3=ctx.createRadialGradient(ex,ey,10,ex,ey,rad*0.6);g3.addColorStop(0,'rgba(139,0,0,0.05)');g3.addColorStop(1,'rgba(7,7,11,0)');ctx.fillStyle=g3;ctx.fillRect(0,0,W,H);}
  function ring(){var cx=W*0.5,cy=H*0.4,R=Math.min(W,H)*0.32;ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.25);for(var k=0;k<2;k++){ctx.beginPath();ctx.ellipse(0,0,R*(1+k*0.16),R*0.34*(1+k*0.16),0,0,Math.PI*2);ctx.strokeStyle='rgba(201,168,76,'+(0.05-k*0.018).toFixed(3)+')';ctx.lineWidth=1;ctx.stroke();}ctx.restore();}
  function draw(){ctx.clearRect(0,0,W,H);aurora();if(!reduce)ring();var i,j;if(!reduce){for(i=0;i<P.length;i++){var p=P[i];p.x+=p.vx;p.y+=p.vy;if(p.x<-10)p.x=W+10;if(p.x>W+10)p.x=-10;if(p.y<-10)p.y=H+10;if(p.y>H+10)p.y=-10;}}ctx.lineWidth=0.5;for(i=0;i<P.length;i++){for(j=i+1;j<P.length;j++){var a=P[i],b=P[j];var dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2<13000){var al=(1-d2/13000)*0.11*Math.min(a.d,b.d);ctx.strokeStyle='rgba(201,168,76,'+al.toFixed(3)+')';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}for(i=0;i<P.length;i++){var q=P[i];var tw=reduce?1:(0.55+0.45*Math.sin(t*2.2+q.ph));ctx.beginPath();ctx.fillStyle=q.gold?'rgba(201,168,76,'+((0.45*q.d+0.15)*tw).toFixed(3)+')':'rgba(0,229,255,'+((0.4*q.d+0.1)*tw).toFixed(3)+')';ctx.shadowColor=q.gold?'rgba(201,168,76,0.5)':'rgba(0,229,255,0.45)';ctx.shadowBlur=7*q.d;ctx.arc(q.x,q.y,q.r,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;}
  function loop(){t+=0.004;draw();raf=requestAnimationFrame(loop);}
  function start(){resize();init();if(reduce){draw();}else{if(raf)cancelAnimationFrame(raf);loop();}}
  window.addEventListener('resize',function(){resize();init();if(reduce)draw();});
  attach();
})();

/* Emblem loader */
(function(){ /* Sovereign protection — loads first */
if(!document.querySelector('script[data-omega-protect]')){var sp=document.createElement('script');sp.src='/omega-protect.js';sp.setAttribute('data-omega-protect','1');if(document.head)document.head.appendChild(sp);}
if(!document.querySelector('script[data-omega-theme]')){ var s=document.createElement('script'); s.src='/theme.js'; s.setAttribute('data-omega-theme','1'); (document.body||document.documentElement).appendChild(s); } })();

(function(){if(!document.querySelector('script[data-omega-emblem]')){var s=document.createElement('script');s.src='/emblem.js';s.setAttribute('data-omega-emblem','1');(document.body||document.documentElement).appendChild(s);}})();

/* Sidebar navigation -- renders into <aside id="omega-side">. A handful of
   pages still carry their own explicit <script src="/nav.js"> tag (no
   data-omega-nav marker) from before this injection existed; nav.js itself
   has no double-run guard, so this checks for either form to avoid
   rendering the sidebar twice on those pages. */
(function(){if(!document.querySelector('script[data-omega-nav],script[src="/nav.js"]')){var s=document.createElement('script');s.src='/nav.js';s.setAttribute('data-omega-nav','1');(document.body||document.documentElement).appendChild(s);}})();

/* Audio engine (Web Audio oscillators). Its own visible button is disabled --
   omega-controls.js's unified dock is the one on-screen SOUND control. */
(function(){if(!document.querySelector('script[data-omega-audio]')){var s=document.createElement('script');s.src='/audio.js';s.setAttribute('data-omega-audio','1');__omegaAppend(s);}})();
/* ===== MULTI-LANGUAGE -- translation engine on every page (EN / AR-RTL / FR / ES).
   Its own visible language box is disabled -- same reason as above. ===== */
(function(){if(!document.querySelector('script[data-omega-i18n]')){var s=document.createElement('script');s.src='/i18n.js';s.setAttribute('data-omega-i18n','1');__omegaAppend(s);}

  /* Ctrl+K search overlay */
  if(!document.querySelector('script[data-omega-search]')){
    var _s_data_omega_search=document.createElement('script');
    _s_data_omega_search.src='/omega-search.js';
    _s_data_omega_search.setAttribute('data-omega-search','1');
    _s_data_omega_search.defer=true;
    __omegaAppend(_s_data_omega_search);
  }
  /* Notification engine with badge */
  if(!document.querySelector('script[data-omega-notify]')){
    var _s_data_omega_notify=document.createElement('script');
    _s_data_omega_notify.src='/omega-notify.js';
    _s_data_omega_notify.setAttribute('data-omega-notify','1');
    _s_data_omega_notify.defer=true;
    __omegaAppend(_s_data_omega_notify);
  }
  /* AI concierge GraphRAG bridge */
  if(!document.querySelector('script[data-omega-ai]')){
    var _s_data_omega_ai=document.createElement('script');
    _s_data_omega_ai.src='/omega-ai.js';
    _s_data_omega_ai.setAttribute('data-omega-ai','1');
    _s_data_omega_ai.defer=true;
    __omegaAppend(_s_data_omega_ai);
  }
  /* Google Core Web Vitals monitor */
  if(!document.querySelector('script[data-omega-metrics]')){
    var _s_data_omega_metrics=document.createElement('script');
    _s_data_omega_metrics.src='/omega-metrics.js';
    _s_data_omega_metrics.setAttribute('data-omega-metrics','1');
    _s_data_omega_metrics.defer=true;
    __omegaAppend(_s_data_omega_metrics);
  }
  /* Zodiac/element first-run flow */
  if(!document.querySelector('script[data-omega-onboard]')){
    var _s_data_omega_onboard=document.createElement('script');
    _s_data_omega_onboard.src='/omega-onboard.js';
    _s_data_omega_onboard.setAttribute('data-omega-onboard','1');
    _s_data_omega_onboard.defer=true;
    __omegaAppend(_s_data_omega_onboard);
  }
  /* SDT gamification + gate celebrations */
  if(!document.querySelector('script[data-omega-sdt]')){
    var _s_data_omega_sdt=document.createElement('script');
    _s_data_omega_sdt.src='/omega-sdt.js';
    _s_data_omega_sdt.setAttribute('data-omega-sdt','1');
    _s_data_omega_sdt.defer=true;
    __omegaAppend(_s_data_omega_sdt);
  }
  if(!document.querySelector('script[data-omega-user]')){var su=document.createElement('script');su.src='/omega-user.js';su.setAttribute('data-omega-user','1');su.defer=true;__omegaAppend(su);}
if(!document.querySelector('script[data-omega-chrono]')){var sc=document.createElement('script');sc.src='/omega-chrono.js';sc.setAttribute('data-omega-chrono','1');sc.defer=true;__omegaAppend(sc);}
if(!document.querySelector('script[data-omega-matrix]')){var sm=document.createElement('script');sm.src='/omega-matrix.js';sm.setAttribute('data-omega-matrix','1');sm.defer=true;__omegaAppend(sm);}
if(!document.querySelector('script[data-omega-lattice-3d]')){var sl3=document.createElement('script');sl3.src='/omega-lattice-3d.js';sl3.setAttribute('data-omega-lattice-3d','1');sl3.defer=true;__omegaAppend(sl3);}
if(!document.querySelector('script[data-omega-lattice]')){var sl=document.createElement('script');sl.src='/omega-lattice.js';sl.setAttribute('data-omega-lattice','1');sl.defer=true;__omegaAppend(sl);}
if(!document.querySelector('script[data-omega-ctrl]')){var sc2=document.createElement('script');sc2.src='/omega-controls.js';sc2.setAttribute('data-omega-ctrl','1');sc2.defer=true;__omegaAppend(sc2);}})();
/* ===== GENESIS VISUAL ENGINE -- make every page alive (armillary, particles, cinematic depth) ===== */
(function(){if(!document.querySelector('script[data-omega-genesis]')){var s=document.createElement('script');s.src='/omega-genesis.js';s.setAttribute('data-omega-genesis','1');__omegaAppend(s);}})();
/* ===== HERO BAND DATA WIRE -- populates ohb-l/ohb-r stat boxes ===== */
(function(){if(!document.querySelector('script[data-omega-hero-wire]')){var s=document.createElement('script');s.src='/omega-hero-wire.js';s.setAttribute('data-omega-hero-wire','1');__omegaAppend(s);}})();
/* ===== SOVEREIGN BACKDROP -- warm element-tinted base, per-page shade ===== */
(function(){if(!document.querySelector('script[data-omega-backdrop]')){var s=document.createElement('script');s.src='/omega-backdrop.js';s.setAttribute('data-omega-backdrop','1');__omegaAppend(s);}})();
/* ===== 12 LIVING EMBLEMS -- per-sign animated marks =====
   The guard is `data-omega-emblem-living`, NOT `data-omega-emblems`. It used
   to be the latter, which is the attribute bg.js:90 already sets when it
   injects `omega-emblems-catalog.js` -- a different module. Line 90 runs
   first, so this querySelector always found its tag and `omega-emblems.js`
   was never injected on any page. Confirmed in a render before the fix: the
   only script holding `data-omega-emblems` was the catalog, and
   `window.OmegaEmblem` (this module's export, singular) was undefined while
   `window.OmegaEmblems` (the catalog's, plural) was an object -- which is
   exactly why the collision read as working.
   Two modules must never share a guard attribute; the guard is the module's
   identity, not the feature area's. */
(function(){if(!document.querySelector('script[data-omega-emblem-living]')){var s=document.createElement('script');s.src='/omega-emblems.js';s.setAttribute('data-omega-emblem-living','1');__omegaAppend(s);}})();

/* Keyboard-operable click targets. Its guard attribute is its OWN identity,
   not the feature area's -- section 8.1 class 5b: two modules behind one
   data-omega-* attribute means the first to run permanently satisfies the
   second's guard and the second never loads on any page. This is distinct
   from data-omega-keyboard (omega-keyboard.js), which is the shortcut engine. */
(function(){if(!document.querySelector('script[data-omega-kbd-operable]')){var s=document.createElement('script');s.src='/omega-a11y-controls.js';s.setAttribute('data-omega-kbd-operable','1');s.defer=true;__omegaAppend(s);}})();
/* ===== SOVEREIGN CONSTELLATION -- the ring-of-emblems diagram ===== */
(function(){if(!document.querySelector('script[data-omega-constellation-js]')){var s=document.createElement('script');s.src='/omega-constellation.js';s.setAttribute('data-omega-constellation-js','1');__omegaAppend(s);}})();
/* Omega-ATLAS: per-page identity (axis colour + hero + procedural sigil).
   Injected on EVERY page with no mount attribute required -- that is the
   point: 200 of 202 pages had no identity mark at all when this was written.
   Its own guard attribute, never shared: two modules behind one data-omega-*
   is CLAUDE.md 8.1 class 5b, which silently killed omega-emblems.js. */
(function(){if(!document.querySelector('script[data-omega-identity-js]')){var s=document.createElement('script');s.src='/omega-identity.js';s.setAttribute('data-omega-identity-js','1');__omegaAppend(s);}})();
/* ===== CONTENT MOTION -- count-up numbers, staggered reveals, tile glow (legible) ===== */
(function(){if(!document.querySelector('script[data-omega-content]')){var s=document.createElement('script');s.src='/omega-content.js';s.setAttribute('data-omega-content','1');__omegaAppend(s);}})();
/* ===== 9D ENGINE -- parallax, holographic glow, cinematic transitions, reactive audio ===== */
(function(){if(!document.querySelector('script[data-omega-9d]')){var s=document.createElement('script');s.src='/omega-9d.js';s.setAttribute('data-omega-9d','1');__omegaAppend(s);}})();
/* ===== COMPONENT SYSTEM -- G12 button/card states + responsive matrix ===== */
(function(){if(!document.querySelector('script[data-omega-components]')){var s=document.createElement('script');s.src='/omega-components.js';s.setAttribute('data-omega-components','1');__omegaAppend(s);}})();
   /* omega-sigil.js was an orphaned HTML page mislabeled with a .js extension.
   Removed from loader; delete the file from the repo. ===== */

/* ===== ELEMENT MOTIFS -- shared thematic animations for the 9 elements ===== */
(function(){if(!document.querySelector('script[data-omega-element-motif]')){var s=document.createElement('script');s.src='/omega-element-motif.js';s.setAttribute('data-omega-element-motif','1');__omegaAppend(s);}})();

/* ===== EMBLEM PANEL -- the emblem-as-function pattern, loaded once, used everywhere ===== */
(function(){if(!document.querySelector('script[data-omega-emblem-panel]')){var s=document.createElement('script');s.src='/omega-emblem-panel.js';s.setAttribute('data-omega-emblem-panel','1');__omegaAppend(s);}})();

/* ===== CANON BADGE -- distinguishes real platform mechanics from lore from fiction ===== */
(function(){if(!document.querySelector('script[data-omega-canon-badge]')){var s=document.createElement('script');s.src='/omega-canon-badge.js';s.setAttribute('data-omega-canon-badge','1');__omegaAppend(s);}})();

/* ===== CHROME COORDINATION -- one layout for feedback/share/language ===== */
/* REMOVED omega-chrome.js — no file on disk; no candidate, no documented purpose. See DECISIONS.md. */

/* ===== PAGE EMBLEM -- a mark derived from each page own lattice/axis ===== */
(function(){if(!document.querySelector('script[data-omega-page-emblem]')){var s=document.createElement('script');s.src='/omega-page-emblem.js';s.setAttribute('data-omega-page-emblem','1');__omegaAppend(s);}})();

/* ===== PER-MEMBER LATTICE MARKER STYLE ===== */
(function(){try{var s=document.createElement('style');s.id='ocl-css';s.textContent=
'[data-canon-lattice]{display:inline-block;font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:1.2px;color:rgba(201,168,76,.72);border:1px solid rgba(201,168,76,.22);border-radius:2px;padding:1px 6px;margin-top:5px;white-space:nowrap}';
(document.head||document.documentElement).appendChild(s);}catch(e){}})();

/* ===== PROGRESSION BRIDGE -- every system advances the matrix the same way ===== */
(function(){if(!document.querySelector('script[data-omega-progress]')){var s=document.createElement('script');s.src='/omega-progress.js';s.setAttribute('data-omega-progress','1');__omegaAppend(s);}})();

/* ===== STREAK FREEZE -- grace-day forgiveness for the local streak pages ===== */
(function(){if(!document.querySelector('script[data-omega-streak-freeze]')){var s=document.createElement('script');s.src='/omega-streak-freeze.js';s.setAttribute('data-omega-streak-freeze','1');__omegaAppend(s);}})();

/* ===== GEOMETRIC SYSTEM -- one spacing scale + canonical grid widths ===== */
(function(){if(!document.querySelector('script[data-omega-geometry]')){var s=document.createElement('script');s.src='/omega-geometry.js';s.setAttribute('data-omega-geometry','1');__omegaAppend(s);}})();

/* ===== MEMBERSHIP CARD -- one component, mounted via [data-membership-card] ===== */
(function(){if(!document.querySelector('script[data-omega-membership]')){var s=document.createElement('script');s.src='/omega-membership.js';s.setAttribute('data-omega-membership','1');__omegaAppend(s);}})();

/* ===== SUBSCRIPTION TIER GATE -- companion to omega-gate.js (matrix gate) ===== */
(function(){if(!document.querySelector('script[data-omega-tier-gate]')){var s=document.createElement('script');s.src='/omega-tier-gate.js';s.setAttribute('data-omega-tier-gate','1');__omegaAppend(s);}})();

/* ===== SIGN CODEX -- real cross-reference: sign -> element/god/gate/token/agent/house ===== */
(function(){if(!document.querySelector('script[data-omega-sign-codex]')){var s=document.createElement('script');s.src='/omega-sign-codex.js';s.setAttribute('data-omega-sign-codex','1');__omegaAppend(s);}})();
/* ===== CANON LOADER -- single source of truth for the 12-fold + 9 elements ===== */
(function(){if(!document.querySelector('script[data-omega-canon]')){var s=document.createElement('script');s.src='/omega-canon.js';s.setAttribute('data-omega-canon','1');__omegaAppend(s);}})();
/* ===== USER APPEARANCE -- member background/text/font ===== */
(function(){if(!document.querySelector('script[data-omega-appearance]')){var s=document.createElement('script');s.src='/omega-appearance.js';s.setAttribute('data-omega-appearance','1');__omegaAppend(s);}})();
/* ===== FEEDBACK WIDGET -- members leave comments + ratings ===== */
(function(){if(!document.querySelector('script[data-omega-feedback]')){var s=document.createElement('script');s.src='/omega-feedback.js';s.setAttribute('data-omega-feedback','1');__omegaAppend(s);}})();
/* ===== APP LAUNCHER -- all pages one tap (mobile + desktop) ===== */
(function(){if(!document.querySelector('script[data-omega-menu]')){var s=document.createElement('script');s.src='/omega-menu.js';s.setAttribute('data-omega-menu','1');__omegaAppend(s);}})();
/* ===== MATRIX CONTENT GATE -- lock content by matrix position (5.1) ===== */
(function(){if(!document.querySelector('script[data-omega-gate]')){var s=document.createElement('script');s.src='/omega-gate.js';s.setAttribute('data-omega-gate','1');__omegaAppend(s);}})();
/* ===== DE-EMOJI -- force all emoji-capable symbols to monochrome emblems ===== */
(function(){if(!document.querySelector('script[data-omega-deemoji]')){var s=document.createElement('script');s.src='/omega-deemoji.js';s.setAttribute('data-omega-deemoji','1');__omegaAppend(s);}})();
/* ===== SHARE LAYER -- broadcast sovereign status to social (section 7) ===== */
(function(){if(!document.querySelector('script[data-omega-share]')){var s=document.createElement('script');s.src='/omega-share.js';s.setAttribute('data-omega-share','1');__omegaAppend(s);}})();

/* ===== GLOBAL MOBILE GUARD -- keeps every page within the phone viewport
   (no sideways scroll from wide panels/tables/media). Scoped to <=760px so the
   desktop layout is untouched; pairs with nav.js's mobile bottom-nav. ===== */
(function(){
  if(document.getElementById('omega-mobile-guard'))return;
  var css='@media(max-width:760px){'
    +'html,body{overflow-x:hidden;max-width:100%}'
    +'.shell{flex-direction:column}'
    +'.main{width:100%;min-width:0}'
    +'img,svg,canvas,video,iframe{max-width:100%;height:auto}'
    +'table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}'
    +'pre,code{white-space:pre-wrap;word-break:break-word}'
    +'.topbar{flex-wrap:wrap;gap:8px}'
    +'.omni,input,select,textarea{max-width:100%}'
    +'}';
  function inject(){var st=document.createElement('style');st.id='omega-mobile-guard';st.textContent=css;(document.head||document.documentElement).appendChild(st);}
  if(document.head)inject(); else document.addEventListener('DOMContentLoaded',inject);
})();

/* ===== DESKTOP BOTTOM-RIGHT LADDER =========================================
   Four independent modules each place a fixed widget in the bottom-right
   corner, and none of them knows about the others:

     omega-share.js      #osh-btn           right:12  bottom:16   38px  z=9000
     omega-copilot.js    #cp-btn            right:24  bottom:24   52px  z=4500
     omega-chrono.js     #omega-ded-widget  right:14  bottom:44   61px  z=1999
     omega-capability.js #omega-cap-badge   right:80  bottom:24   21px  z=200

   Each of those three modules already carries a <=760px override, because the
   collision was found and fixed on a phone -- but the desktop stack was never
   laddered, so all four have always piled into the same ~180x105 corner.
   Measured at 1440x900 on dashboard.html:

     omega-ded-widget   x 1246..1426   y 795..856
     cp-btn             x 1364..1416   y 824..876   overlaps ded-widget by 32px
     osh-btn            x 1333..1428   y 846..884   overlaps cp-btn by 30px
     omega-cap-badge    x 1252..1360   y 855..876   overlaps osh-btn and ded
     omega-ticker-strip x 0..1440      y 872..900   runs under cp-btn + osh-btn

   A repo-wide render confirmed this on 177 of 178 pages -- the exception is
   the one page that does not load the share layer.

   Stacked bottom-up along a single right:24px edge, above the 28px ticker:

     ticker strip            0..28
     #cp-btn        bottom  36   (primary action stays the anchor, nearest hand)
     #osh-btn       bottom  98   = 36 + 52 + 10
     #omega-ded     bottom 146   = 98 + 38 + 10
     #omega-cap     bottom 228   = 146 + 74 + 8   (74 measured, not 61)

   !important is required, not stylistic: three of the four set their position
   through inline style.cssText, which beats any stylesheet rule regardless of
   specificity. Scoped to >=761px so every existing mobile ladder -- which was
   measured separately at 375px -- is left exactly as it is.
   ========================================================================= */
(function(){
  if(document.getElementById('omega-desktop-ladder'))return;
  /* The right edge above was laddered; the CENTRE and LEFT edges were not, and
     both were still sitting in the ticker's band. Re-measured at 1280x800 on
     dashboard.html after the right-edge fix landed:

       #omega-ticker-strip   bottom 0    h 28   ->  occupies  0..28
       #omega-controls-dock  bottom 16   h 34   ->  16..50    12px INTO the ticker
       #ofb-btn              bottom 16   h 38   ->  16..54    12px INTO the ticker

     Both paint above the strip (z 2000 and 9000 vs 200), so they are not
     "covered" and a hit-test finds them -- which is exactly why the reachability
     scan stayed silent about it. The damage is to the ticker: its top 12px runs
     underneath a 415px-wide dock and a 99px-wide button, on every page that
     loads them. Confirmed on 12 of 12 sampled pages at 1280.

     Both move to the same bottom:36 baseline cp-btn already uses -- the 28px
     strip plus an 8px gap. Re-checked for a NEW collision after the move rather
     than assumed:
       #ofb-btn      36..74  x 12..111   vs #omega-voice-btn 90..134 x 24..68  -> 16px clear
       #omega-controls-dock 36..70 x 432..848 vs cp-btn x 1204..1256           -> no x overlap
     !important for the same reason as above: these are set via inline cssText. */
  /* Every rung adds var(--omega-transient-bottom), published by
     omega-bottom-stack.js as the reach of whatever consent or install banner
     is currently up (0 when none — the module publishes a real zero rather
     than the furniture's own reach, so the resting ladder is byte-for-byte
     the measured one above; that took a fix in the module, see its header).
     The ladder was computed against the ticker strip and the controls dock; the consent banner did not exist in that measurement
     and lands straight through it — re-measured at 1280x800 with the banner
     up, #cp-btn sits 52px inside it, #ofb-btn 44px, #omega-voice-btn 22px and
     #osh-btn 14px, under a bar at z-index 9990. Shifting the whole ladder by
     one value keeps its internal spacing exactly as measured and restores it
     the moment the banner is dismissed. Not one member of this ladder is
     measured as chrome, so this cannot feed back into the value. */
  var _tb = ' + var(--omega-transient-bottom,0px))';
  var css='@media(min-width:761px){'
    +'#cp-btn{right:24px!important;bottom:calc(36px'+_tb+'!important}'
    +'#osh-btn{right:24px!important;bottom:calc(98px'+_tb+'!important}'
    +'#omega-ded-widget{right:24px!important;bottom:calc(146px'+_tb+'!important}'
    /* 238, and this rung has now been wrong twice for the same reason: it is
       derived from #omega-ded-widget's height, and that height keeps
       growing. 215 came from `146 + 61 + 8` when the widget was 61px; 228
       came from `146 + 74 + 8` when it was 74. Re-measured at both 1280x900
       and 1440x900 it is h=84 and reaches 230, so the badge at 228 started
       2px inside it -- small, but it is the widget's border sitting under
       the badge's. 230 + 8 = 238; 238..276 verified clear, x 1235..1416
       against nothing else fixed in that band. A derived constant that has
       drifted three times is the ladder's real weakness, noted in
       GAP_ANALYSIS.md §S -- the honest form measures the widget the way
       omega-bottom-stack.js measures the chrome. */
    +'#omega-cap-badge{right:24px!important;bottom:calc(238px'+_tb+'!important}'
    /* The dock is measured CHROME, so the banner clears IT and it must not
       move: giving it the offset too would feed its own displacement back
       into the measurement. The two left-edge floats are not chrome, so
       they step over the banner exactly like the right-edge ladder does.
       #omega-voice-btn is a rung this ladder never had — it is positioned
       from omega-voice.js's inline cssText at bottom:90px, which is inside
       the banner's band at every viewport that has bottom furniture
       (measured 40px inside once the banner is lifted off the dock, which
       is worse than the 22px it started at, so restoring the ladder
       without this rung would ship a regression). !important for the same
       reason as every other rung: inline cssText beats a stylesheet. */
    +'#omega-controls-dock{bottom:36px!important}'
    +'#ofb-btn{bottom:calc(36px'+_tb+'!important}'
    +'#omega-voice-btn{bottom:calc(90px'+_tb+'!important}'
    /* X, not just Y. This ladder has always set `bottom` for the left-edge
       floats and left `left` to each module's own inline cssText -- and
       omega-voice.js only ever sets x for MOBILE (left:120px inside its own
       max-width:760px block, where #omega-side is display:none so nothing
       collides). On desktop the button therefore sits at x=24..68, inside the
       80px sidebar, and #omega-side is `z-index:200 !important` -- a stacking
       context -- while the button is z-4500 and NOT its descendant, so it
       paints over the dock permanently. Measured at 1280x700 and 1280x900 on
       six pages: it covered a section glyph and its label every time
       (SERVICES on dashboard/vault, ORDER on honors/cosmos/family/media).
       96px is the mobile ladder's own `x-clear` intent (its comment reads
       `x 120..164 (left column, x-clear)`) applied to the 80px desktop dock:
       80 + 16 gutter. A z-index cannot fix this -- see the stacking-context
       note in nav.js -- so the geometry has to. */
    +'html #omega-voice-btn{left:96px!important}'
    +'}';
  function inject(){var st=document.createElement('style');st.id='omega-desktop-ladder';st.textContent=css;(document.head||document.documentElement).appendChild(st);}
  if(document.head)inject(); else document.addEventListener('DOMContentLoaded',inject);
})();

/* =========================================================================
   MOBILE LADDER — the one rung the desktop ladder assumed was already there.

   The block above is scoped to >=761px and says the mobile ladder "was
   measured separately at 375px". It had been, and it is careful: ofb-btn,
   omega-voice-btn, omega-ded-widget and osh-btn all carry a
   @media(max-width:760px) rule, and omega-cap-badge is hidden outright.

   cp-btn is the exception. It has NO mobile rule anywhere in the repo, so it
   keeps the bottom:24px from its own inline cssText (omega-copilot.js:118) and
   lands inside the mobile tab bar. Measured at 390x844 on dashboard.html,
   offsets from the bottom edge:

       0.. 56  x   0..390   #omega-mob            (the tab bar)
      24.. 76  x 314..366   #cp-btn               <- 32px INTO the tab bar
      66.. 94  x   0..390   #omega-ticker-strip   <- and 10px into the ticker
     102..146  x   6..384   #omega-controls-dock
     150..188  x  10..114   #ofb-btn
     150..224  x 184..376   #omega-ded-widget
     150..194  x 120..164   #omega-voice-btn
     224..262  x 280..378   #osh-btn

   The collision reproduced on 6 of 6 sampled pages, identically -- it is the
   floating copilot button sitting on top of the primary mobile navigation.

   The right-hand column is occupied continuously to 262 (osh-btn), so the next
   free rung is 262 + an 8px gap = 270. Verified free rather than assumed:
   nothing else is fixed between 262 and 800 at any x.

   !important for the same reason the desktop block needs it -- cp-btn's
   position comes from inline style.cssText, which beats any stylesheet rule
   regardless of specificity.
   ========================================================================= */
(function(){
  if(document.getElementById('omega-mobile-ladder'))return;
  /* Same transient offset as the desktop ladder, and the same re-spacing.

     RE-MEASURED at 420x760 on dashboard.html, because the 262/270 figures above
     no longer describe this column -- #omega-ded-widget has grown from 74px to
     84px, exactly as it did under the desktop badge rung:

       150..234  x 214..406   #omega-ded-widget   (h 84, not the 74 above)
       224..272  x 310..408   #osh-btn            <- 10px INTO the widget
       270..322  x 344..396   #cp-btn             <-  2px INTO osh-btn
       150..198  x  10..114   #ofb-btn            (left column, x-clear)
       150..198  x 120..164   #omega-voice-btn    (left column, x-clear)

     So 234 + 8 = 242 for #osh-btn (omega-share.js owns that number) and
     242 + 48 + 8 = 298 here.

     The three floats on the 150px rung are each positioned by their OWN module
     -- omega-chrono.js:211, omega-feedback.js:34, omega-voice.js:141 -- and two
     of those already carry !important, so an equal-specificity rule here would
     be decided by sheet ORDER between five defer-loaded modules. `html #id`
     raises specificity to 0,1,1 and settles it whatever that order turns out
     to be. The SPACE is load-bearing: `html#id` with no combinator selects an
     <html> element that carries the id, which matches nothing — written that
     way first, it parsed, shipped, and moved none of the three, and only the
     render showed it. The offset resolves to 0 at rest, so not one of these
     moves until a banner is actually up. */
  var css='@media(max-width:760px){'
    +'#cp-btn{right:24px!important;bottom:calc(298px + var(--omega-transient-bottom,0px))!important}'
    +'html #omega-ded-widget{bottom:calc(150px + var(--omega-transient-bottom,0px))!important}'
    +'html #ofb-btn{bottom:calc(150px + var(--omega-transient-bottom,0px))!important}'
    +'html #omega-voice-btn{bottom:calc(150px + var(--omega-transient-bottom,0px))!important}'
    /* ...but only where the lift FITS. At 420x760 it does; at 375x667 and
       360x640 the same shift put #cp-btn at top -32 and -59, off the screen.
       A 235px consent banner over 146px of chrome leaves a 640px phone no
       room for a four-rung ladder, and no arithmetic fixes that. While a
       transient banner is up the floats step aside instead: the banner is the
       one thing to act on, it clears on a single tap, and every float returns
       in the same frame the attribute is removed. Desktop keeps the lift --
       verified it fits at 1024x600, 900x700, 1280x800 and 1440x900. */
    +'html[data-omega-transient] #cp-btn,'
    +'html[data-omega-transient] #osh-btn,'
    +'html[data-omega-transient] #omega-ded-widget,'
    +'html[data-omega-transient] #ofb-btn,'
    +'html[data-omega-transient] #omega-voice-btn{display:none!important}'
    +'}';
  function inject(){var st=document.createElement('style');st.id='omega-mobile-ladder';st.textContent=css;(document.head||document.documentElement).appendChild(st);}
  if(document.head)inject(); else document.addEventListener('DOMContentLoaded',inject);
})();


/* ===== CINEMATIC FX ENGINE -- INLINED DIRECTLY INTO bg.js =====
   No external /omega-fx.js file required. Updating bg.js is enough. */
/* ============================================================
   omega-fx.js   v3     SYD OMEGA 91717
   THE SOVEREIGN ARMILLARY -- one living, multi-dimensional,
   rotative instrument that renders the whole cosmology and
   ignites the system the current page is about.

   CANON (absolute, do not alter):
     - 9 elements (ninefold spine): Fire Water Wind Metal Sand
       Soul Space Void TheAll. Fire = track 1 (Aries).
     - 12-fold lenses, canonical order, exact site colours:
       SIGNS, GODS (Aries->Ares), GATES, GRADES, TROPHIES,
       MEDALS, CERTIFICATES, PLANETS, MOVIES; KINGS = 28.
     - Economy (blockchain / crypto / nft) = token-motes that
       stream the rings. Advertisement = broadcast pulses.
     - Palette: void #0A0A0F, gold #C9A84C, cyan #00E5FF,
       crimson #8B0000. Pure ASCII. Omega as \u03A9 (canvas).
     - Authority apex (9,9,9) = 27.8367. Matrix = 104,976 nodes
       (12 tracks x 12 phases x 9x9x9, per omega-canon.json).

   Loaded once, globally, via bg.js. Reduced-motion safe;
   pauses when the tab is hidden.
   ============================================================ */
(function(){
  if(window.__omegaFx)return; window.__omegaFx=3;

  var GOLD='201,168,76', CYAN='0,229,255', CRIM='139,0,0', SOUL='155,107,240';
  var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR=Math.min(window.devicePixelRatio||1,2);
  function rgb(h){h=h.replace('#','');return parseInt(h.substr(0,2),16)+','+parseInt(h.substr(2,2),16)+','+parseInt(h.substr(4,2),16);}

  /* ---- THE NINE ELEMENTS (inner spine; Sand = amplifier) ---- */
  var ELEMENTS=[
    {t:'\u2632',c:rgb('#E86A3A')}, /* Fire  */
    {t:'\u2630',c:rgb('#34C6E6')}, /* Water */
    {t:'\u2631',c:rgb('#A9C2D8')}, /* Wind  */
    {t:'\u2633',c:rgb('#C7CDD6')}, /* Metal */
    {t:'\u2605',c:rgb('#D9B86A'),amp:true}, /* Sand -- amplifier */
    {t:'\u2734',c:rgb('#E8E8FF')}, /* Soul  */
    {t:'\u2736',c:rgb('#9B6BF0')}, /* Space */
    {t:'\u2737',c:rgb('#7B00FF')}, /* Void  */
    {t:'\u03A9',c:rgb('#C9A84C')}  /* The All -- apex */
  ];

  /* ---- THE TWELVE SIGNS (canon order, glyph, element colour) ---- */
  var SIGN_COL=['#E86A3A','#C7CDD6','#A9C2D8','#34C6E6','#E86A3A','#D9B86A','#A9C2D8','#8B0000','#C9A84C','#E2C86D','#9B6BF0','#3fb27f'];
  var SIGN_GLY=['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
  var GODS=['ARES','APHRODITE','HERMES','ARTEMIS','APOLLO','ATHENA','HERA','DEMETER','ZEUS','HESTIA','HEPHAESTUS','POSEIDON'];
  var PLANETS=['\u2609','\u263D','\u263F','\u2640','\u2642','\u2643','\u2644','\u2645','\u2646','\u2647','\u260A','\u26B7'];
  var ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

  function lensSigns(){var a=[];for(var i=0;i<12;i++)a.push({t:SIGN_GLY[i],c:rgb(SIGN_COL[i]),amp:i===5});return a;}
  function lensGods(){var a=[];for(var i=0;i<12;i++)a.push({t:GODS[i],c:rgb(SIGN_COL[i]),amp:i===5});return a;}      /* gods carry their sign colour */
  function lensGates(){var a=[];for(var i=0;i<12;i++)a.push({t:ROMAN[i],c:rgb(i<6?'#C9A84C':'#00E5FF')});return a;}
  function lensGrades(){var a=[];for(var i=0;i<12;i++){var f=i/11;a.push({t:String(i+1),c:Math.round(139+f*62)+','+Math.round(f*168)+','+Math.round(f*76)});}return a;} /* crimson -> gold ramp */
  function lensTrophies(){var a=[];for(var i=0;i<12;i++)a.push({t:'\u2605',c:GOLD});return a;}
  function lensMedals(){var cc=['#C7CDD6','#E2C86D','#C9A84C'];var a=[];for(var i=0;i<12;i++)a.push({t:'\u25C9',c:rgb(cc[i%3])});return a;}
  function lensCerts(){var a=[];for(var i=0;i<12;i++)a.push({t:'\u272A',c:CYAN});return a;}
  function lensPlanets(){var a=[];for(var i=0;i<12;i++)a.push({t:PLANETS[i],c:rgb(SIGN_COL[i])});return a;}
  function lensMovies(){var a=[];for(var i=0;i<12;i++)a.push({t:'\u25B6',c:rgb(i%2?'#8B0000':'#C9A84C')});return a;}
  function lensKings(){var a=[];for(var i=0;i<28;i++)a.push({t:'\u265A',c:rgb(i%4===0?'#C9A84C':(i%4===1?'#E2C86D':'#8B0000'))});return a;}
  function lensElements(){return ELEMENTS.slice();}

  var LENSES={
    signs:{nodes:lensSigns,label:'THE WHEEL OF TWELVE'},
    gods:{nodes:lensGods,label:'THE TWELVE OLYMPIANS'},
    gates:{nodes:lensGates,label:'THE TWELVE GATES'},
    grades:{nodes:lensGrades,label:'THE TWELVE GRADES'},
    trophies:{nodes:lensTrophies,label:'THE TWELVE TROPHIES'},
    medals:{nodes:lensMedals,label:'THE TWELVE MEDALS'},
    certificates:{nodes:lensCerts,label:'THE TWELVE CERTIFICATES'},
    planets:{nodes:lensPlanets,label:'THE TWELVE PLANETS'},
    movies:{nodes:lensMovies,label:'THE TWELVE FRANCHISES'},
    kings:{nodes:lensKings,label:'THE TWENTY-EIGHT KINGS'},
    elements:{nodes:lensElements,label:'THE NINE ELEMENTS'}
  };

  /* page -> lens (everything else falls back to signs) */
  var PAGE_LENS={
    horoscope:'signs',cosmos:'signs',sigil:'signs',account:'signs',triads:'signs',
    pantheons:'gods',agents:'gods',factions:'gods',
    gates:'gates',
    academy:'grades',ascension:'grades',grid:'grades',matrix:'grades',membership:'grades',evolution:'grades',
    trophies:'trophies',honors:'trophies',
    contributions:'medals',beacon:'medals',
    passport:'certificates',identity:'certificates',kyc:'certificates',
    prediction:'planets',intelligence:'planets',
    media:'movies',cinema:'movies',universe:'movies',
    kings:'kings',sovereigns:'kings',
    elements:'elements',city:'elements'
  };
  var ECON={treasury:1,wallet:1,blockchain:1,marketplace:1,portfolio:1,income:1,ledger:1,payments:1,vault:1,contracts:1};
  var BROADCAST={marketing:1,social:1,news:1};

  function pageKey(){
    var side=document.getElementById('omega-side');
    var k=(side&&side.getAttribute('data-page'))||(location.pathname.split('/').pop()||'').replace('.html','')||'dashboard';
    return k;
  }
  var PKEY=pageKey();
  var LENSKEY=PAGE_LENS[PKEY]||'signs';
  var LENS=LENSES[LENSKEY];
  var ECON_ON=!!ECON[PKEY];
  var BROADCAST_ON=!!BROADCAST[PKEY];

  /* ---- retire the legacy flat aurora ---- */
  function retireLegacy(){var o=document.getElementById('omega-bg');if(o)o.remove();}
  retireLegacy(); setTimeout(retireLegacy,400); setTimeout(retireLegacy,1200);

  /* ============================================================ CANVAS */
  var cv=document.createElement('canvas');
  cv.id='omega-fx';
  cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  var ctx=cv.getContext('2d');
  var W=0,H=0,CX=0,CY=0,t=0,raf=null,hidden=false,small=false;
  var mx=0.5,my=0.42,tmx=0.5,tmy=0.42;
  var ig=REDUCE?1:0, scrollSpin=0, recede=1;
  var stars=[], outer=[], inner=[], RINGS=[], arcs=[], pulses=[], motes=[], beams=[], lastArc=0, lastHeart=0, lastBeam=0;

  function resize(){
    W=window.innerWidth; H=window.innerHeight; small=W<760;
    CX=W*0.5; CY=H*(small?0.34:0.42);
    cv.width=Math.floor(W*DPR); cv.height=Math.floor(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function buildStars(){
    var n=Math.max(50,Math.min(small?90:150,Math.floor((W*H)/14000)));
    stars=[];
    for(var i=0;i<n;i++){
      var depth=0.3+(i%3)*0.34;
      var tint=Math.random()<0.16?rgb(SIGN_COL[(Math.random()*12)|0]):(Math.random()<0.7?GOLD:CYAN);
      stars.push({x:Math.random()*W,y:Math.random()*H,z:depth,r:(0.4+Math.random()*1.3)*depth,
                  ph:Math.random()*6.283,sp:0.4+Math.random()*1.1,c:tint,
                  dx:(Math.random()-0.5)*0.05*depth,dy:(Math.random()-0.5)*0.05*depth});
    }
  }

  function mkNodes(data,ringIdx){
    var a=[],N=data.length;
    for(var i=0;i<N;i++){
      a.push({i:i,ang:(i/N)*6.283-Math.PI/2,spd:RINGS[ringIdx].spin,
              tok:data[i].t,col:data[i].c,amp:!!data[i].amp,
              x:0,y:0,depth:0.5,scale:1,flare:0,lit:0});
    }
    return a;
  }

  function buildOrrery(){
    var base=Math.min(W,H)*(small?0.40:0.36);
    RINGS=[
      {r:base*1.06,flat:0.34,tilt:0.18,spin: 0.045,col:GOLD,w:1.7,a:0.32}, /* 0 main twelvefold */
      {r:base*0.58,flat:0.32,tilt:1.10,spin:-0.055,col:CYAN,w:1.4,a:0.28}, /* 1 inner ninefold  */
      {r:base*1.40,flat:0.42,tilt:2.30,spin: 0.024,col:SOUL,w:1.2,a:0.16}  /* 2 structural cage */
    ];
    outer=mkNodes(LENS.nodes(),0);
    inner=(LENSKEY==='elements')?[]:mkNodes(ELEMENTS,1);  /* avoid duplicate when the lens IS elements */
    arcs=[];pulses=[];beams=[];
    /* token-motes: economy in motion (blockchain / crypto / nft) */
    motes=[];
    var mn=ECON_ON?18:9;
    for(var i=0;i<mn;i++)motes.push({ring:Math.random()<0.5?0:1,ang:Math.random()*6.283,
      spd:(0.18+Math.random()*0.28)*(Math.random()<0.5?1:-1),
      col:Math.random()<0.5?GOLD:CYAN,sz:0.7+Math.random()*0.8});
  }

  function buildAll(){buildStars();buildOrrery();}

  /* ============================================================ DRAW */
  function nebula(){
    var blobs=[
      {x:CX+Math.cos(t*0.21)*W*0.22,y:CY+Math.sin(t*0.17)*H*0.16,r:Math.max(W,H)*0.58,c:GOLD,a:0.135},
      {x:CX+Math.cos(-t*0.16+2.1)*W*0.26,y:CY+Math.sin(-t*0.19+1.3)*H*0.20,r:Math.max(W,H)*0.52,c:CYAN,a:0.090},
      {x:W*0.82+Math.cos(t*0.13)*W*0.06,y:H*0.82,r:Math.max(W,H)*0.36,c:CRIM,a:0.090}
    ];
    for(var i=0;i<blobs.length;i++){
      var b=blobs[i],g=ctx.createRadialGradient(b.x,b.y,8,b.x,b.y,b.r);
      g.addColorStop(0,'rgba('+b.c+','+(b.a*ig).toFixed(3)+')');
      g.addColorStop(0.5,'rgba('+b.c+','+(b.a*0.28*ig).toFixed(3)+')');
      g.addColorStop(1,'rgba(2,2,6,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    }
  }

  function starfield(){
    var px=(mx-0.5),py=(my-0.42);
    for(var i=0;i<stars.length;i++){
      var s=stars[i];
      if(!REDUCE){s.x+=s.dx;s.y+=s.dy;
        if(s.x<-8)s.x=W+8;if(s.x>W+8)s.x=-8;if(s.y<-8)s.y=H+8;if(s.y>H+8)s.y=-8;}
      var ox=px*40*s.z,oy=py*40*s.z;
      var tw=REDUCE?0.85:(0.5+0.5*Math.sin(t*1.8*s.sp+s.ph));
      ctx.beginPath();
      ctx.fillStyle='rgba('+s.c+','+((0.18+0.5*s.z)*tw*ig).toFixed(3)+')';
      ctx.shadowColor='rgba('+s.c+',0.5)';ctx.shadowBlur=6*s.z;
      ctx.arc(s.x-ox,s.y-oy,s.r,0,6.283);ctx.fill();
    }
    ctx.shadowBlur=0;
  }

  function gOff(){return {x:(mx-0.5)*60,y:(my-0.42)*60};}

  function ringRot(R){return t*R.spin+R.tilt+scrollSpin*(R===RINGS[0]?1:0.5);}

  function drawRing(R,breathe,o){
    var rot=ringRot(R),steps=84,j;
    ctx.beginPath();
    for(j=0;j<=steps;j++){
      var a=(j/steps)*6.283;
      var ex=Math.cos(a)*R.r*breathe,ey=Math.sin(a)*R.r*R.flat*breathe;
      var x=CX+o.x+ex*Math.cos(rot)-ey*Math.sin(rot);
      var y=CY+o.y+ex*Math.sin(rot)+ey*Math.cos(rot);
      if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle='rgba('+R.col+','+(R.a*ig).toFixed(3)+')';ctx.lineWidth=R.w;ctx.stroke();
  }

  function placeNodes(set,R,breathe,o){
    var rot=ringRot(R),N=set.length;
    for(var i=0;i<N;i++){
      var nd=set[i];
      if(!REDUCE)nd.ang+=nd.spd*0.016;
      var ex=Math.cos(nd.ang)*R.r*breathe,ey=Math.sin(nd.ang)*R.r*R.flat*breathe;
      nd.x=CX+o.x+ex*Math.cos(rot)-ey*Math.sin(rot);
      nd.y=CY+o.y+ex*Math.sin(rot)+ey*Math.cos(rot);
      nd.depth=((ey/(R.r*R.flat*breathe))+1)/2;
      nd.scale=0.45+nd.depth;
      var lit=REDUCE?1:Math.max(0,Math.min(1,(ig-(i/N)*0.6)/0.18));
      nd.lit=lit;
      if(nd.flare>0)nd.flare-=0.02;
      var dxm=nd.x-mx*W,dym=nd.y-my*H;
      if(!REDUCE&&(dxm*dxm+dym*dym)<8100)nd.flare=Math.min(1,nd.flare+0.06);
    }
  }

  function drawLinks(set){
    ctx.lineWidth=0.7;
    for(var i=0;i<set.length;i++){
      var a=set[i],b=set[(i+1)%set.length];
      var dep=Math.min(a.depth,b.depth),lit=Math.min(a.lit,b.lit);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle='rgba('+GOLD+','+(0.045*dep*lit).toFixed(3)+')';ctx.stroke();
    }
  }

  function drawNodes(set,showTok){
    var order=set.slice().sort(function(a,b){return a.depth-b.depth;});
    for(var k=0;k<order.length;k++){
      var nd=order[k];if(nd.lit<=0)continue;
      var amp=nd.amp?1.5:1;
      var rr=(2.0*amp)*nd.scale*(1+nd.flare*1.3)*nd.lit;
      ctx.beginPath();
      ctx.fillStyle='rgba('+nd.col+','+((0.48+0.5*nd.depth)*nd.lit).toFixed(3)+')';
      ctx.shadowColor='rgba('+nd.col+','+(0.55+nd.flare*0.4).toFixed(3)+')';
      ctx.shadowBlur=(8+nd.flare*16+(nd.amp?6:0))*nd.scale;
      ctx.arc(nd.x,nd.y,rr,0,6.283);ctx.fill();
      if(showTok&&nd.depth>0.6&&nd.lit>0.9&&!small){
        ctx.shadowBlur=0;
        var fs=Math.round((nd.tok.length>3?8:12)*nd.scale);
        ctx.font='600 '+fs+'px "Courier Prime", monospace';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle='rgba('+nd.col+','+(0.55*nd.depth).toFixed(3)+')';
        ctx.fillText(nd.tok,nd.x,nd.y-rr-8);
      }
    }
    ctx.shadowBlur=0;
  }

  function elementArc(){
    var lit=outer.filter(function(n){return n.lit>0.9;});
    if(lit.length<2)return;
    var a=lit[(Math.random()*lit.length)|0],b=lit[(Math.random()*lit.length)|0];
    if(a===b)return;a.flare=1;b.flare=1;
    arcs.push({a:a,b:b,life:0,bow:(Math.random()<0.5?1:-1),col:a.col});
  }
  function drawArcs(){
    for(var i=arcs.length-1;i>=0;i--){
      var ar=arcs[i];ar.life+=0.02;if(ar.life>=1){arcs.splice(i,1);continue;}
      var A=ar.a,B=ar.b;
      var mxp=(A.x+B.x)/2+ar.bow*(A.y-B.y)*0.32,myp=(A.y+B.y)/2-ar.bow*(A.x-B.x)*0.32;
      var fade=Math.sin(ar.life*Math.PI);
      ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.quadraticCurveTo(mxp,myp,B.x,B.y);
      ctx.strokeStyle='rgba('+ar.col+','+(0.30*fade).toFixed(3)+')';
      ctx.lineWidth=1.1;ctx.shadowColor='rgba('+ar.col+','+(0.5*fade).toFixed(3)+')';ctx.shadowBlur=8;ctx.stroke();
      var tt=ar.life,sx=(1-tt)*(1-tt)*A.x+2*(1-tt)*tt*mxp+tt*tt*B.x,sy=(1-tt)*(1-tt)*A.y+2*(1-tt)*tt*myp+tt*tt*B.y;
      ctx.beginPath();ctx.fillStyle='rgba('+ar.col+','+fade.toFixed(3)+')';ctx.arc(sx,sy,1.8*fade+0.6,0,6.283);ctx.fill();
    }
    ctx.shadowBlur=0;
  }

  /* token-motes: the economy (blockchain / crypto / nft) streaming the rings */
  function drawMotes(breathe,o){
    for(var i=0;i<motes.length;i++){
      var m=motes[i],R=RINGS[m.ring];if(!R)continue;
      if(!REDUCE)m.ang+=m.spd*0.016;
      var rot=ringRot(R);
      var ex=Math.cos(m.ang)*R.r*breathe,ey=Math.sin(m.ang)*R.r*R.flat*breathe;
      var x=CX+o.x+ex*Math.cos(rot)-ey*Math.sin(rot);
      var y=CY+o.y+ex*Math.sin(rot)+ey*Math.cos(rot);
      var dep=((ey/(R.r*R.flat*breathe))+1)/2;
      ctx.beginPath();
      ctx.fillStyle='rgba('+m.col+','+((0.3+0.4*dep)*ig).toFixed(3)+')';
      ctx.shadowColor='rgba('+m.col+',0.6)';ctx.shadowBlur=5;
      ctx.arc(x,y,m.sz*(0.6+dep),0,6.283);ctx.fill();
    }
    ctx.shadowBlur=0;
  }

  /* broadcast pulses: advertisement / syndication */
  function broadcast(o){
    if(!BROADCAST_ON||REDUCE)return;
    if(t-lastBeam>2.2&&beams.length<3){beams.push({life:0,a:Math.random()*6.283});lastBeam=t;}
    for(var i=beams.length-1;i>=0;i--){
      var bm=beams[i];bm.life+=0.018;if(bm.life>=1){beams.splice(i,1);continue;}
      var fade=Math.sin(bm.life*Math.PI),len=Math.max(W,H)*0.6*bm.life;
      var x2=CX+o.x+Math.cos(bm.a)*len,y2=CY+o.y+Math.sin(bm.a)*len*0.6;
      var g=ctx.createLinearGradient(CX+o.x,CY+o.y,x2,y2);
      g.addColorStop(0,'rgba('+CYAN+','+(0.25*fade).toFixed(3)+')');
      g.addColorStop(1,'rgba('+CYAN+',0)');
      ctx.strokeStyle=g;ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(CX+o.x,CY+o.y);ctx.lineTo(x2,y2);ctx.stroke();
    }
  }

  function heartbeat(o){
    if(!REDUCE&&t-lastHeart>5.5&&ig>0.96){pulses.push({life:0});lastHeart=t;}
    for(var i=pulses.length-1;i>=0;i--){
      var p=pulses[i];p.life+=0.012;if(p.life>=1){pulses.splice(i,1);continue;}
      var R=Math.min(W,H)*0.5*p.life,fade=(1-p.life)*0.18;
      ctx.beginPath();ctx.arc(CX+o.x,CY+o.y,R,0,6.283);
      ctx.strokeStyle='rgba('+GOLD+','+fade.toFixed(3)+')';ctx.lineWidth=1;ctx.stroke();
    }
  }

  function core(o,breathe){
    var halo=REDUCE?0.75:(0.7+0.3*Math.sin(t*1.4));
    var flare=ig<1?Math.max(0,1-Math.abs(ig-0.92)/0.08):0;
    var hr=46*breathe*(1+flare*0.6);
    var hg=ctx.createRadialGradient(CX+o.x,CY+o.y,2,CX+o.x,CY+o.y,hr);
    hg.addColorStop(0,'rgba('+GOLD+','+((0.22*halo+flare*0.4)*ig).toFixed(3)+')');
    hg.addColorStop(1,'rgba('+GOLD+',0)');
    ctx.fillStyle=hg;ctx.beginPath();ctx.arc(CX+o.x,CY+o.y,hr,0,6.283);ctx.fill();
    ctx.save();
    ctx.font='700 '+Math.round(30*breathe)+'px "Cinzel Decorative", Georgia, serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba('+GOLD+',0.9)';ctx.shadowBlur=(18+flare*22)*halo;
    ctx.fillStyle='rgba('+GOLD+','+((0.7+0.3*halo)*ig).toFixed(3)+')';
    ctx.fillText('\u03A9',CX+o.x,CY+o.y+1);
    ctx.restore();ctx.shadowBlur=0;
    /* lens label -- name the active system */
    if(ig>0.9){
      ctx.font='600 10px "Courier Prime", monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba('+GOLD+','+(0.30*ig).toFixed(3)+')';
      ctx.fillText(LENS.label,CX+o.x,CY+o.y+hr+18);
    }
  }

  function frame(){
    ctx.clearRect(0,0,W,H);
    if(!REDUCE&&ig<1)ig=Math.min(1,ig+0.0075);
    mx+=(tmx-mx)*0.05;my+=(tmy-my)*0.05;
    scrollSpin+=((window.__ofxScrollSpin||0)-scrollSpin)*0.06;
    recede+=(((window.__ofxRecede)||1)-recede)*0.06;
    var breathe=(REDUCE?1:(1+Math.sin(t*0.9)*0.02))*recede;
    var o=gOff();
    nebula();starfield();
    drawRing(RINGS[2],breathe,o);
    drawRing(RINGS[1],breathe,o);
    drawRing(RINGS[0],breathe,o);
    if(inner.length){placeNodes(inner,RINGS[1],breathe,o);}
    placeNodes(outer,RINGS[0],breathe,o);
    drawLinks(outer);
    if(!REDUCE){if(t-lastArc>1.2&&arcs.length<5&&ig>0.85){elementArc();lastArc=t;}drawArcs();}
    drawMotes(breathe,o);
    if(inner.length)drawNodes(inner,false);
    drawNodes(outer,true);
    broadcast(o);
    heartbeat(o);
    core(o,breathe);
  }

  function loop(){if(!hidden){t+=0.016;frame();}raf=requestAnimationFrame(loop);}
  function attach(){
    if(!document.body){requestAnimationFrame(attach);return;}
    document.body.appendChild(cv);resize();buildAll();
    if(REDUCE){frame();}else{if(raf)cancelAnimationFrame(raf);loop();}
  }

  window.addEventListener('resize',function(){resize();buildAll();if(REDUCE)frame();});
  /* W and H are 0 until resize() first runs, and a pointermove can arrive before
     it: e.clientX/0 is Infinity (0/0 is NaN), which flows through mx/my into
     gOff() and reaches createRadialGradient as a non-finite centre, throwing
     "The provided double value is non-finite" and killing the whole background
     canvas for the rest of the session. It never recovers, because mx is then
     eased toward a poisoned tmx forever. Intermittent by nature -- it needs a
     pointer event inside that startup window -- which is why a full-estate
     headless sweep reported a DIFFERENT set of 19-22 failing pages on each run
     of identical code. Guarding the divisor is the whole fix. */
  window.addEventListener('pointermove',function(e){
    if(!(W>0)||!(H>0))return;
    tmx=e.clientX/W;tmy=e.clientY/H;
  },{passive:true});
  window.addEventListener('deviceorientation',function(e){
    /* Same class: gamma was checked, beta was not, and (null-45) is NaN --
       Math.min/max propagate NaN rather than clamping it. */
    if(e.gamma!=null){tmx=0.5+Math.max(-1,Math.min(1,e.gamma/45))*0.5;}
    if(e.beta!=null){tmy=0.42+Math.max(-1,Math.min(1,(e.beta-45)/45))*0.3;}
  },{passive:true});
  window.addEventListener('scroll',function(){
    var y=window.pageYOffset||document.documentElement.scrollTop||0;
    window.__ofxScrollSpin=y*0.0009;window.__ofxRecede=1-Math.min(0.12,y/4200);
  },{passive:true});
  document.addEventListener('visibilitychange',function(){hidden=document.hidden;});

  /* public hook: switch the active lens live (used by the showcase) */
  window.__omegaSetLens=function(k,opts){
    if(!LENSES[k])return;opts=opts||{};
    LENSKEY=k;LENS=LENSES[k];ECON_ON=!!opts.econ;BROADCAST_ON=!!opts.broadcast;
    buildOrrery();if(!REDUCE)ig=0.5;   /* partial re-ignition on switch */
  };
  attach();

  /* ============================================================ UI MOTION LAYER */
  function injectCSS(){
    if(document.getElementById('omega-fx-css'))return;
    var s=document.createElement('style');s.id='omega-fx-css';
    s.textContent=[
      '.ofx-rise{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}',
      '.ofx-rise.ofx-in{opacity:1;transform:none}',
      '.ofx-tilt{transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s ease;transform-style:preserve-3d;will-change:transform}',
      '.ofx-tilt:hover{box-shadow:0 18px 50px -20px rgba(0,0,0,.7),0 0 24px -8px rgba(201,168,76,.35)}',
      '@supports ((-webkit-background-clip:text) or (background-clip:text)){',
      '.ofx-sheen{background-image:linear-gradient(100deg,currentColor 38%,rgba(255,247,214,.95) 50%,currentColor 62%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-size:240% 100%;background-position:140% 0;animation:ofx-sweep 7s ease-in-out infinite}',
      '@keyframes ofx-sweep{0%,72%{background-position:140% 0}100%{background-position:-40% 0}}',
      '}',
      '@media(prefers-reduced-motion:reduce){.ofx-rise{opacity:1;transform:none;transition:none}.ofx-sheen{animation:none}}'
    ].join('');
    (document.head||document.documentElement).appendChild(s);
  }
  function enhance(){
    injectCSS();if(REDUCE)return;
    if('IntersectionObserver' in window){
      var sel='.card,.gate-card,.w-card,.kpi,.stat,.tab-panel,.tier-card,[class*="-card"],section.pad';
      var io=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){en.target.classList.add('ofx-in');io.unobserve(en.target);}});},{threshold:0.08,rootMargin:'0px 0px -8% 0px'});
      [].slice.call(document.querySelectorAll(sel)).forEach(function(el){
        if(el.offsetParent===null)return;var r=el.getBoundingClientRect();
        if(r.top<window.innerHeight&&r.bottom>0)return;
        el.classList.add('ofx-rise');io.observe(el);
      });
      setTimeout(function(){[].slice.call(document.querySelectorAll('.ofx-rise:not(.ofx-in)')).forEach(function(el){el.classList.add('ofx-in');});},4500);
    }
    var tsel='.card,.gate-card,.w-card,.kpi,.tier-card,[class*="-card"]';
    [].slice.call(document.querySelectorAll(tsel)).forEach(function(el){
      var r=el.getBoundingClientRect();
      if(r.width>560||r.height>560||r.width<60)return;
      if(el.querySelector('canvas'))return;
      if(getComputedStyle(el).position==='fixed')return;
      el.classList.add('ofx-tilt');
      el.addEventListener('pointermove',function(e){
        var b=el.getBoundingClientRect();
        var dx=(e.clientX-b.left)/b.width-0.5,dy=(e.clientY-b.top)/b.height-0.5;
        el.style.transform='perspective(800px) rotateX('+(-dy*6).toFixed(2)+'deg) rotateY('+(dx*6).toFixed(2)+'deg) translateZ(6px)';
      });
      el.addEventListener('pointerleave',function(){el.style.transform='';});
    });
    [].slice.call(document.querySelectorAll('.sechead')).forEach(function(el){
      if(el.children.length===0&&(el.textContent||'').trim().length<48)el.classList.add('ofx-sheen');
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',enhance);}
  else{enhance();}
})();


/* ACCESS GUARD + TRIAL ENGINE */
(function(){
  var pg=(location.pathname.split('/').pop()||'').replace('.html','');
  var EX={'':1,'index':1,'account':1,'terms':1,'charter':1,'reset':1,'enter':1,'pending':1};
  if(EX[pg])return;
  /* pending.html independently redirects back here whenever it reads
     is_trial+trial_expires_at as still active, racing this file's own
     expire_trial-then-redirect flow below. A guard keyed on the redirect
     TARGET (not a page-local flag, which a fresh navigation resets)
     survives across the actual page loads a ping-pong produces, so a
     genuine loop is broken instead of bouncing the member forever. */
  function safeRedirect(url){
    try{
      var k='omega_redirect_log',now=Date.now();
      var log=JSON.parse(sessionStorage.getItem(k)||'[]').filter(function(e){return now-e.t<10000;});
      var p=url.split('?')[0];
      if(log.filter(function(e){return e.p===p;}).length>=2){
        console.error('[Omega] redirect loop guard: stopped repeated redirect to',url);
        return;
      }
      log.push({p:p,t:now});sessionStorage.setItem(k,JSON.stringify(log.slice(-6)));
    }catch(e){}
    location.replace(url);
  }
  /* shared singleton -- each extra createClient registers another GoTrueClient
     competing for the same auth-token storage key */
  (window.OmegaSB?window.OmegaSB.get():import('/vendor/supabase-js.js').then(function(m){
    return m.createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q");
  })).then(function(sb){
    sb.auth.getSession().then(function(res){
      var s=res.data.session;if(!s)return;
      sb.from('profiles').select('sign,terms_accepted,access_approved,is_owner,is_trial,trial_expires_at').eq('id',s.user.id).maybeSingle().then(function(pr){
        if(!pr.data)return;
        var d=pr.data;
        if(d.access_approved===false && !d.is_owner && !d.is_trial){safeRedirect('/pending.html');return;}
        if(d.sign&&!d.terms_accepted){safeRedirect('/terms.html');return;}
        /* Approval confirmed -- release the guard so #app may render. */
        if(window.__omegaApprove) window.__omegaApprove(true);
        if(d.is_trial&&!d.is_owner&&d.trial_expires_at){
          var expiresAt=new Date(d.trial_expires_at).getTime();
          var remaining=expiresAt-Date.now();
          /* The callback MUST take the result: a no-arg .then() cannot tell
             success from {data:null,error}, and the member is sent to the
             expired page either way. The wall clock says the trial is over, so
             ending the session is right regardless -- but a failed write is now
             recorded, and the next load retries expire_trial. */
          if(remaining<=0){sb.rpc('expire_trial',{p_uid:s.user.id}).then(function(r){window.__omegaWriteFail('expire_trial',r);safeRedirect('/pending.html?t=expired');});return;}
          injectTrialBanner(expiresAt,s.user.id,sb);
        }
        startTimeSovereignPing(sb);
      });
    });
  }).catch(function(){});
  function startTimeSovereignPing(sb){
    if(window.__omegaTSping)return; window.__omegaTSping=1;
    /* The try/catch here caught nothing: an rpc that fails resolves, it does
       not throw. Keep it for a synchronous throw, and inspect the result and
       the rejection too. A dropped ping is not fatal, but it should not be
       invisible. */
    function ping(){ if(document.visibilityState==='visible'){ try{ sb.rpc('ping_session').then(function(r){window.__omegaWriteFail('ping_session',r);},function(){}); }catch(e){} } }
    ping();
    setInterval(ping,60000);
  }
  function injectTrialBanner(expiresAt,uid,sb){
    if(document.getElementById('omega-trial-bar'))return;
    var bar=document.createElement('div');bar.id='omega-trial-bar';
    bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:18px;padding:10px 20px;background:linear-gradient(90deg,rgba(139,0,0,0.95),rgba(80,0,0,0.97));border-top:1px solid rgba(201,168,76,0.4);font-family:"Courier Prime",monospace;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
    var icon=document.createElement('span');icon.textContent='\u26A0';icon.style.cssText='color:#E2C86D;font-size:16px';
    var label=document.createElement('span');label.style.cssText='color:#e9e6dc;font-size:12px;letter-spacing:3px;text-transform:uppercase';label.textContent='TRIAL SESSION';
    var timer=document.createElement('span');timer.id='omega-trial-timer';timer.style.cssText='color:#E2C86D;font-size:15px;font-weight:700;letter-spacing:4px;min-width:60px;text-align:center';
    var note=document.createElement('span');note.style.cssText='color:rgba(233,230,220,0.45);font-size:12px;letter-spacing:2px';note.textContent='SESSION ENDS \u00B7 ALL PROGRESS RESETS';
    bar.appendChild(icon);bar.appendChild(label);bar.appendChild(timer);bar.appendChild(note);
    document.body.appendChild(bar);
    // push #omega-mob (the real mobile nav) up by this banner's actual
    // rendered height so the banner doesn't cover it, and reserve the combined height at the bottom
    // of the page so content isn't hidden underneath either.
    requestAnimationFrame(function(){
      var h=bar.offsetHeight;
      var mobNav=document.getElementById('omega-mob');
      if(mobNav){ mobNav.style.bottom=h+'px'; }
      var existingPad=parseInt(getComputedStyle(document.body).paddingBottom)||0;
      document.body.style.paddingBottom=(existingPad+h)+'px';
      function adjustFeedbackBtn(){
        var fbBtn=document.getElementById('ofb-btn');
        if(fbBtn){ fbBtn.style.bottom='calc('+getComputedStyle(fbBtn).bottom+' + '+h+'px)'; return true; }
        return false;
      }
      if(!adjustFeedbackBtn()){
        var tries=0;
        var t=setInterval(function(){ tries++; if(adjustFeedbackBtn()||tries>20) clearInterval(t); },150);
      }
    });
    var expired=false;
    function tick(){if(expired)return;var rem=expiresAt-Date.now();if(rem<=0){expired=true;timer.textContent='00:00';label.textContent='TRIAL EXPIRED';note.textContent='SESSION ENDED \u00B7 RESETTING PROGRESS...';sb.rpc('expire_trial',{p_uid:uid}).then(function(r){window.__omegaWriteFail('expire_trial',r);setTimeout(function(){safeRedirect('/pending.html?t=expired');},2200);});return;}var m=Math.floor(rem/60000),sc=Math.floor((rem%60000)/1000);timer.textContent=(m<10?'0':'')+m+':'+(sc<10?'0':'')+sc;if(rem<60000)bar.style.boxShadow='0 -2px 24px rgba(139,0,0,0.6)';setTimeout(tick,500);}
    tick();
  }
})();

/* LIGHT MODE REMOVED -- canon is absolute: void only, no light mode.
   Any previously stored light preference is purged so the void is enforced. */
(function(){try{localStorage.removeItem('omega_lux_mode');var b=document.getElementById('omega-lux-toggle');if(b)b.remove();}catch(e){}})();

/* TOPBAR HOME+BACK + MOBILE BOTTOM NAV */
(function(){
  var pg=(location.pathname.split('/').pop()||'').replace('.html','');
  var EX={'':1,'index':1,'account':1,'terms':1,'charter':1,'reset':1,'enter':1,'pending':1};
  if(EX[pg])return;
  /* CSS injection */
  if(!document.getElementById('omega-ui-css')){
    var s=document.createElement('style');s.id='omega-ui-css';
    s.textContent='.tnav-btn{font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:2px;color:var(--muted,#85837b);padding:5px 10px;border:1px solid rgba(201,168,76,.2);background:transparent;cursor:pointer;text-decoration:none;transition:color .15s,border-color .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.tnav-btn:hover{color:#C9A84C;border-color:rgba(201,168,76,.5)}.tnav-wrap{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}@media(max-width:760px){.tnav-btn{min-height:26px;padding:6px 10px}}a[href],button,[role=button],label,summary,select,input[type=checkbox],input[type=radio]{touch-action:manipulation}input[type=checkbox],input[type=radio]{min-width:24px;min-height:24px}';
    (document.head||document.documentElement).appendChild(s);
  }
  /* Topbar back/home */
  function injectTopbar(){
    var tb=document.querySelector('.topbar');
    if(!tb||document.getElementById('omega-tb-nav'))return;
    var tn=document.createElement('div');tn.id='omega-tb-nav';tn.className='tnav-wrap';
    var ha=document.createElement('a');ha.href='/dashboard.html';ha.className='tnav-btn';ha.innerHTML='\u2302 HOME';
    var bb=document.createElement('button');bb.className='tnav-btn';bb.innerHTML='\u2190 BACK';
    bb.addEventListener('click',function(){if(window.history.length>1){window.history.back();}else{window.location.href='/dashboard.html';}});
    tn.appendChild(ha);tn.appendChild(bb);
    tb.insertBefore(tn,tb.firstChild);
  }
  /* Mobile bottom nav is handled by nav.js (#omega-mob) -- an older, separate
     implementation used to also run here (#omega-mob-nav), and since both
     activated on nearly the same breakpoint (760px vs 767px) at the same
     bottom:0 position with the same z-index, they rendered stacked on top of
     each other on virtually every phone. Removed; nav.js's is the actively
     maintained, fuller version. */
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){injectTopbar();});}
  else{injectTopbar();}
})();


/* ========= OWNER NOTIFICATION BADGE (non-blocking) ========= */
(function(){
  var s=document.createElement('style');
  s.textContent=[
    '.omega-pending-badge{position:absolute;top:-3px;right:-3px;background:#8B0000;color:#fff;',
    'font-family:monospace;font-size:12px;font-weight:700;min-width:14px;height:14px;',
    'border-radius:0;display:flex;align-items:center;justify-content:center;padding:0 2px;',
    'animation:badge-pulse 1.5s ease-in-out infinite;z-index:999}',
    '.omega-alert{position:fixed;top:50px;right:18px;z-index:9998;background:rgba(13,13,24,.97);',
    'border:1px solid rgba(139,0,0,.5);border-left:3px solid #8B0000;padding:14px 18px;',
    'cursor:pointer;transition:all .2s;min-width:240px}',
    '@keyframes badge-pulse{0%,100%{box-shadow:0 0 4px rgba(139,0,0,.6)}50%{box-shadow:0 0 14px rgba(139,0,0,.9)}}'
  ].join('');
  (document.head||document.documentElement).appendChild(s);
})();

/* ========= LIFETIME ACCESS ENFORCEMENT + NOTIFICATION ========= */
setTimeout(function(){
  (async function(){
    try{
      var sb=await (window.OmegaSB?window.OmegaSB.get():(async function(){
        var mod=await import('/vendor/supabase-js.js');
        var cc=mod.createClient||mod.default&&mod.default.createClient;
        return cc?cc("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q"):null;
      })());
      if(!sb) return;
      var sess=(await sb.auth.getSession()).data.session;
      if(!sess) return;
      var uid=sess.user.id;
      var pr=(await sb.from('profiles').select('is_owner,access_approved,is_trial,trial_expires_at,axis_a').eq('id',uid).maybeSingle()).data;
      if(!pr||!pr.is_owner) return;
      window.__omegaIsOwner=true;
      document.body.classList.add('omega-owner');
      /* Enforce lifetime access */
      if(!pr.access_approved||pr.is_trial||pr.trial_expires_at||parseFloat(pr.axis_a)<9){
        /* This is the write that grants lifetime access. Unchecked, it could
           fail while the owner UI above had already been applied -- the screen
           agreeing with a database that never changed. The repair is idempotent
           and re-runs on the next load, so recording the failure is the fix;
           the owner class itself is correct either way, since it came from the
           is_owner column this update does not touch. */
        var ownerAccess=await sb.from('profiles').update({access_approved:true,is_trial:false,trial_expires_at:null,axis_a:9.000,axis_b:9.000,axis_c:9.000,material_tier:'OMEGA MASTER',membership_tier:9}).eq('id',uid);
        if(ownerAccess.error) window.__omegaWriteFail('owner_lifetime_access',ownerAccess);
      }
      /* Check pending members and notify */
      var res=await sb.from('profiles').select('id',{count:'exact',head:true}).eq('access_approved',false).eq('is_owner',false);
      var pendingCount=res.count||0;
      if(pendingCount>0){
        var el=document.createElement('a');
        el.href='/approvals.html';
        el.className='omega-alert';
        var d1=document.createElement('div');d1.style.cssText='font-family:Courier Prime,monospace;font-size:12px;letter-spacing:3px;color:#8B0000;margin-bottom:5px';d1.textContent='NEW ACCESS REQUEST'+(pendingCount>1?'S':'');
        var d2=document.createElement('div');d2.style.cssText='font-family:Cinzel Decorative,serif;font-size:20px;color:#C9A84C;font-weight:700;margin-bottom:4px';d2.textContent=pendingCount+' MEMBER'+(pendingCount>1?'S':'')+' WAITING';
        var d3=document.createElement('div');d3.style.cssText='font-family:Courier Prime,monospace;font-size:12px;color:#85837b;letter-spacing:1px';d3.textContent='Tap to open Access Control Center';
        el.appendChild(d1);el.appendChild(d2);el.appendChild(d3);
        document.body.appendChild(el);
        setTimeout(function(){try{document.body.removeChild(el);}catch(e){}},10000);
      }
    }catch(e){}
  })();
},1500);

/* ===== TRIAL AUTO-LOGOUT -- 9.1717 MINUTES ENFORCEMENT ===== */
(function(){
  async function checkTrialExpiry(){
    try{
      var sb=await (window.OmegaSB?window.OmegaSB.get():(async function(){
        var mod=await import('/vendor/supabase-js.js');
        var cc=mod.createClient||(mod.default&&mod.default.createClient);
        return cc?cc("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q"):null;
      })());
      if(!sb) return;
      var sess=(await sb.auth.getSession()).data.session;
      if(!sess) return;
      var pr=(await sb.from('profiles')
        .select('is_owner,is_trial,trial_expires_at,access_approved')
        .eq('id',sess.user.id)
        .maybeSingle()).data;
      if(!pr) return;
      if(pr.is_owner) return; /* Owner never expires */
      /* Check if trial is active */
      if(pr.is_trial && pr.trial_expires_at){
        var exp=new Date(pr.trial_expires_at);
        var now=Date.now();
        var msLeft=exp-now;
        if(msLeft<=0){
          /* Trial already expired -- log out immediately */
          await sb.auth.signOut();
          window.location.href='/pending.html?status=expired';
          return;
        }
        /* Set precise auto-logout timer */
        window.__trialLogoutTimer=setTimeout(async function(){
          await sb.auth.signOut();
          /* Show expiry overlay */
          var ov=document.createElement('div');
          ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(10,10,15,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:Courier Prime,monospace;text-align:center';
          ov.innerHTML='<div style="font-family:Cinzel Decorative,serif;font-size:clamp(40px,8vw,72px);color:#C9A84C;animation:val-breathe 2s ease-in-out infinite">&#937;</div>'
            +'<div style="font-family:Cinzel Decorative,serif;font-size:clamp(14px,3vw,22px);color:#8B0000;letter-spacing:3px">SESSION EXPIRED</div>'
            +'<div style="font-size:12px;letter-spacing:3px;color:#85837b;max-width:320px;line-height:1.8">YOUR 9H-17M-17S SESSION HAS ENDED.<br/>CONTACT THE ARCHITECT TO REQUEST CONTINUED ACCESS.</div>'
            +'<a href="/account.html" style="font-family:Courier Prime,monospace;font-size:12px;letter-spacing:3px;padding:12px 28px;border:1px solid rgba(201,168,76,.4);color:#C9A84C;text-decoration:none;margin-top:10px">RETURN TO LOGIN</a>';
          document.body.appendChild(ov);
        },msLeft);
        /* Show a trial countdown badge (subtle) */
        var minsLeft=Math.ceil(msLeft/60000);
        if(minsLeft<=2&&!document.getElementById('trial-warn')){
          var warn=document.createElement('div');
          warn.id='trial-warn';
          warn.style.cssText='position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:9997;background:rgba(139,0,0,.9);padding:8px 18px;font-family:Courier Prime,monospace;font-size:12px;letter-spacing:2px;color:#fff;animation:badge-pulse 1.5s ease-in-out infinite;white-space:nowrap';
          warn.textContent='TRIAL ENDING IN '+minsLeft+' MIN';
          document.body.appendChild(warn);
        }
      } else if(!pr.access_approved && !pr.is_trial){
        /* Not approved and not on trial -- send to pending */
        var path=window.location.pathname;
        var pub=['/account.html','/enter.html','/reset.html','/terms.html','/charter.html','/pending.html','/'];
        if(!pub.some(function(p){return path.endsWith(p)||path===p;})){
          window.location.href='/pending.html';
        }
      }
    }catch(e){}
  }
  /* Run after page load, with delay so canvas renders first */
  setTimeout(checkTrialExpiry,2000);
})();

/* ===== OMEGA ICON EMBLEMS -- every static icon glyph becomes a living,
   rotating, cinematic emblem. No emojis left static. Global; one shared
   animation loop; reduced-motion safe; pauses when the tab is hidden. ===== */
(function(){
  if(window.__omegaIcons)return; window.__omegaIcons=1;
  var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR=Math.min(window.devicePixelRatio||1,2);
  /* icon ranges: technical, misc-symbols, dingbats, geometric, zodiac,
     chess (kings/queens), Omega, Bitcoin.  Arrows are excluded (nav). */
  function isIcon(cp){
    return (cp>=0x2300&&cp<=0x23FF)||(cp>=0x2600&&cp<=0x26FF)||(cp>=0x2700&&cp<=0x27BF)||
           (cp>=0x25A0&&cp<=0x25FF)||(cp>=0x2648&&cp<=0x2653)||(cp>=0x265A&&cp<=0x265F)||
           cp===0x03A9||cp===0x20BF;
  }
  var items=[], hidden=false;
  function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
  /* A PURE-BLACK READING IS AN UNRESOLVED ONE, NOT A CHOICE. collect() reads
     getComputedStyle(el).color once, and many of these glyphs are inserted by
     JS and converted before the colour that styles them applies -- so the read
     lands on the initial value, rgb(0,0,0). Measured: account.html filled its
     zodiac emblems rgba(0,0,0,0.60-0.96) while architect.html, whose icons are
     in the markup, filled rgba(226,200,109,...). Black on this platform's
     near-black surface is invisible, and no page asks for it, so it is treated
     exactly like a failed match and falls back to the brand gold. */
  function rgbOf(c){var m=c&&c.match(/(\d+),\s*(\d+),\s*(\d+)/);if(!m||(+m[1]===0&&+m[2]===0&&+m[3]===0))return '201,168,76';return m[1]+','+m[2]+','+m[3];}

  function collect(){
    var all=document.querySelectorAll('span,div,i,b,em,h1,h2,h3,h4,small,strong');
    for(var i=0;i<all.length && items.length<70;i++){
      var el=all[i];
      if(el.children.length||el.__omegaIcon)continue;
      var txt=(el.textContent||'').trim();
      if(txt.length<1||txt.length>2)continue;
      var cp=txt.codePointAt(0);
      if(!isIcon(cp))continue;
      if(el.closest&&el.closest('#omega-emblem-wrap'))continue;
      var cs=getComputedStyle(el);
      var fs=parseFloat(cs.fontSize)||18;
      if(fs>64)continue;                                   /* skip giant display marks */
      var sz=Math.round(Math.min(46,Math.max(20,fs*1.7)));
      var cvs=document.createElement('canvas');
      cvs.width=cvs.height=Math.floor(sz*DPR);
      cvs.style.cssText='width:'+sz+'px;height:'+sz+'px;display:inline-block;vertical-align:middle';
      var ctx=cvs.getContext('2d');ctx.setTransform(DPR,0,0,DPR,0,0);
      el.setAttribute('aria-label',txt);
      el.textContent='';el.appendChild(cvs);el.__omegaIcon=1;
      items.push({ctx:ctx,sz:sz,glyph:txt,col:rgbOf(cs.color),motif:hash(txt)%4,
                  ph:Math.random()*6.283,fs:Math.min(fs,sz*0.62),isOmega:cp===0x03A9});
    }
  }

  function drawOne(it,t){
    var ctx=it.ctx,S=it.sz,c=it.col,R=S/2-2,ti=REDUCE?0:t;
    ctx.clearRect(0,0,S,S);
    ctx.save();ctx.translate(S/2,S/2);
    if(it.motif===0){            /* orbiting dots */
      for(var k=0;k<3;k++){var a=ti*0.9+k*2.094;ctx.beginPath();
        ctx.fillStyle='rgba('+c+','+(0.45+0.3*Math.sin(ti+k)).toFixed(2)+')';
        ctx.arc(Math.cos(a)*R*0.82,Math.sin(a)*R*0.82,1.4,0,6.283);ctx.fill();}
    }else if(it.motif===1){      /* sweeping ring */
      ctx.beginPath();ctx.arc(0,0,R*0.86,ti%6.283,(ti%6.283)+4.2);
      ctx.strokeStyle='rgba('+c+',0.5)';ctx.lineWidth=1.1;ctx.stroke();
    }else if(it.motif===2){      /* pulsing rays */
      for(var k=0;k<6;k++){var a=ti*0.7+k*1.047,l=R*(0.7+0.22*Math.sin(ti*1.3+k));
        ctx.beginPath();ctx.moveTo(Math.cos(a)*R*0.42,Math.sin(a)*R*0.42);
        ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l);
        ctx.strokeStyle='rgba('+c+','+(0.2+0.25*Math.abs(Math.sin(ti+k))).toFixed(2)+')';
        ctx.lineWidth=0.8;ctx.stroke();}
    }else{                       /* rotating triangle */
      ctx.beginPath();for(var k=0;k<=3;k++){var a=ti*0.5+k*2.094-1.57;
        var x=Math.cos(a)*R*0.85,y=Math.sin(a)*R*0.85;k===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.strokeStyle='rgba('+c+',0.45)';ctx.lineWidth=1;ctx.stroke();
    }
    var pulse=REDUCE?0.9:(0.78+0.18*Math.sin(ti*1.6+it.ph));
    ctx.font='600 '+Math.round(it.fs)+'px '+(it.isOmega?'"Cinzel Decorative",Georgia,serif':'"Segoe UI Symbol","Noto Sans Symbols2","Arial Unicode MS",sans-serif');
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba('+c+',0.8)';ctx.shadowBlur=6;
    ctx.fillStyle='rgba('+c+','+pulse.toFixed(2)+')';
    ctx.fillText(it.glyph,0,1);
    ctx.restore();ctx.shadowBlur=0;
  }

  function loop(t){if(!hidden){var ti=t*0.001;for(var i=0;i<items.length;i++)drawOne(items[i],ti);}requestAnimationFrame(loop);}
  function start(){collect();if(!items.length)return;if(REDUCE){for(var i=0;i<items.length;i++)drawOne(items[i],0);return;}requestAnimationFrame(loop);}
  document.addEventListener('visibilitychange',function(){hidden=document.hidden;});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* ===== OMEGA UX LAYER -- toasts + genesis intro + page transitions ===== */
(function(){
  if(window.__omegaUX)return; window.__omegaUX=1;
  var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Chromium 126+ supports cross-document View Transitions -- a native
     mechanism for animating BETWEEN two full page loads, not a
     same-document router trick. The single declarative
     `@view-transition{navigation:auto}` rule below, present in every page's
     stylesheet because bg.js injects it everywhere, is the entire
     requirement on paper: no JS, no per-page markup, no framework. Pure
     upside where it activates -- unsupported browsers (Safari/Firefox
     today) simply ignore the unknown at-rule and navigate exactly as
     before.
     IMPORTANT, and the reason the manual #omega-veil transition below stays
     UNCONDITIONAL rather than being feature-detected off: this session
     verified the rule is present and parses correctly (CSSViewTransitionRule)
     on real pages in this repo's own headless harness (Chromium 141), and
     confirmed zero errors/regressions from adding it -- but could NOT get a
     positive `pagereveal` viewTransition signal on an actual real-page
     navigation here despite it firing correctly on a from-scratch minimal
     reproduction on the identical binary. `'startViewTransition' in document`
     proves the API exists, not that a given navigation will actually use it,
     and this repo's own real pages showed the gap between those two things.
     So: never gate a real, tested fallback off the strength of a capability
     check alone when the capability's actual activation couldn't be
     confirmed -- that is exactly how a change looks correct in the diff
     while quietly deleting the one thing users could rely on (CLAUDE.md
     §8.4's "a rule that reached the file but not the cascade" class). Both
     mechanisms run together unconditionally: the veil already opacity-fades
     the outgoing frame to black *before* navigation fires, so if the native
     transition also activates on a given navigation it just crossfades
     from-black into the new page underneath the veil's own fade-out --
     complementary, not a doubled or clashing effect. */
  var st=document.createElement('style');
  st.textContent=[
    '#omega-toasts{position:fixed;right:18px;bottom:80px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none}',
    '@media(max-width:760px){#omega-toasts{bottom:215px;right:10px;left:10px;align-items:flex-end}}',
    '.omega-toast{font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0A0A0F;background:linear-gradient(90deg,#C9A84C,#E2C86D);padding:12px 18px;box-shadow:0 12px 34px -10px rgba(201,168,76,.55);transform:translateX(130%);transition:transform .5s cubic-bezier(.2,.8,.2,1);max-width:320px;border-left:3px solid #fff7d6}',
    '.omega-toast.in{transform:none}',
    '.omega-toast.cyan{background:linear-gradient(90deg,#00E5FF,#7fe9ff)}',
    '.omega-toast.crim{background:linear-gradient(90deg,#8B0000,#c0392b);color:#fff;border-left-color:#ffb3b3}',
    '#omega-veil{position:fixed;inset:0;z-index:99998;background:#0A0A0F;pointer-events:none;opacity:0;transition:opacity .4s ease}',
    '#omega-veil.show{opacity:1}',
    '#omega-genesis{position:fixed;inset:0;z-index:100000;background:radial-gradient(circle at 50% 45%,#0c0c16,#05050a 70%);display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:pointer;transition:opacity .8s ease}',
    '#omega-genesis .gx{font-family:"Cinzel Decorative",Georgia,serif;font-size:128px;color:#C9A84C;text-shadow:0 0 70px rgba(201,168,76,.65);opacity:0;animation:gx-ig 2.3s cubic-bezier(.2,.8,.2,1) forwards}',
    '#omega-genesis .gr{position:absolute;border:1px solid rgba(201,168,76,.25);border-radius:50%;width:260px;height:260px;opacity:0;animation:gr-ex 2.6s ease forwards}',
    '#omega-genesis .gr2{width:380px;height:380px;animation-delay:.2s}',
    '#omega-genesis .gt{font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:6px;color:#85837b;margin-top:30px;opacity:0;animation:gt-fd 1s ease 1.3s forwards}',
    '@keyframes gx-ig{0%{opacity:0;transform:scale(.55) rotate(-10deg)}55%{opacity:1;transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}',
    '@keyframes gr-ex{0%{opacity:0;transform:scale(.3)}40%{opacity:.6}100%{opacity:0;transform:scale(1.25)}}',
    '@keyframes gt-fd{to{opacity:1}}',
    '@view-transition{navigation:auto}',
    '@media(prefers-reduced-motion:no-preference){::view-transition-old(root){animation:omega-warp-out .38s cubic-bezier(.4,0,.2,1) both}::view-transition-new(root){animation:omega-warp-in .5s cubic-bezier(.16,1,.3,1) both}}',
    '@media(prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}',
    '@keyframes omega-warp-out{to{opacity:0;transform:scale(1.035);filter:blur(5px)}}',
    '@keyframes omega-warp-in{from{opacity:0;transform:scale(.975);filter:blur(3px)}}'
  ].join('');
  (document.head||document.documentElement).appendChild(st);

  /* ---- TOAST API ---- */
  var wrap;
  function ensure(){if(!wrap){wrap=document.createElement('div');wrap.id='omega-toasts';(document.body||document.documentElement).appendChild(wrap);}return wrap;}
  window.omegaToast=function(msg,type){
    ensure();var t=document.createElement('div');
    t.className='omega-toast'+(type==='cyan'?' cyan':(type==='error'?' crim':''));
    t.textContent=msg;wrap.appendChild(t);
    requestAnimationFrame(function(){t.classList.add('in');});
    setTimeout(function(){t.classList.remove('in');setTimeout(function(){t.remove();},520);},3200);
  };
  /* neutral click-acknowledgement on key action buttons (no page edits needed) */
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('button,.btn,[role="button"]');if(!b)return;
    var tx=(b.textContent||'').replace(/\s+/g,' ').trim().toUpperCase().replace(/[^A-Z0-9 ]/g,'');
    if(/\b(SAVE|SEAL|CLAIM|REGISTER|SUBMIT|CONFIRM|MINT|ACTIVATE|DISPATCH|BOOK|SEND|UPLOAD|GENERATE)\b/.test(tx)){
      var label=tx.length>30?tx.slice(0,30):tx;
      setTimeout(function(){window.omegaToast(label);},100);
    }
  },true);

  /* ---- PAGE TRANSITIONS ----
     Unconditional -- see the long comment above the injected CSS for why
     this never got feature-detected off. */
  var veil=document.createElement('div');veil.id='omega-veil';
  (function add(){if(document.body){document.body.appendChild(veil);}else requestAnimationFrame(add);})();

/* ===== UNIFIED CONTROL DOCK -- the single on-screen SOUND + LANGUAGE + HOME
   control. Previously three separate scripts (audio.js, i18n.js, and this
   one) each drew their own floating control in the top-right corner,
   stacking on top of each other -- the overlap in the reported screenshot.
   Now only this dock is visible; the other two still run their real engines
   underneath it (audio playback, string translation). ===== */
(function(){if(!document.querySelector('script[data-omega-controls]')){var s=document.createElement('script');s.src='/omega-controls.js';s.setAttribute('data-omega-controls','1');__omegaAppend(s);}})();
  if(!REDUCE){
    /* arrive: fade up from void */
    requestAnimationFrame(function(){veil.classList.add('show');setTimeout(function(){veil.classList.remove('show');},40);});
    document.addEventListener('click',function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
      var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
      if(a.hasAttribute('onclick')||a.target==='_blank'||a.hasAttribute('download'))return;
      var href=a.getAttribute('href')||'';
      if(href.indexOf('http')===0||href.charAt(0)==='#'||href.indexOf('mailto')===0||href.indexOf('tel:')===0)return;
      if(!/\.html(\?|$)/.test(href))return;
      e.preventDefault();veil.classList.add('show');
      setTimeout(function(){window.location.href=href;},340);
    },true);
    window.addEventListener('pageshow',function(){veil.classList.remove('show');});
  }

  /* ---- GENESIS INTRO (once per browser) ---- */
  try{
    if(!REDUCE && !localStorage.getItem('omega_genesis_seen')){
      (function showG(){
        if(!document.body){requestAnimationFrame(showG);return;}
        var g=document.createElement('div');g.id='omega-genesis';
        g.innerHTML='<div class="gr"></div><div class="gr gr2"></div><div class="gx">\u03A9</div><div class="gt">THE CODE . THE FREQUENCY . THE LEGACY</div>';
        document.body.appendChild(g);
        var done=function(){g.style.opacity='0';setTimeout(function(){if(g.parentNode)g.remove();},820);};
        g.addEventListener('click',done);setTimeout(done,3100);
        try{localStorage.setItem('omega_genesis_seen','1');}catch(e){}
      })();
    }
  }catch(e){}
})();

/* ===== OMEGA LIVE PULSE -- FEATURE_IDEAS.md #29, an ambient "the platform
   is alive" indicator ==========================================
   Real, not decorative: driven entirely by this file's own data-fetch
   recorder at the top of bg.js, which already emits omega:fetch-settled
   on every real request to this platform's backend (Supabase REST/Auth/
   Functions only -- see watched() above). omega-dataguard.js is the only
   existing consumer today and, by design, only reacts to failure ("no
   alarm for an empty result set"). This is a second, independent
   consumer answering a different question -- "is something happening"
   rather than "is something wrong" -- and never touches dataguard's own
   logic or DOM.

   Appended as a normal in-flow child of .topbar/.mission-bar, never
   position:fixed -- an ordinary flex child cannot collide with the fixed
   top-left/bottom chrome this file's own history has broken before
   (CLAUDE.md 4). One ping per settled success, restarted via a forced
   reflow rather than queued timers, so rapid consecutive requests each
   register instead of only the first. */
(function(){
  if(window.__omegaLivePulse)return; window.__omegaLivePulse=1;
  var st=document.createElement('style');
  st.textContent=[
    '.omega-live-pulse{width:7px;height:7px;border-radius:50%;background:rgba(201,168,76,.35);margin-left:10px;flex-shrink:0;transition:background .3s ease}',
    '.omega-live-pulse.ping{background:#C9A84C;box-shadow:0 0 8px 1px rgba(201,168,76,.8);animation:omega-pulse-ping .65s ease-out}',
    '@keyframes omega-pulse-ping{0%{transform:scale(1)}35%{transform:scale(1.8)}100%{transform:scale(1)}}',
    '@media(prefers-reduced-motion:reduce){.omega-live-pulse.ping{animation:none}}'
  ].join('');
  (document.head||document.documentElement).appendChild(st);

  function mount(){
    document.querySelectorAll('.topbar,.mission-bar').forEach(function(host){
      if(host.querySelector('.omega-live-pulse'))return;
      var dot=document.createElement('span');
      dot.className='omega-live-pulse';
      dot.setAttribute('aria-hidden','true');
      host.appendChild(dot);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();

  document.addEventListener('omega:fetch-settled',function(e){
    if(!(e.detail&&e.detail.ok))return;
    document.querySelectorAll('.omega-live-pulse').forEach(function(dot){
      dot.classList.remove('ping');
      void dot.offsetWidth; /* forces a reflow so a rapid second event restarts the animation */
      dot.classList.add('ping');
    });
  });
})();

/* ===== OMEGA LOADING -- top progress bar + skeleton shimmer ===== */
(function(){
  if(window.__omegaLoad)return; window.__omegaLoad=1;
  var REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st=document.createElement('style');
  st.textContent=[
    '#omega-prog{position:fixed;top:0;left:0;height:2px;width:0;z-index:100001;background:linear-gradient(90deg,#8B0000,#C9A84C,#00E5FF);box-shadow:0 0 12px rgba(201,168,76,.7);opacity:0;transition:width .3s ease,opacity .4s ease}',
    '#omega-prog.run{opacity:1}',
    '.omega-skel{position:relative;overflow:hidden;background:rgba(201,168,76,.05)}',
    '.omega-skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent);animation:omega-shimmer 1.4s infinite}',
    '@keyframes omega-shimmer{100%{transform:translateX(100%)}}',
    '@media(prefers-reduced-motion:reduce){.omega-skel::after{animation:none}}'
  ].join('');
  (document.head||document.documentElement).appendChild(st);

  var bar;
  function ensure(){if(!bar){bar=document.createElement('div');bar.id='omega-prog';(document.body||document.documentElement).appendChild(bar);}return bar;}
  var prog=0,timer=null;
  function start(){
    if(REDUCE)return; ensure();prog=8;bar.classList.add('run');bar.style.width='8%';
    clearInterval(timer);
    timer=setInterval(function(){prog+=Math.max(0.5,(90-prog)*0.08);if(prog>90)prog=90;bar.style.width=prog+'%';},120);
  }
  function done(){
    if(!bar)return; clearInterval(timer);prog=100;bar.style.width='100%';
    setTimeout(function(){bar.classList.remove('run');setTimeout(function(){bar.style.width='0';},400);},250);
  }
  window.omegaLoad={start:start,done:done};

  /* run on initial load */
  if(!REDUCE){
    start();
    if(document.readyState==='complete')done();
    else window.addEventListener('load',function(){setTimeout(done,200);});
    /* run on internal navigation (pairs with the page-transition veil) */
    document.addEventListener('click',function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
      var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
      if(a.hasAttribute('onclick')||a.target==='_blank'||a.hasAttribute('download'))return;
      var href=a.getAttribute('href')||'';
      if(/\.html(\?|$)/.test(href)&&href.indexOf('http')!==0&&href.charAt(0)!=='#')start();
    },true);
    window.addEventListener('pageshow',done);
  }

  /* auto-shimmer: brief skeleton on data containers until they fill (or 4s cap) */
  if(!REDUCE){
    var sel='#asset-tbody,#agent-log,#franchise-grid,[data-loading],.kpi-val';
    function applySkel(){
      [].slice.call(document.querySelectorAll(sel)).forEach(function(el){
        if(el.__skel||el.children.length||(el.textContent||'').trim())return;
        el.classList.add('omega-skel');el.__skel=1;
        /* Respect a page-authored min-height (e.g. a small inline label sized
           to its own content) instead of always forcing the 40px content-
           block default -- this check runs at DOMContentLoaded, before the
           approval guard reveals #app/.shell/main.main, so offsetHeight
           reads 0 for every candidate regardless of its real layout size;
           without this guard the 40px fallback fired unconditionally on
           every [data-loading] element, distorting small labels into
           oversized bars. */
        if(!el.style.minHeight&&el.offsetHeight<8)el.style.minHeight='40px';
        var obs=new MutationObserver(function(){
          if(el.children.length||(el.textContent||'').trim()){el.classList.remove('omega-skel');el.style.minHeight='';obs.disconnect();}
        });
        obs.observe(el,{childList:true,characterData:true,subtree:true});
        setTimeout(function(){el.classList.remove('omega-skel');el.style.minHeight='';try{obs.disconnect();}catch(e){}},4000);
      });
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applySkel);else applySkel();
  }
})();

/* ===== PASSWORD REVEAL -- every password field across the platform gains a
   living emblem toggle to show or hide its value. One global implementation;
   pure SVG/ASCII emblem (no emoji); gold-to-cyan on activation; catches fields
   that appear later (e.g. the auth panel). ===== */
(function(){
  if(window.__omegaPwReveal)return; window.__omegaPwReveal=1;
  var OPEN='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.2"/></svg>';
  var OFF ='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.2"/><line x1="3.5" y1="3.5" x2="20.5" y2="20.5"/></svg>';
  function enhance(inp){
    if(inp.__omegaReveal||inp.getAttribute('type')!=='password')return; inp.__omegaReveal=1;
    var wrap=document.createElement('span'); wrap.style.cssText='position:relative;display:block';
    inp.parentNode.insertBefore(wrap,inp); wrap.appendChild(inp);
    try{inp.style.paddingRight='46px';}catch(e){}
    var btn=document.createElement('button');
    btn.type='button'; btn.tabIndex=-1; btn.setAttribute('aria-label','Show or hide password');
    btn.style.cssText='position:absolute;top:50%;right:12px;transform:translateY(-50%);background:none;border:0;padding:4px;margin:0;cursor:pointer;color:#C9A84C;opacity:.68;transition:opacity .2s ease,color .2s ease,transform .18s ease;display:flex;align-items:center;line-height:0';
    btn.innerHTML=OFF;
    btn.onmouseenter=function(){btn.style.opacity='1';};
    btn.onmouseleave=function(){btn.style.opacity=(inp.getAttribute('type')==='text')?'1':'.68';};
    btn.onclick=function(e){
      e.preventDefault();
      var reveal=inp.getAttribute('type')==='password';
      inp.setAttribute('type',reveal?'text':'password');
      btn.innerHTML=reveal?OPEN:OFF;
      btn.style.color=reveal?'#00E5FF':'#C9A84C';
      btn.style.opacity=reveal?'1':'.68';
      btn.style.transform='translateY(-50%) scale(1.18)';
      setTimeout(function(){btn.style.transform='translateY(-50%) scale(1)';},170);
      try{inp.focus();}catch(_){}
    };
    wrap.appendChild(btn);
  }
  function scan(){var l=document.querySelectorAll('input[type=password]');for(var i=0;i<l.length;i++)enhance(l[i]);}
  function boot(){scan();try{new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


  /* Decision & deliberation engine */
  if(!document.querySelector('script[data-omega-council]')){
    var sc=document.createElement('script');sc.src='/omega-council.js';
    sc.setAttribute('data-omega-council','1');sc.defer=true;
    __omegaAppend(sc);
  }
  /* Labors & trials tracking system */
  if(!document.querySelector('script[data-omega-hercules]')){
    var sh=document.createElement('script');sh.src='/omega-hercules.js';
    sh.setAttribute('data-omega-hercules','1');sh.defer=true;
    __omegaAppend(sh);
  }
  /* Presence engine */
  if(!document.querySelector('script[data-omega-presence]')){
    var sp=document.createElement('script');sp.src='/omega-presence.js';
    sp.setAttribute('data-omega-presence','1');sp.defer=true;
    __omegaAppend(sp);
  }
  /* Recommendation engine */
  if(!document.querySelector('script[data-omega-recommend]')){
    var sr=document.createElement('script');sr.src='/omega-recommend.js';
    sr.setAttribute('data-omega-recommend','1');sr.defer=true;
    __omegaAppend(sr);
  }
  /* ── NEW ENGINES: Functional Validation Pass ─────────────────── */
  /* Cinematic animation engine */
  if(!document.querySelector('script[data-omega-animate]')){var _oa=document.createElement('script');_oa.src='/omega-animated.js';_oa.setAttribute('data-omega-animate','1');_oa.defer=true;__omegaAppend(_oa);}
  /* Live data binding engine */
  if(!document.querySelector('script[data-omega-live]')){var _ol=document.createElement('script');_ol.src='/omega-live.js';_ol.setAttribute('data-omega-live','1');_ol.defer=true;__omegaAppend(_ol);}
  /* Universal component state machine */
  if(!document.querySelector('script[data-omega-state]')){var _ost=document.createElement('script');_ost.src='/omega-state.js';_ost.setAttribute('data-omega-state','1');_ost.defer=true;__omegaAppend(_ost);}
  /* User journey analytics */
  if(!document.querySelector('script[data-omega-telemetry]')){var _otel=document.createElement('script');_otel.src='/omega-telemetry.js';_otel.setAttribute('data-omega-telemetry','1');_otel.defer=true;__omegaAppend(_otel);}
  /* Open-source library manager */
  if(!document.querySelector('script[data-omega-oss]')){var _ooss=document.createElement('script');_ooss.src='/omega-oss.js';_ooss.setAttribute('data-omega-oss','1');_ooss.defer=true;__omegaAppend(_ooss);}

  /* ── ABSOLUTE MASTER EVOLUTION ENGINES ────────────────────────── */
  /* Multi-agent AI orchestration with ReAct reasoning */
  if(!document.querySelector('script[data-omega-intelligence]')){var _oi=document.createElement('script');_oi.src='/omega-intelligence.js';_oi.setAttribute('data-omega-intelligence','1');_oi.defer=true;__omegaAppend(_oi);}
  /* Persistent AI memory — cross-session continuity */
  if(!document.querySelector('script[data-omega-memory]')){var _om=document.createElement('script');_om.src='/omega-memory.js';_om.setAttribute('data-omega-memory','1');_om.defer=true;__omegaAppend(_om);}
  /* Sovereign workflow orchestration engine */
  if(!document.querySelector('script[data-omega-workflow]')){var _ow=document.createElement('script');_ow.src='/omega-workflow.js';_ow.setAttribute('data-omega-workflow','1');_ow.defer=true;__omegaAppend(_ow);}
  /* Voice interface — Web Speech API commands + TTS */
  if(!document.querySelector('script[data-omega-voice]')){var _ov=document.createElement('script');_ov.src='/omega-voice.js';_ov.setAttribute('data-omega-voice','1');_ov.defer=true;__omegaAppend(_ov);}
  /* Zero Trust continuous auth guardian */
  if(!document.querySelector('script[data-omega-guardian]')){var _og=document.createElement('script');_og.src='/omega-guardian.js';_og.setAttribute('data-omega-guardian','1');_og.defer=true;__omegaAppend(_og);}

  /* ── FIOS TRANSFORMATION ENGINES ─────────────────────────────── */
  /* Capability engine — every page becomes a business capability */
  if(!document.querySelector('script[data-omega-capability]')){var _ocap=document.createElement('script');_ocap.src='/omega-capability.js';_ocap.setAttribute('data-omega-capability','1');_ocap.defer=true;__omegaAppend(_ocap);}
  /* Policy engine — externalised business rules */
  if(!document.querySelector('script[data-omega-policy]')){var _opol=document.createElement('script');_opol.src='/omega-policy.js';_opol.setAttribute('data-omega-policy','1');_opol.defer=true;__omegaAppend(_opol);}
  /* FinOps engine — cost tracking and governance */
  if(!document.querySelector('script[data-omega-finops]')){var _ofops=document.createElement('script');_ofops.src='/omega-finops.js';_ofops.setAttribute('data-omega-finops','1');_ofops.defer=true;__omegaAppend(_ofops);}
  /* Experimentation engine — A/B tests, feature flags */
  if(!document.querySelector('script[data-omega-experiment]')){var _oexp=document.createElement('script');_oexp.src='/omega-experiment.js';_oexp.setAttribute('data-omega-experiment','1');_oexp.defer=true;__omegaAppend(_oexp);}
  /* Digital thread — requirements-to-telemetry traceability */
  /* No omega-thread.js on disk. The digital-thread/requirements-traceability
     content (window.OmegaThread) actually lives inside omega-threat.js
     (loaded above, filename mismatch against its own header comment and
     window.OmegaThread export) -- there is no separate file to load here. */

  /* ── IDOS TRANSFORMATION — Living Operating System ────────────── */
  /* Living Object System — hover panels, right-click menus, AI insights */
  if(!document.querySelector('script[data-omega-actions]')){var _oac=document.createElement('script');_oac.src='/omega-actions.js';_oac.setAttribute('data-omega-actions','1');_oac.defer=true;__omegaAppend(_oac);}
  /* Real-time intelligence — live ticker, member pulse, activity feed */
  if(!document.querySelector('script[data-omega-realtime]')){var _ort=document.createElement('script');_ort.src='/omega-realtime.js';_ort.setAttribute('data-omega-realtime','1');_ort.defer=true;__omegaAppend(_ort);}
  /* Platform Meaning Index — scores, mission banners, PMI badges */
  if(!document.querySelector('script[data-omega-pmi]')){var _opmi=document.createElement('script');_opmi.src='/omega-pml.js';_opmi.setAttribute('data-omega-pmi','1');_opmi.defer=true;__omegaAppend(_opmi);}

  /* Async region shell — loading/empty/error states + retry (audit F-6) */
  if(!document.querySelector('script[data-omega-shell]')){var _osh=document.createElement('script');_osh.src='/omega-shell.js';_osh.setAttribute('data-omega-shell','1');_osh.defer=true;__omegaAppend(_osh);}

  /* Platform keyboard navigation — g-sequences, ?, Ctrl+K, n, c shortcuts */
  if(!document.querySelector('script[data-omega-keyboard]')){var _okb=document.createElement('script');_okb.src='/omega-keyboard.js';_okb.setAttribute('data-omega-keyboard','1');_okb.defer=true;__omegaAppend(_okb);}
  /* Legal compliance — copyright badge, GDPR consent, terms footer links */
  /* BOTTOM STACK — publishes --omega-chrome-bottom / --omega-transient-bottom,
     the measured reach of the persistent bottom furniture and of whatever
     transient banner is up. omega-legal.js, omega-pwa.js, omega-share.js and
     the desktop ladder below all read those properties WITH A 0px FALLBACK,
     so when this injection is missing nothing errors and nothing moves — the
     consent banner simply lands on top of the mobile nav again. That is
     exactly what happened: ed9eb76b rewrote the one-line injected stylesheet
     and took this line with it, and the platform shipped eight days with the
     collision restored and no signal louder than an audit.py WARNING.
     Injected BEFORE omega-legal.js so the property is set by the time that
     banner can appear; the var() fallback covers the race anyway. Its own
     guard attribute — a guard is the module's identity, not the feature
     area's (CLAUDE.md 8.1 class 5b). */
  if(!document.querySelector('script[data-omega-bottom-stack]')){var _obstk=document.createElement('script');_obstk.src='/omega-bottom-stack.js';_obstk.setAttribute('data-omega-bottom-stack','1');_obstk.defer=true;__omegaAppend(_obstk);}
  if(!document.querySelector('script[data-omega-legal]')){var _olegal=document.createElement('script');_olegal.src='/omega-legal.js';_olegal.setAttribute('data-omega-legal','1');_olegal.defer=true;__omegaAppend(_olegal);}
  /* QR code engine — member credential QR, digital pass download */
  if(!document.querySelector('script[data-omega-qr]')){var _oqr=document.createElement('script');_oqr.src='/omega-qr.js';_oqr.setAttribute('data-omega-qr','1');_oqr.defer=true;__omegaAppend(_oqr);}
  /* Guided platform tour — Shepherd.js (MIT), first-time member walkthrough */
  if(!document.querySelector('script[data-omega-tour]')){var _otour=document.createElement('script');_otour.src='/omega-tour.js';_otour.setAttribute('data-omega-tour','1');_otour.defer=true;__omegaAppend(_otour);}
  /* Cinematic transitions — curtain nav, scroll reveals, count-up, stagger */
  if(!document.querySelector('script[data-omega-cinematic]')){var _ocin=document.createElement('script');_ocin.src='/omega-cinematic.js';_ocin.setAttribute('data-omega-cinematic','1');_ocin.defer=true;__omegaAppend(_ocin);}
  /* Cinematic emblem system — .omega-cinematic body class, ambient starfield
     layer, pointer-parallax custom properties. A DIFFERENT guard attribute
     than omega-cinematic.js above on purpose (CLAUDE.md bug class 5b: two
     modules sharing one data-omega-* guard means only the first ever loads). */
  if(!document.querySelector('script[data-omega-cinematic-system]')){var _ocsy=document.createElement('script');_ocsy.src='/omega-cinematic-system.js';_ocsy.setAttribute('data-omega-cinematic-system','1');_ocsy.defer=true;__omegaAppend(_ocsy);}
  /* WCAG 2.1 AA — skip links, focus trap, live region, landmark ARIA */
  if(!document.querySelector('script[data-omega-a11y]')){var _oa11y=document.createElement('script');_oa11y.src='/omega-a11y.js';_oa11y.setAttribute('data-omega-a11y','1');_oa11y.defer=true;__omegaAppend(_oa11y);}
  /* Sovereign chart system — Chart.js auto-mount via [data-omega-chart] */
  if(!document.querySelector('script[data-omega-chart-mod]')){var _ochrt=document.createElement('script');_ochrt.src='/omega-chart.js';_ochrt.setAttribute('data-omega-chart-mod','1');_ochrt.defer=true;__omegaAppend(_ochrt);}
  /* Sovereign progress ring — Canvas SVG circular authority ring */
  if(!document.querySelector('script[data-omega-ring]')){var _oring=document.createElement('script');_oring.src='/omega-ring.js';_oring.setAttribute('data-omega-ring','1');_oring.defer=true;__omegaAppend(_oring);}

  /* PWA install banner + offline network ribbon + native share + badge API */
  if(!document.querySelector('script[data-omega-pwa]')){var _opwa=document.createElement('script');_opwa.src='/omega-pwa.js';_opwa.setAttribute('data-omega-pwa','1');_opwa.defer=true;__omegaAppend(_opwa);}

  /* Sovereign share-card generator — canvas identity card with download + native share */
  if(!document.querySelector('script[data-omega-sharecard]')){var _osc=document.createElement('script');_osc.src='/omega-share-card.js';_osc.setAttribute('data-omega-sharecard','1');_osc.defer=true;__omegaAppend(_osc);}

  /* Welcome demo video — must load on dashboard.html, the login landing page */
  if(!document.querySelector('script[data-omega-demo]')){var _odv=document.createElement('script');_odv.src='/omega-demo-video.js';_odv.setAttribute('data-omega-demo','1');_odv.defer=true;__omegaAppend(_odv);}

  /* Chronometers: 9m17s approval window + 9h17m17s daily presence */
  if(!document.querySelector('script[data-omega-chronometer]')){var _och=document.createElement('script');_och.src='/omega-chronometer.js';_och.setAttribute('data-omega-chronometer','1');_och.defer=true;__omegaAppend(_och);}

  /* Service worker registration — sw.js existed but was never registered */
  if(!document.querySelector('script[data-omega-swreg]')){var _osw=document.createElement('script');_osw.src='/omega-sw-register.js';_osw.setAttribute('data-omega-swreg','1');_osw.defer=true;__omegaAppend(_osw);}

  /* Unified UI — footer, prev/next nav, back button, keyboard shortcuts */
  if(!document.querySelector('script[data-omega-ui]')){var _oui2=document.createElement('script');_oui2.src='/omega-ui.js';_oui2.setAttribute('data-omega-ui','1');_oui2.defer=true;__omegaAppend(_oui2);}

  /* THE SCULPTURE — the platform's real-time 3-D layer (omega-sculpture.js).

     Injected ONLY on a page that actually carries a [data-omega-sculpture]
     mount. This is deliberate and it is not a micro-optimisation: the module
     itself is small, but the first mount it finds dynamic-imports
     /vendor/three.module.js, which is 670KB. Loading the scanner everywhere
     would put that import one DOM mutation away on all 202 pages. A page opts
     in by carrying the attribute; every other page pays nothing at all.

     bg.js is deferred, so the document is parsed by the time this runs and the
     query sees every static mount. A page that injects a mount later can call
     window.OmegaSculpture.mount(el) or load the module itself.

     NAMED "sculpture", not "forge": forge.html is FORGE TRIALS, an existing
     timed mental-mastery feature with its own nav entry, and a 3-D engine
     sharing that word would be exactly the divergent-naming confusion
     CLAUDE.md 8.1 class 8 is about. index.html's own hero comment already
     called this thing the sculpture. */
  if(document.querySelector('[data-omega-sculpture]') && !document.querySelector('script[data-omega-sculpture-js]')){
    var _osc=document.createElement('script');_osc.src='/omega-sculpture.js';
    _osc.setAttribute('data-omega-sculpture-js','1');_osc.defer=true;__omegaAppend(_osc);
  }

  /* Sovereign tooltip system — Tippy.js v6 (MIT) via CDN, auto-mounts [data-tooltip] */
  if(!document.querySelector('script[data-omega-tooltip]')){var _ott=document.createElement('script');_ott.src='/omega-tooltip.js';_ott.setAttribute('data-omega-tooltip','1');_ott.defer=true;__omegaAppend(_ott);}

  /* Sovereign celebration engine — gate unlock bursts, milestone banners, apex sequence */
  if(!document.querySelector('script[data-omega-confetti]')){var _ocnf=document.createElement('script');_ocnf.src='/omega-confetti.js';_ocnf.setAttribute('data-omega-confetti','1');_ocnf.defer=true;__omegaAppend(_ocnf);}

  /* Element particle backgrounds — tsParticles-slim@2 (MIT), fires on omega:user-loaded */
  if(!document.querySelector('script[data-omega-particles]')){var _opar=document.createElement('script');_opar.src='/omega-particles.js';_opar.setAttribute('data-omega-particles','1');_opar.defer=true;__omegaAppend(_opar);}

  /* Procedural ambient soundscapes — Web Audio API, [data-ambient-toggle] to unmute */
  if(!document.querySelector('script[data-omega-ambient]')){var _oamb=document.createElement('script');_oamb.src='/omega-ambient.js';_oamb.setAttribute('data-omega-ambient','1');_oamb.defer=true;__omegaAppend(_oamb);}

  /* Sovereign passport PDF — jsPDF@2 (MIT), [data-passport-download] triggers download */
  if(!document.querySelector('script[data-omega-passport]')){var _opas=document.createElement('script');_opas.src='/omega-passport.js';_opas.setAttribute('data-omega-passport','1');_opas.defer=true;__omegaAppend(_opas);}

  /* 3-D element realm — Three.js r160 (MIT), mounts canvas[data-realm] */
  if(!document.querySelector('script[data-omega-realm]')){var _orlm=document.createElement('script');_orlm.src='/omega-realm.js';_orlm.setAttribute('data-omega-realm','1');_orlm.defer=true;__omegaAppend(_orlm);}

  /* Generative music engine — Tone.js v14 (MIT), [data-music-toggle] to play */
  if(!document.querySelector('script[data-omega-music]')){var _omus=document.createElement('script');_omus.src='/omega-music.js';_omus.setAttribute('data-omega-music','1');_omus.defer=true;__omegaAppend(_omus);}

  /* Procedural SVG sigil generator — deterministic from auth/element/name */
  if(!document.querySelector('script[data-omega-sigil-gen]')){var _osig=document.createElement('script');_osig.src='/omega-sigil-gen.js';_osig.setAttribute('data-omega-sigil-gen','1');_osig.defer=true;__omegaAppend(_osig);}

  /* Platform-wide event bus — BroadcastChannel + IndexedDB + domain event catalog */
  if(!document.querySelector('script[data-omega-event-bus]')){var _oebus=document.createElement('script');_oebus.src='/omega-event-bus.js';_oebus.setAttribute('data-omega-event-bus','1');_oebus.defer=true;__omegaAppend(_oebus);}

  /* Sovereign worker fleet — 6 async consumers with circuit breaker + retry + DLQ */
  if(!document.querySelector('script[data-omega-workers]')){var _owrk=document.createElement('script');_owrk.src='/omega-workers.js';_owrk.setAttribute('data-omega-workers','1');_owrk.defer=true;__omegaAppend(_owrk);}
  if(!document.querySelector('script[data-omega-member-state]')){var _omst=document.createElement('script');_omst.src='/omega-member-state.js';_omst.setAttribute('data-omega-member-state','1');_omst.defer=true;__omegaAppend(_omst);}
  /* Loaded platform-wide so every page can hand the member their data back. It reached only 7 finance pages before; 43 pages held localStorage-only data with no export path at all. */
  if(!document.querySelector('script[data-omega-local-backup]')){var _olb=document.createElement('script');_olb.src='/omega-local-backup.js';_olb.setAttribute('data-omega-local-backup','1');_olb.defer=true;__omegaAppend(_olb);}
  /* Platform-wide because CLAUDE.md section 9's dormancy rule is platform-wide: any page may
     gate a monetizable surface with data-omega-flag, so the gate cannot be a per-page opt-in.
     This module only performs the RPC and the reveal; the hide-first CSS is written
     synchronously further up, because a dynamic script like this one is async and cannot be
     relied on to parse before the approval guard reveals the shell. */
  if(!document.querySelector('script[data-omega-flags]')){var _oflg=document.createElement('script');_oflg.src='/omega-flags.js';_oflg.setAttribute('data-omega-flags','1');__omegaAppend(_oflg);}

  /* Ω Cache Optimizer — aggressive static asset caching, IndexedDB support, prefetch */
  if(!document.querySelector('script[data-omega-cache]')){var _occh=document.createElement('script');_occh.src='/omega-cache-optimizer.js';_occh.setAttribute('data-omega-cache','1');_occh.defer=true;__omegaAppend(_occh);}

  /* Ω Resilience Engine — automatic retry logic, circuit breaker, graceful degradation */
  if(!document.querySelector('script[data-omega-resilience]')){var _oresil=document.createElement('script');_oresil.src='/omega-resilience.js';_oresil.setAttribute('data-omega-resilience','1');_oresil.defer=true;__omegaAppend(_oresil);}

  /* Ω WCAG AAA Enhancement — beyond AA compliance, enhanced focus, skip links, a11y */
  if(!document.querySelector('script[data-omega-wcag-aaa]')){var _owcag=document.createElement('script');_owcag.src='/omega-wcag-aaa.js';_owcag.setAttribute('data-omega-wcag-aaa','1');_owcag.defer=true;__omegaAppend(_owcag);}

  /* Ω Performance Monitor — Core Web Vitals tracking, API timing, error metrics */
  if(!document.querySelector('script[data-omega-monitoring]')){var _omon=document.createElement('script');_omon.src='/omega-monitoring.js';_omon.setAttribute('data-omega-monitoring','1');_omon.defer=true;__omegaAppend(_omon);}

  /* Ω Security Hardening — input sanitization, XSS prevention, secure storage */
  if(!document.querySelector('script[data-omega-security]')){var _osec=document.createElement('script');_osec.src='/omega-security.js';_osec.setAttribute('data-omega-security','1');_osec.defer=true;__omegaAppend(_osec);}

  /* Ω Enhanced Search — indexed search, relevance ranking, smart highlighting */
  if(!document.querySelector('script[data-omega-search-enhanced]')){var _osea=document.createElement('script');_osea.src='/omega-search-enhanced.js';_osea.setAttribute('data-omega-search-enhanced','1');_osea.defer=true;__omegaAppend(_osea);}

  /* Ω Query Optimizer — batch queries, connection pooling, lazy loading */
  if(!document.querySelector('script[data-omega-query-opt]')){var _oqo=document.createElement('script');_oqo.src='/omega-query-optimizer.js';_oqo.setAttribute('data-omega-query-opt','1');_oqo.defer=true;__omegaAppend(_oqo);}

  /* Ω Animation Optimizer — GPU acceleration, frame rate control, motion-safe */
  if(!document.querySelector('script[data-omega-anim-opt]')){var _oao=document.createElement('script');_oao.src='/omega-animation-optimizer.js';_oao.setAttribute('data-omega-anim-opt','1');_oao.defer=true;__omegaAppend(_oao);}

  /* Ω Sync Engine — offline-first sync, conflict resolution, cross-tab broadcast */
  if(!document.querySelector('script[data-omega-sync]')){var _osyn=document.createElement('script');_osyn.src='/omega-sync-engine.js';_osyn.setAttribute('data-omega-sync','1');_osyn.defer=true;__omegaAppend(_osyn);}

  /* Ω DevTools — performance profiling, error reporting, debugging utilities */
  if(!document.querySelector('script[data-omega-devtools]')){var _odev=document.createElement('script');_odev.src='/omega-devtools.js';_odev.setAttribute('data-omega-devtools','1');_odev.defer=true;__omegaAppend(_odev);}
