/* SYD OMEGA 91717 -- Sovereign Theme Engine v1.0
   Injected globally. Makes every page interactive, alive, and sovereign.
   No external dependencies. Pure DOM + CSS injection. */
(function(){
  if(window.__omegaTheme) return; window.__omegaTheme=true;

  /* --- REFINED COLOR PALETTE: Sovereign Dusk
     Shifts void from pure black to deep midnight blue-black.
     Warmer panels, better contrast, more comfortable for long sessions.
     Keeps the cinematic gold/cyan identity fully intact. */
  var DUSK_CSS=`
    :root {
      --void:#08080F;
      --abyss:#0A0A16;
      --panel:#0E0E1C;
      --p2:#131328;
      --panel-warm:#120F1A;
      --gold:#C9A84C;
      --solar:#E2C86D;
      --cyan:#00E5FF;
      /* Was #8B0000. theme.js is injected after bg.js and wins the tie, so
         this line silently reinstated the value bg.js had deliberately
         re-stepped away from: measured against this file's own --void
         (#08080F) the old red is 1.99:1, under the 3:1 floor for any
         content, and it was painting real text on every page. #C4453C is
         4.05:1. Every other token in this palette clears 4.5:1. */
      --crim:#C4453C;
      --green:#3fb27f;
      --ink:#F0EDE6;
      --ink-dim:#D8D5CE;
      --muted:#8A8880;
      --line:rgba(201,168,76,0.13);
      --line-bright:rgba(201,168,76,0.25);
      --glow-gold:rgba(201,168,76,0.18);
      --glow-cyan:rgba(0,229,255,0.12);
    }
    body { background:var(--void); color:var(--ink); }
    /* body::before is the ambient field, and omega-visual-evolution.css owns
       it -- that file supplies the pseudo's content/position/z-index, this
       one only ever supplied a background, i.e. a strict subset of the same
       field. Two rules on one pseudo-element merge per property, so the
       background declared here silently replaced the field's while keeping
       its geometry. Removed so there is one owner, not two divergent copies. */
  `;

  /* --- MICRO-INTERACTION STYLES --- */
  var INTERACT_CSS=`
    /* Universal card hover lift */
    .ov-card,.stat,.kpi,.trophy-card,.ag-card,.district-card,.lab-card,
    .pred-card,.tier-card,.pillar-icon,.event-card,.arch-card,.method-card,
    .game-mini,.nft-mini,.film-tile,.game-tile,.shield-card,.node-card,
    .franchise-card,.series-card,.exp-card,.root-cell,.ch-entry {
      transition:transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    }
    .ov-card:hover,.stat:hover,.kpi:hover,.trophy-card:hover,.ag-card:hover,
    .district-card:hover,.lab-card:hover,.pred-card:hover,.arch-card:hover,
    .method-card:hover,.event-card:hover {
      transform:translateY(-3px);
      box-shadow:0 12px 32px rgba(201,168,76,0.1);
      border-color:rgba(201,168,76,0.3);
    }
    /* Button press ripple */
    .btn-connect,.btn-save,.btn-submit,.btn-log,.btn-predict,.btn-broadcast,
    .btn-add,.btn-create,.ai-send,.btn-next,.btn-start,.btn-travel,
    .mc-btn,.mb-join { position:relative; overflow:hidden; }
    /* Pulsing authority displays */
    .ident-level,.coord-display,.port-total {
      animation:omega-breathe 4s ease-in-out infinite;
    }
    @keyframes omega-breathe {
      0%,100%{text-shadow:0 0 10px rgba(201,168,76,0.3)}
      50%{text-shadow:0 0 22px rgba(201,168,76,0.6),0 0 40px rgba(201,168,76,0.2)}
    }
    /* Section headers slide in */
    .sechead { transition:opacity 0.5s ease, transform 0.5s ease; }
    /* Active nav item glow */
    .nav a.on {
      text-shadow:0 0 12px rgba(201,168,76,0.4);
    }
    /* Card scan line shimmer */
    @keyframes shimmer {
      0%{background-position:-200% 0}
      100%{background-position:200% 0}
    }
    .shimmer-card {
      background:linear-gradient(90deg,transparent 0%,rgba(201,168,76,0.05) 50%,transparent 100%);
      background-size:200% 100%;
      animation:shimmer 3s infinite;
    }
    /* Rotating omega in selected elements */
    @keyframes omega-spin {
      from{transform:rotate(0deg)} to{transform:rotate(360deg)}
    }
    /* Stat counter pulse */
    @keyframes count-pulse {
      0%,100%{opacity:1} 50%{opacity:0.7}
    }
    /* Side panel border glow */
    .side { box-shadow:inset -1px 0 0 rgba(201,168,76,0.1); }
    /* Topbar */
    .topbar { transition:border-color 0.3s; }
    /* Global link hover */
    a[href]:not(.on):not(.nav-home):not(.nav-back) {
      transition:color 0.15s ease, opacity 0.15s ease;
    }
    /* Scroll reveal done state */
    .omega-visible { opacity:1!important; transform:translateY(0)!important; }
    /* Status dots pulse */
    .ac-dot, .ai-agent-chip .aac-orb { animation:omega-dot-pulse 2s ease-in-out infinite; }
    @keyframes omega-dot-pulse {
      0%,100%{box-shadow:0 0 6px currentColor}
      50%{box-shadow:0 0 14px currentColor,0 0 28px currentColor}
    }
    /* Mobile bottom nav icons */
    .mn-icon { transition:transform 0.15s ease; }
    .omega-mobile-nav ul li a:hover .mn-icon { transform:translateY(-2px) scale(1.1); }
    .omega-mobile-nav ul li a.on .mn-icon { transform:scale(1.15); }
    /* Pillar icons */
    .pillar-icon { transition:background 0.18s, transform 0.18s; }
    .pillar-icon:hover { transform:translateY(-2px); }
    /* Input focus glow */
    input:focus,select:focus,textarea:focus {
      box-shadow:0 0 0 1px rgba(201,168,76,0.3),0 0 12px rgba(201,168,76,0.08);
    }
    /* Scrollbar styling */
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:rgba(7,7,11,0.5); }
    ::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.3); border-radius:2px; }
    ::-webkit-scrollbar-thumb:hover { background:rgba(201,168,76,0.5); }
    /* Selection color */
    ::selection { background:rgba(201,168,76,0.25); color:var(--solar); }
    /* Keyboard focus visible */
    :focus-visible { outline:1px solid rgba(201,168,76,0.5); outline-offset:2px; }
  `;

  function injectStyles(){
    if(document.getElementById('omega-theme-css')) return;
    var s=document.createElement('style'); s.id='omega-theme-css';
    s.textContent=DUSK_CSS+INTERACT_CSS;
    document.head.appendChild(s);
  }

  /* --- SCROLL REVEAL: sections fade up as user scrolls --- */
  function initScrollReveal(){
    if(window.IntersectionObserver){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){
            e.target.classList.add('omega-visible');
            io.unobserve(e.target);
          }
        });
      },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
      document.querySelectorAll('.sechead').forEach(function(el){
        el.style.opacity='0';
        el.style.transform='translateY(12px)';
        io.observe(el);
      });
    }
  }

  /* --- RIPPLE EFFECT on button clicks --- */
  function initRipple(){
    document.addEventListener('click',function(e){
      var btn=e.target.closest('button,a.solid,[class*="btn-"]');
      if(!btn) return;
      var r=btn.getBoundingClientRect();
      var x=e.clientX-r.left, y=e.clientY-r.top;
      var ripple=document.createElement('span');
      ripple.style.cssText='position:absolute;border-radius:50%;background:rgba(201,168,76,0.25);width:1px;height:1px;left:'+x+'px;top:'+y+'px;transform:scale(0);animation:ripple-out 0.5s ease-out forwards;pointer-events:none;z-index:999';
      var style=document.createElement('style');
      if(!document.getElementById('ripple-css')){
        style.id='ripple-css';
        style.textContent='@keyframes ripple-out{0%{transform:scale(0);opacity:0.8}100%{transform:scale(200);opacity:0}}';
        document.head.appendChild(style);
      }
      if(getComputedStyle(btn).position==='static') btn.style.position='relative';
      btn.appendChild(ripple);
      setTimeout(function(){ ripple.parentNode&&ripple.parentNode.removeChild(ripple); },600);
    });
  }

  /* --- ANIMATED COUNTERS: numbers count up on page load --- */
  function animateCounters(){
    document.querySelectorAll('[data-count]').forEach(function(el){
      var target=parseFloat(el.getAttribute('data-count'));
      if(isNaN(target)) return;
      var start=0, duration=1200, startTime=null;
      function step(ts){
        if(!startTime) startTime=ts;
        var progress=Math.min((ts-startTime)/duration,1);
        var eased=1-Math.pow(1-progress,3);
        var cur=start+(target-start)*eased;
        el.textContent=Number.isInteger(target)?Math.round(cur):cur.toFixed(2);
        if(progress<1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* --- CURSOR GOLD TRAIL (desktop only) --- */
  function initCursorTrail(){
    if(window.innerWidth<760) return;
    var trail=[];
    var NUM=6;
    for(var i=0;i<NUM;i++){
      var dot=document.createElement('div');
      dot.style.cssText='position:fixed;width:'+(6-i)+'px;height:'+(6-i)+'px;border-radius:50%;background:rgba(201,168,76,'+(0.3-i*0.04)+');pointer-events:none;z-index:99999;transition:transform 0.1s;will-change:transform';
      document.body.appendChild(dot);
      trail.push({el:dot,x:0,y:0});
    }
    var mx=0,my=0;
    document.addEventListener('mousemove',function(e){ mx=e.clientX; my=e.clientY; });
    var t=0;
    function frame(){
      t++;
      trail.forEach(function(d,i){
        var delay=i*0.14;
        d.x+=(mx-d.x)*(0.35-i*0.04);
        d.y+=(my-d.y)*(0.35-i*0.04);
        d.el.style.transform='translate('+(d.x-3)+'px,'+(d.y-3)+'px)';
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  /* --- LIVE CLOCK in page header (if element exists) --- */
  function initLiveClock(){
    var el=document.getElementById('omega-clock');
    if(!el) return;
    function tick(){
      var n=new Date();
      var h=n.getHours().toString().padStart(2,'0');
      var m=n.getMinutes().toString().padStart(2,'0');
      var s=n.getSeconds().toString().padStart(2,'0');
      el.textContent=h+':'+m+':'+s+' UTC';
    }
    tick(); setInterval(tick,1000);
  }

  /* --- SOVEREIGN STATUS BAR: subtle top bar showing platform pulse --- */
  function injectStatusBar(){
    if(document.getElementById('omega-status-bar')) return;
    var el=document.getElementById('omega-side');
    if(!el) return; /* only on app pages */
    var bar=document.createElement('div'); bar.id='omega-status-bar';
    bar.style.cssText='position:fixed;top:0;left:0;right:0;height:2px;z-index:10000;background:linear-gradient(90deg,transparent,#C9A84C,#00E5FF,#C9A84C,transparent);background-size:200% 100%;animation:status-scan 4s linear infinite;pointer-events:none';
    var ss=document.createElement('style'); ss.textContent='@keyframes status-scan{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(ss);
    document.body.appendChild(bar);
  }

  /* Boot sequence */
  function boot(){
    injectStyles();
    setTimeout(function(){
      initScrollReveal();
      initRipple();
      animateCounters();
      initCursorTrail();
      initLiveClock();
      injectStatusBar();
    },100);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
