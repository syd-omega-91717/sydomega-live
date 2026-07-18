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
(function () {
  if (window.OmegaSB) return;
  var URL = "https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var KEY = "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";
  var _p = null;
  function get() {
    if (_p) return _p;
    _p = import('https://esm.sh/@supabase/supabase-js@2').then(function (mod) {
      var cc = mod.createClient || (mod.default && mod.default.createClient);
      if (!cc) throw new Error('supabase createClient unavailable');
      return cc(URL, KEY);
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
    '.pr-opt{padding:7px 9px;font-size:9px}',
    /* Member row stack */
    '.mbr-row{flex-direction:column;align-items:flex-start}',
    '.mbr-actions{width:100%;justify-content:flex-start}',
    '}',
    /* ===== SHARED HEADER COMPONENTS -- centralizes .topbar (54 pages) and .hero-band ===== */
    /* (6 pages), previously each page carried its own separate (and drifting) copy.    */
    '.topbar{border-bottom:1px solid rgba(201,168,76,.16);padding:20px clamp(14px,3vw,36px);background:rgba(8,8,15,.9)}',
    '.topbar .t{font-family:"Cinzel Decorative",serif;font-weight:700;color:#C9A84C;font-size:clamp(18px,3vw,26px);letter-spacing:2px}',
    '.topbar .t small{display:block;font-family:"Courier Prime",monospace;font-size:10px;color:#85837b;letter-spacing:3px;margin-top:4px}',
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
(function(){ if(!document.querySelector('script[data-omega-theme]')){ var s=document.createElement('script'); s.src='/theme.js'; s.setAttribute('data-omega-theme','1'); (document.body||document.documentElement).appendChild(s); } })();

(function(){if(!document.querySelector('script[data-omega-emblem]')){var s=document.createElement('script');s.src='/emblem.js';s.setAttribute('data-omega-emblem','1');(document.body||document.documentElement).appendChild(s);}})();

/* Audio loader */
(function(){if(!document.querySelector('script[data-omega-audio]')){var s=document.createElement('script');s.src='/audio.js';s.setAttribute('data-omega-audio','1');if(document.body)document.body.appendChild(s);}})();
/* ===== MULTI-LANGUAGE -- activate the i18n engine on every page (EN / AR-RTL / FR / ES) ===== */
(function(){if(!document.querySelector('script[data-omega-i18n]')){var s=document.createElement('script');s.src='/i18n.js';s.setAttribute('data-omega-i18n','1');if(document.body)document.body.appendChild(s);}})();
/* ===== GENESIS VISUAL ENGINE -- make every page alive (armillary, particles, cinematic depth) ===== */
(function(){if(!document.querySelector('script[data-omega-genesis]')){var s=document.createElement('script');s.src='/omega-genesis.js';s.setAttribute('data-omega-genesis','1');if(document.body)document.body.appendChild(s);}})();
/* ===== SOVEREIGN BACKDROP -- warm element-tinted base, per-page shade ===== */
(function(){if(!document.querySelector('script[data-omega-backdrop]')){var s=document.createElement('script');s.src='/omega-backdrop.js';s.setAttribute('data-omega-backdrop','1');if(document.body)document.body.appendChild(s);}})();
/* ===== 12 LIVING EMBLEMS -- per-sign animated marks ===== */
(function(){if(!document.querySelector('script[data-omega-emblems]')){var s=document.createElement('script');s.src='/omega-emblems.js';s.setAttribute('data-omega-emblems','1');if(document.body)document.body.appendChild(s);}})();
/* ===== CONTENT MOTION -- count-up numbers, staggered reveals, tile glow (legible) ===== */
(function(){if(!document.querySelector('script[data-omega-content]')){var s=document.createElement('script');s.src='/omega-content.js';s.setAttribute('data-omega-content','1');if(document.body)document.body.appendChild(s);}})();
/* ===== 9D ENGINE -- parallax, holographic glow, cinematic transitions, reactive audio ===== */
(function(){if(!document.querySelector('script[data-omega-9d]')){var s=document.createElement('script');s.src='/omega-9d.js';s.setAttribute('data-omega-9d','1');if(document.body)document.body.appendChild(s);}})();
/* ===== COMPONENT SYSTEM -- G12 button/card states + responsive matrix ===== */
(function(){if(!document.querySelector('script[data-omega-components]')){var s=document.createElement('script');s.src='/omega-components.js';s.setAttribute('data-omega-components','1');if(document.body)document.body.appendChild(s);}})();
/* ===== LIVING OMEGA SIGIL -- disabled: omega-sigil.js is not valid JS (it's an
   orphaned HTML page mislabeled with a .js extension), loading it threw a syntax
   error on every single page. Removed here; delete the file itself from the repo
   once you've decided whether it should become a real page or be discarded. ===== */

/* ===== ELEMENT MOTIFS -- shared thematic animations for the 9 elements ===== */
(function(){if(!document.querySelector('script[data-omega-element-motif]')){var s=document.createElement('script');s.src='/omega-element-motif.js';s.setAttribute('data-omega-element-motif','1');if(document.body)document.body.appendChild(s);}})();

/* ===== EMBLEM PANEL -- the emblem-as-function pattern, loaded once, used everywhere ===== */
(function(){if(!document.querySelector('script[data-omega-emblem-panel]')){var s=document.createElement('script');s.src='/omega-emblem-panel.js';s.setAttribute('data-omega-emblem-panel','1');if(document.body)document.body.appendChild(s);}})();

/* ===== CANON BADGE -- distinguishes real platform mechanics from lore from fiction ===== */
(function(){if(!document.querySelector('script[data-omega-canon-badge]')){var s=document.createElement('script');s.src='/omega-canon-badge.js';s.setAttribute('data-omega-canon-badge','1');if(document.body)document.body.appendChild(s);}})();

/* ===== SUBSCRIPTION TIER GATE -- companion to omega-gate.js (matrix gate) ===== */
(function(){if(!document.querySelector('script[data-omega-tier-gate]')){var s=document.createElement('script');s.src='/omega-tier-gate.js';s.setAttribute('data-omega-tier-gate','1');if(document.body)document.body.appendChild(s);}})();

/* ===== SIGN CODEX -- real cross-reference: sign -> element/god/gate/token/agent/house ===== */
(function(){if(!document.querySelector('script[data-omega-sign-codex]')){var s=document.createElement('script');s.src='/omega-sign-codex.js';s.setAttribute('data-omega-sign-codex','1');if(document.body)document.body.appendChild(s);}})();
/* ===== CANON LOADER -- single source of truth for the 12-fold + 9 elements ===== */
(function(){if(!document.querySelector('script[data-omega-canon]')){var s=document.createElement('script');s.src='/omega-canon.js';s.setAttribute('data-omega-canon','1');if(document.body)document.body.appendChild(s);}})();
/* ===== USER APPEARANCE -- member background/text/font ===== */
(function(){if(!document.querySelector('script[data-omega-appearance]')){var s=document.createElement('script');s.src='/omega-appearance.js';s.setAttribute('data-omega-appearance','1');if(document.body)document.body.appendChild(s);}})();
/* ===== FEEDBACK WIDGET -- members leave comments + ratings ===== */
(function(){if(!document.querySelector('script[data-omega-feedback]')){var s=document.createElement('script');s.src='/omega-feedback.js';s.setAttribute('data-omega-feedback','1');if(document.body)document.body.appendChild(s);}})();
/* ===== APP LAUNCHER -- all pages one tap (mobile + desktop) ===== */
(function(){if(!document.querySelector('script[data-omega-menu]')){var s=document.createElement('script');s.src='/omega-menu.js';s.setAttribute('data-omega-menu','1');if(document.body)document.body.appendChild(s);}})();
/* ===== MATRIX CONTENT GATE -- lock content by matrix position (5.1) ===== */
(function(){if(!document.querySelector('script[data-omega-gate]')){var s=document.createElement('script');s.src='/omega-gate.js';s.setAttribute('data-omega-gate','1');if(document.body)document.body.appendChild(s);}})();
/* ===== DE-EMOJI -- force all emoji-capable symbols to monochrome emblems ===== */
(function(){if(!document.querySelector('script[data-omega-deemoji]')){var s=document.createElement('script');s.src='/omega-deemoji.js';s.setAttribute('data-omega-deemoji','1');if(document.body)document.body.appendChild(s);}})();
/* ===== SHARE LAYER -- broadcast sovereign status to social (section 7) ===== */
(function(){if(!document.querySelector('script[data-omega-share]')){var s=document.createElement('script');s.src='/omega-share.js';s.setAttribute('data-omega-share','1');if(document.body)document.body.appendChild(s);}})();

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
     - Authority apex (9,9,9) = 15.588. Matrix = 104,976 nodes
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
  window.addEventListener('pointermove',function(e){tmx=e.clientX/W;tmy=e.clientY/H;},{passive:true});
  window.addEventListener('deviceorientation',function(e){
    if(e.gamma!=null){tmx=0.5+Math.max(-1,Math.min(1,e.gamma/45))*0.5;tmy=0.42+Math.max(-1,Math.min(1,(e.beta-45)/45))*0.3;}
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
  import('https://esm.sh/@supabase/supabase-js@2').then(function(m){
    var sb=m.createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q");
    sb.auth.getSession().then(function(res){
      var s=res.data.session;if(!s)return;
      sb.from('profiles').select('sign,terms_accepted,access_approved,is_owner,is_trial,trial_expires_at').eq('id',s.user.id).maybeSingle().then(function(pr){
        if(!pr.data)return;
        var d=pr.data;
        if(d.access_approved===false){location.replace('/pending.html');return;}
        if(d.sign&&!d.terms_accepted){location.replace('/terms.html');return;}
        if(d.is_trial&&!d.is_owner&&d.trial_expires_at){
          var expiresAt=new Date(d.trial_expires_at).getTime();
          var remaining=expiresAt-Date.now();
          if(remaining<=0){sb.rpc('expire_trial',{p_uid:s.user.id}).then(function(){location.replace('/pending.html?t=expired');});return;}
          injectTrialBanner(expiresAt,s.user.id,sb);
        }
        startTimeSovereignPing(sb);
      });
    });
  }).catch(function(){});
  function startTimeSovereignPing(sb){
    if(window.__omegaTSping)return; window.__omegaTSping=1;
    function ping(){ if(document.visibilityState==='visible'){ try{ sb.rpc('ping_session'); }catch(e){} } }
    ping();
    setInterval(ping,60000);
  }
  function injectTrialBanner(expiresAt,uid,sb){
    if(document.getElementById('omega-trial-bar'))return;
    var bar=document.createElement('div');bar.id='omega-trial-bar';
    bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:18px;padding:10px 20px;background:linear-gradient(90deg,rgba(139,0,0,0.95),rgba(80,0,0,0.97));border-top:1px solid rgba(201,168,76,0.4);font-family:"Courier Prime",monospace;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
    var icon=document.createElement('span');icon.textContent='\u26A0';icon.style.cssText='color:#E2C86D;font-size:16px';
    var label=document.createElement('span');label.style.cssText='color:#e9e6dc;font-size:11px;letter-spacing:3px;text-transform:uppercase';label.textContent='TRIAL SESSION';
    var timer=document.createElement('span');timer.id='omega-trial-timer';timer.style.cssText='color:#E2C86D;font-size:15px;font-weight:700;letter-spacing:4px;min-width:60px;text-align:center';
    var note=document.createElement('span');note.style.cssText='color:rgba(233,230,220,0.45);font-size:9px;letter-spacing:2px';note.textContent='SESSION ENDS \u00B7 ALL PROGRESS RESETS';
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
    function tick(){if(expired)return;var rem=expiresAt-Date.now();if(rem<=0){expired=true;timer.textContent='00:00';label.textContent='TRIAL EXPIRED';note.textContent='SESSION ENDED \u00B7 RESETTING PROGRESS...';sb.rpc('expire_trial',{p_uid:uid}).then(function(){setTimeout(function(){location.replace('/pending.html?t=expired');},2200);});return;}var m=Math.floor(rem/60000),sc=Math.floor((rem%60000)/1000);timer.textContent=(m<10?'0':'')+m+':'+(sc<10?'0':'')+sc;if(rem<60000)bar.style.boxShadow='0 -2px 24px rgba(139,0,0,0.6)';setTimeout(tick,500);}
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
    s.textContent='.tnav-btn{font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;color:var(--muted,#85837b);padding:5px 10px;border:1px solid rgba(201,168,76,.2);background:transparent;cursor:pointer;text-decoration:none;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.tnav-btn:hover{color:#C9A84C;border-color:rgba(201,168,76,.5)}.tnav-wrap{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}';
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
    'font-family:monospace;font-size:7px;font-weight:700;min-width:14px;height:14px;',
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
      var mod=await import('https://esm.sh/@supabase/supabase-js@2');
      var createClient=mod.createClient||mod.default&&mod.default.createClient;
      if(!createClient) return;
      var sb=createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q");
      var sess=(await sb.auth.getSession()).data.session;
      if(!sess) return;
      var uid=sess.user.id;
      var pr=(await sb.from('profiles').select('is_owner,access_approved,is_trial,trial_expires_at,axis_a').eq('id',uid).maybeSingle()).data;
      if(!pr||!pr.is_owner) return;
      window.__omegaIsOwner=true;
      document.body.classList.add('omega-owner');
      /* Enforce lifetime access */
      if(!pr.access_approved||pr.is_trial||pr.trial_expires_at||parseFloat(pr.axis_a)<9){
        await sb.from('profiles').update({access_approved:true,is_trial:false,trial_expires_at:null,axis_a:9.000,axis_b:9.000,axis_c:9.000,material_tier:'OMEGA MASTER',membership_tier:9}).eq('id',uid);
      }
      /* Check pending members and notify */
      var res=await sb.from('profiles').select('id',{count:'exact',head:true}).eq('access_approved',false).eq('is_owner',false);
      var pendingCount=res.count||0;
      if(pendingCount>0){
        var el=document.createElement('a');
        el.href='/approvals.html';
        el.className='omega-alert';
        var d1=document.createElement('div');d1.style.cssText='font-family:Courier Prime,monospace;font-size:8px;letter-spacing:3px;color:#8B0000;margin-bottom:5px';d1.textContent='NEW ACCESS REQUEST'+(pendingCount>1?'S':'');
        var d2=document.createElement('div');d2.style.cssText='font-family:Cinzel Decorative,serif;font-size:20px;color:#C9A84C;font-weight:700;margin-bottom:4px';d2.textContent=pendingCount+' MEMBER'+(pendingCount>1?'S':'')+' WAITING';
        var d3=document.createElement('div');d3.style.cssText='font-family:Courier Prime,monospace;font-size:8px;color:#85837b;letter-spacing:1px';d3.textContent='Tap to open Access Control Center';
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
      var mod=await import('https://esm.sh/@supabase/supabase-js@2');
      var createClient=mod.createClient||(mod.default&&mod.default.createClient);
      if(!createClient) return;
      var sb=createClient(
        "https://ydqhzvvoyufiiqvzcjns.supabase.co",
        "sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q"
      );
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
            +'<div style="font-size:10px;letter-spacing:3px;color:#85837b;max-width:320px;line-height:1.8">YOUR 9.1717-MINUTE SESSION HAS ENDED.<br/>CONTACT THE ARCHITECT TO REQUEST CONTINUED ACCESS.</div>'
            +'<a href="/account.html" style="font-family:Courier Prime,monospace;font-size:10px;letter-spacing:3px;padding:12px 28px;border:1px solid rgba(201,168,76,.4);color:#C9A84C;text-decoration:none;margin-top:10px">RETURN TO LOGIN</a>';
          document.body.appendChild(ov);
        },msLeft);
        /* Show a trial countdown badge (subtle) */
        var minsLeft=Math.ceil(msLeft/60000);
        if(minsLeft<=2&&!document.getElementById('trial-warn')){
          var warn=document.createElement('div');
          warn.id='trial-warn';
          warn.style.cssText='position:fixed;top:50px;left:50%;transform:translateX(-50%);z-index:9997;background:rgba(139,0,0,.9);padding:8px 18px;font-family:Courier Prime,monospace;font-size:9px;letter-spacing:2px;color:#fff;animation:badge-pulse 1.5s ease-in-out infinite;white-space:nowrap';
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
  function rgbOf(c){var m=c&&c.match(/(\d+),\s*(\d+),\s*(\d+)/);return m?m[1]+','+m[2]+','+m[3]:'201,168,76';}

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
  var st=document.createElement('style');
  st.textContent=[
    '#omega-toasts{position:fixed;right:18px;bottom:80px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none}',
    '.omega-toast{font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#0A0A0F;background:linear-gradient(90deg,#C9A84C,#E2C86D);padding:12px 18px;box-shadow:0 12px 34px -10px rgba(201,168,76,.55);transform:translateX(130%);transition:transform .5s cubic-bezier(.2,.8,.2,1);max-width:320px;border-left:3px solid #fff7d6}',
    '.omega-toast.in{transform:none}',
    '.omega-toast.cyan{background:linear-gradient(90deg,#00E5FF,#7fe9ff)}',
    '.omega-toast.crim{background:linear-gradient(90deg,#8B0000,#c0392b);color:#fff;border-left-color:#ffb3b3}',
    '#omega-veil{position:fixed;inset:0;z-index:99998;background:#0A0A0F;pointer-events:none;opacity:0;transition:opacity .4s ease}',
    '#omega-veil.show{opacity:1}',
    '#omega-genesis{position:fixed;inset:0;z-index:100000;background:radial-gradient(circle at 50% 45%,#0c0c16,#05050a 70%);display:flex;align-items:center;justify-content:center;flex-direction:column;cursor:pointer;transition:opacity .8s ease}',
    '#omega-genesis .gx{font-family:"Cinzel Decorative",Georgia,serif;font-size:128px;color:#C9A84C;text-shadow:0 0 70px rgba(201,168,76,.65);opacity:0;animation:gx-ig 2.3s cubic-bezier(.2,.8,.2,1) forwards}',
    '#omega-genesis .gr{position:absolute;border:1px solid rgba(201,168,76,.25);border-radius:50%;width:260px;height:260px;opacity:0;animation:gr-ex 2.6s ease forwards}',
    '#omega-genesis .gr2{width:380px;height:380px;animation-delay:.2s}',
    '#omega-genesis .gt{font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:6px;color:#85837b;margin-top:30px;opacity:0;animation:gt-fd 1s ease 1.3s forwards}',
    '@keyframes gx-ig{0%{opacity:0;transform:scale(.55) rotate(-10deg)}55%{opacity:1;transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}',
    '@keyframes gr-ex{0%{opacity:0;transform:scale(.3)}40%{opacity:.6}100%{opacity:0;transform:scale(1.25)}}',
    '@keyframes gt-fd{to{opacity:1}}'
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

  /* ---- PAGE TRANSITIONS ---- */
  var veil=document.createElement('div');veil.id='omega-veil';
  (function add(){if(document.body){document.body.appendChild(veil);}else requestAnimationFrame(add);})();
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
        if(el.offsetHeight<8)el.style.minHeight='40px';
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
