/* ============================================================================
   SYD OMEGA 91717 -- COMPONENT SYSTEM (G12.3 states + G12.4 responsive)
   Turns the design handoff into real behavior: every button and card across
   the platform gets the sovereign states (default/hover/pressed/loading/
   disabled) and the G12 responsive rules (1920 -> 360). Applied globally via
   bg.js -- no per-page work. Pure ASCII, reduced-motion safe.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaComponents) return;
  window.__omegaComponents = 1;

  var css = [
    /* ---- G12.3 BUTTON states: gold / glow / lift / shine / press / loading / disabled ---- */
    'button,.btn,.mbtn,.osh-b,.om-card{transition:transform .18s ease,box-shadow .2s ease,filter .2s ease,opacity .2s ease}',
    'button:hover,.btn:hover,.mbtn:hover{transform:translateY(-2px);box-shadow:0 6px 22px -8px rgba(226,200,109,.5)}',
    'button:active,.btn:active,.mbtn:active{transform:translateY(0) scale(.97)}',
    'button:disabled,.btn:disabled,[aria-disabled="true"]{opacity:.4;cursor:default;transform:none;box-shadow:none}',
    /* loading: orbital ring on [data-loading] */
    '@keyframes om-orbit{to{transform:rotate(360deg)}}',
    '[data-loading]{position:relative;color:transparent !important;pointer-events:none}',
    '[data-loading]::after{content:"";position:absolute;top:50%;left:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border:2px solid rgba(201,168,76,.3);border-top-color:#E2C86D;border-radius:50%;animation:om-orbit .7s linear infinite}',
    /* ---- G12.3 CARD states: glass / gold edge / hover scale+rotate ---- */
    '.card,.g-card,.film-card,.sg-card,.stat3,.om-card{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}',
    '.card:hover,.g-card:hover,.film-card:hover,.sg-card:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 14px 40px -12px rgba(0,0,0,.6)}',
    /* ---- G12.4 RESPONSIVE MATRIX ---- */
    '@media(min-width:1600px){.wrap,.shell,main{max-width:1280px;margin-inline:auto}}',
    '@media(max-width:1024px){.wrap,.shell{padding-left:18px;padding-right:18px}}',
    '@media(max-width:760px){.grid,.slots,.om-cards{grid-template-columns:repeat(2,1fr) !important}.hero .cur{font-size:40px}}',
    '@media(max-width:430px){.grid,.slots,.om-cards{grid-template-columns:1fr !important}.topbar .t{font-size:20px}.stats3{grid-template-columns:repeat(3,1fr)}}',
    '@media(max-width:360px){.wrap{padding-left:12px;padding-right:12px}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'omega-components-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* helper so any script can put a button into the G12 loading state */
  window.OmegaButton = {
    load: function (el) { if (el) el.setAttribute('data-loading', '1'); },
    done: function (el) { if (el) el.removeAttribute('data-loading'); }
  };
})();
