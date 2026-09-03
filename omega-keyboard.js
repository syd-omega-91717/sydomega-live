/* ==========================================================================
   Ω SYD OMEGA 91717 — KEYBOARD SHORTCUT ENGINE (omega-keyboard.js)

   Platform-wide keyboard navigation inspired by GitHub, VS Code, and Figma.
   Registers a sovereign shortcut registry and shows a help overlay on `?`.

   SHORTCUTS
   g d  → Dashboard         g e  → Evolution         g l  → Leaderboard
   g a  → Analytics         g m  → Matrix             g p  → Profile
   g s  → Settings          g v  → Vault              g k  → Knowledge
   g x  → Exam              g q  → Gaming             g t  → Gates
   Ctrl+K → Search          ?    → This overlay        n   → Notifications
   c    → Copilot           Esc  → Close overlay/panel

   All shortcuts are disabled when focus is inside an input, textarea, or
   contenteditable element so typing is never intercepted.
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaKeyboardActive) return;
  window.__omegaKeyboardActive = true;

  /* ── SHORTCUT REGISTRY ──────────────────────────────────────────── */
  var _registry = [];
  var _gSeq = null;            /* pending 'g' sequence */
  var _gTimer = null;          /* clear pending after 1.5s */

  /* Register a shortcut: { key, ctrl, shift, meta, alt, description, action } */
  function register(opts){
    _registry.push(opts);
    return function(){ _registry=_registry.filter(function(r){return r!==opts;}); };
  }

  /* ── BUILT-IN SHORTCUTS ─────────────────────────────────────────── */
  /* g-sequence navigation */
  var G_NAV = {
    d:'/dashboard.html',  e:'/evolution.html',  l:'/leaderboard.html',
    a:'/analytics.html',  m:'/matrix.html',     p:'/profile.html',
    s:'/settings.html',   v:'/vault.html',       k:'/knowledge.html',
    x:'/exam.html',       q:'/gaming.html',      t:'/gates.html',
    i:'/intelligence.html', o:'/studio.html',    r:'/publishing.html',
  };
  var G_LABEL = {
    d:'Dashboard', e:'Evolution', l:'Leaderboard', a:'Analytics',
    m:'Matrix', p:'Profile', s:'Settings', v:'Vault',
    k:'Knowledge Graph', x:'Exam', q:'Gaming', t:'Gates',
    i:'Intelligence', o:'Studio', r:'Publishing',
  };
  var SHORTCUT_HELP = [
    {group:'Navigation — press g then', shortcuts:[
      {keys:['g','d'],desc:'Dashboard'},  {keys:['g','e'],desc:'Evolution'},
      {keys:['g','l'],desc:'Leaderboard'},{keys:['g','a'],desc:'Analytics'},
      {keys:['g','m'],desc:'Matrix'},     {keys:['g','p'],desc:'Profile'},
      {keys:['g','s'],desc:'Settings'},   {keys:['g','v'],desc:'Vault'},
      {keys:['g','k'],desc:'Knowledge'},  {keys:['g','x'],desc:'Exam'},
      {keys:['g','q'],desc:'Gaming'},     {keys:['g','t'],desc:'Gates'},
      {keys:['g','o'],desc:'Studio'},     {keys:['g','r'],desc:'Publishing'},
    ]},
    {group:'Actions',shortcuts:[
      {keys:['Ctrl','K'],desc:'Open search'},
      {keys:['n'],       desc:'Toggle notifications'},
      {keys:['c'],       desc:'Open AI copilot'},
      {keys:['?'],       desc:'Show this help overlay'},
      {keys:['Esc'],     desc:'Close panel/overlay'},
    ]},
  ];

  /* ── HELP OVERLAY ───────────────────────────────────────────────── */
  var _helpOpen = false;
  function showHelp(){
    if(_helpOpen) return;
    _helpOpen = true;
    var ov = document.createElement('div');
    ov.id = 'omega-kb-overlay';
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');
    ov.setAttribute('aria-label','Keyboard shortcuts');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9995;background:rgba(2,2,6,.94);'
      +'display:flex;align-items:center;justify-content:center;padding:20px;'
      +'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)';
    var box = document.createElement('div');
    box.style.cssText = 'width:min(600px,90vw);background:#0A0A0F;'
      +'border:1px solid rgba(201,168,76,.3);border-radius:4px;overflow:hidden;'
      +'box-shadow:0 24px 80px rgba(0,0,0,.6);max-height:85vh;overflow-y:auto';
    var head = '<div style="padding:16px 20px;border-bottom:1px solid rgba(201,168,76,.12);'
      +'display:flex;align-items:center;justify-content:space-between">'
      +'<span style="font-family:\'Cinzel Decorative\',serif;font-size:13px;color:#C9A84C">'
      +'&#937; KEYBOARD SHORTCUTS</span>'
      +'<button id="omega-kb-close" style="font-family:\'Courier Prime\',monospace;font-size:12px;'
      +'color:rgba(138,134,118,.5);background:none;border:none;cursor:pointer;letter-spacing:1px"'
      +' aria-label="Close keyboard shortcuts">'
      +'ESC × CLOSE</button></div>';
    var body = '<div style="padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:24px">'
      +SHORTCUT_HELP.map(function(grp){
        return '<div><div style="font-family:\'Courier Prime\',monospace;font-size:12px;'
          +'letter-spacing:2px;color:rgba(201,168,76,.5);margin-bottom:12px">'
          +grp.group.toUpperCase()+'</div>'
          +grp.shortcuts.map(function(sc){
            var keys=sc.keys.map(function(k){
              return '<kbd style="font-family:\'Courier Prime\',monospace;font-size:12px;'
                +'background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);'
                +'border-radius:2px;padding:2px 7px;color:#E2C86D;letter-spacing:1px">'
                +k+'</kbd>';
            }).join('<span style="color:rgba(138,134,118,.4);margin:0 3px;font-size:12px"> then </span>');
            return '<div style="display:flex;align-items:center;justify-content:space-between;'
              +'padding:6px 0;border-bottom:1px solid rgba(201,168,76,.05)">'
              +'<span style="font-family:\'Courier Prime\',monospace;font-size:12px;'
              +'letter-spacing:1px;color:rgba(233,230,220,.6)">'
              +sc.desc+'</span><div>'+keys+'</div></div>';
          }).join('')+'</div>';
      }).join('')+'</div>'
      +'<div style="padding:12px 20px;border-top:1px solid rgba(201,168,76,.08);'
      +'font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:1.5px;'
      +'color:rgba(138,134,118,.4);text-align:center">'
      +'SHORTCUTS DISABLED WHILE TYPING IN FIELDS · PRESS ESC TO CLOSE</div>';
    box.innerHTML = head+body;
    ov.appendChild(box);
    document.body.appendChild(ov);

    function close(){ _helpOpen=false; ov.remove(); }
    document.getElementById('omega-kb-close').addEventListener('click',close);
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
    /* ESC closes via main handler — no duplicate listener needed */
    ov._close=close;
  }

  function hideHelp(){
    var ov=document.getElementById('omega-kb-overlay');
    if(ov&&ov._close){ ov._close(); } else if(ov){ ov.remove(); _helpOpen=false; }
  }

  /* ── INPUT GUARD ────────────────────────────────────────────────── */
  function isTyping(e){
    var t=e.target||{};
    if(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT') return true;
    if(t.isContentEditable||t.getAttribute('contenteditable')==='true') return true;
    return false;
  }

  /* ── MAIN HANDLER ───────────────────────────────────────────────── */
  document.addEventListener('keydown',function(e){
    var k=e.key;

    /* Esc: close any open overlay/panel */
    if(k==='Escape'){
      if(_helpOpen){ hideHelp(); e.preventDefault(); return; }
      /* Delegate to other overlays */
      if(window.OmegaSearch&&typeof window.OmegaSearch.close==='function'){
        window.OmegaSearch.close();
      }
      return;
    }

    /* Ctrl+K: search (registered here, fired by OmegaSearch too) */
    if((e.ctrlKey||e.metaKey)&&k==='k'){
      if(window.OmegaSearch) window.OmegaSearch.open();
      e.preventDefault();
      return;
    }

    /* Skip everything below when typing */
    if(isTyping(e)) return;

    /* ? : show help */
    if(k==='?' && !e.ctrlKey && !e.metaKey){
      if(_helpOpen) hideHelp(); else showHelp();
      e.preventDefault();
      return;
    }

    /* g-sequence: press g, then a letter within 1.5s */
    if(k==='g' && !e.ctrlKey && !e.metaKey && !e.altKey){
      clearTimeout(_gTimer);
      _gSeq='g';
      _gTimer=setTimeout(function(){_gSeq=null;},1500);
      e.preventDefault();
      return;
    }
    if(_gSeq==='g'){
      clearTimeout(_gTimer);
      _gSeq=null;
      var dest=G_NAV[k.toLowerCase()];
      if(dest){
        /* Don't navigate if already on this page */
        if(location.pathname!==dest) location.href=dest;
        e.preventDefault();
      }
      return;
    }

    /* Single-key shortcuts */
    if(k==='n' && !e.ctrlKey && !e.metaKey){
      if(window.OmegaNotify&&typeof window.OmegaNotify.togglePanel==='function'){
        window.OmegaNotify.togglePanel();
        e.preventDefault();
      }
      return;
    }
    if(k==='c' && !e.ctrlKey && !e.metaKey){
      if(window.OmegaCopilot&&typeof window.OmegaCopilot.open==='function'){
        window.OmegaCopilot.open();
        e.preventDefault();
      }
      return;
    }
  });

  /* ── VISUAL FEEDBACK: page-top shortcut hint (first-time users) ── */
  (function showFirstTimeHint(){
    /* A touch device has no `?` key to press, so the hint there is an
       instruction the member cannot follow -- and it lands in the middle of
       the bottom chrome stack (nav bar, controls dock, copilot button) that
       a phone is already short of room for. `(hover:hover) and
       (pointer:fine)` is the media query for "there is a real pointer", which
       on every current browser tracks having a real keyboard too; a desktop
       browser in responsive-preview mode correctly reports coarse, so the
       hint is suppressed exactly where the shortcut does not exist.
       The shortcuts themselves stay bound -- an attached keyboard still
       works; only the unusable prompt is withheld. */
    try{
      if(window.matchMedia && !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    }catch(e){ /* no matchMedia -- fall through and show it */ }
    try{
      if(sessionStorage.getItem('omega_kb_hint_shown')) return;
      sessionStorage.setItem('omega_kb_hint_shown','1');
    }catch(e){ return; } /* privacy mode — skip hint */
    setTimeout(function(){
      var hint=document.createElement('div');
      hint.id='omega-kbd-hint';
      hint.setAttribute('role','status');
      /* bottom:80px lands on the controls dock, which sits at bottom:74px on a
         phone to clear nav.js's 66px bar. The id + !important rule is needed
         because `bottom` IS declared inline here, so a plain rule cannot win. */
      if(!document.getElementById('omega-kbd-hint-css')){
        var ks=document.createElement('style');
        ks.id='omega-kbd-hint-css';
        ks.textContent='@media(max-width:760px){#omega-kbd-hint{bottom:215px!important}}';
        (document.head||document.documentElement).appendChild(ks);
      }
      hint.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(12px);'
        +'z-index:9000;background:rgba(10,10,15,.92);border:1px solid rgba(201,168,76,.2);'
        +'border-radius:3px;padding:8px 16px;font-family:"Courier Prime",monospace;font-size:12px;'
        +'letter-spacing:2px;color:rgba(201,168,76,.7);white-space:nowrap;'
        +'opacity:0;transition:opacity .3s,transform .3s;pointer-events:none';
      hint.innerHTML='PRESS <kbd style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);'
        +'border-radius:2px;padding:1px 5px;color:#E2C86D">?</kbd> FOR KEYBOARD SHORTCUTS';
      document.body.appendChild(hint);
      requestAnimationFrame(function(){
        hint.style.opacity='1';hint.style.transform='translateX(-50%) translateY(0)';
      });
      setTimeout(function(){
        hint.style.opacity='0';hint.style.transform='translateX(-50%) translateY(12px)';
        setTimeout(function(){if(hint.parentNode)hint.parentNode.removeChild(hint);},400);
      },3500);
    },2500);
  })();

  /* ── PUBLIC API ─────────────────────────────────────────────────── */
  window.OmegaKeyboard = {
    register: register,
    showHelp: showHelp,
    hideHelp: hideHelp,
    SHORTCUTS: SHORTCUT_HELP,
    G_NAV: G_NAV,
    G_LABEL: G_LABEL,
  };
})();
