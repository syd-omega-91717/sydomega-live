/* ==========================================================================
   Ω SYD OMEGA 91717 — CINEMATIC ANIMATION ENGINE (omega-animate.js)
   
   Directive: "Every animation must communicate state, guide attention,
   reinforce hierarchy, or improve usability. Never decoration."
   
   Inspired by:
   - Apple: spring physics, purposeful motion, reduce-motion respect
   - After Effects: choreographed entrance sequences
   - Framer Motion: declarative spring-based animations
   - GSAP: GPU-accelerated timeline control
   
   Capabilities:
   A. PAGE ENTRANCE   — Cinematic staggered card reveals on load
   B. SCROLL-REVEAL   — Elements animate into view on scroll
   C. MICRO-INTERACT  — Button pulse, hover lift, focus ring
   D. STATE MORPH     — Smooth transitions between loading/loaded/error
   E. PARTICLE FIELD  — Lightweight canvas particle backdrop
   F. NUMBER MORPH    — Count-up animation for KPI values
   G. REDUCE MOTION   — Full respect for prefers-reduced-motion
   ========================================================================== */
(function(){
  if(window.__omegaAnimateActive) return;
  window.__omegaAnimateActive = true;

  var REDUCED = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ── A. PAGE ENTRANCE — staggered card reveal ──────────────────── */
  function injectEntranceCSS(){
    if(document.getElementById('omega-animate-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-animate-css';
    s.textContent = `
      @keyframes oa-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
      @keyframes oa-fade-in{from{opacity:0}to{opacity:1}}
      @keyframes oa-scale-in{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
      @keyframes oa-slide-right{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
      @keyframes oa-count{from{opacity:.2}to{opacity:1}}
      @keyframes oa-gold-pulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}50%{box-shadow:0 0 0 6px rgba(201,168,76,.15)}}
      @keyframes oa-spin{to{transform:rotate(360deg)}}
      .oa-reveal{opacity:0}.oa-revealed{opacity:1}
      .oa-lift{transition:transform .18s cubic-bezier(.4,0,.2,1),box-shadow .18s}
      .oa-lift:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.35)}
      .oa-btn-pulse:active{animation:oa-gold-pulse .35s ease}
      .oa-spin{animation:oa-spin 1.2s linear infinite}
      .kpi-animated{animation:oa-fade-up .5s cubic-bezier(.4,0,.2,1) both}
      .card-animated{animation:oa-fade-up .5s cubic-bezier(.4,0,.2,1) both}
    `;
    document.head.appendChild(s);
  }

  /* ── B. SCROLL REVEAL ─────────────────────────────────────────── */
  var _observed = new Set();
  function setupScrollReveal(){
    if(REDUCED) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting && !_observed.has(e.target)){
          _observed.add(e.target);
          var delay = e.target.dataset.delay||'0';
          e.target.style.animation = 'oa-fade-up .5s cubic-bezier(.4,0,.2,1) '+delay+'ms both';
          e.target.classList.add('oa-revealed');
          io.unobserve(e.target);
        }
      });
    },{threshold:0.08,rootMargin:'0px 0px -30px 0px'});

    /* Observe cards, kpis, secheads */
    var delay = 0;
    document.querySelectorAll('.kpi,.card,.sechead,.agent-card,.slo-card,.tier-card,.policy-card,.risk-card').forEach(function(el){
      if(!REDUCED){
        el.style.opacity = '0';
        el.classList.add('oa-reveal');
        el.dataset.delay = delay;
        delay = Math.min(delay+60, 400);
        io.observe(el);
      }
    });
  }

  /* ── C. MICRO-INTERACTIONS ────────────────────────────────────── */
  function setupMicroInteractions(){
    if(REDUCED) return;
    /* Lift on hover for cards */
    document.querySelectorAll('.card,.agent-card,.tier-card,.kpi,.slo-card,.policy-card').forEach(function(el){
      el.classList.add('oa-lift');
    });
    /* Button pulse on click */
    document.querySelectorAll('button.btn-gold,button.action-btn,button.chat-send,button.tab-btn').forEach(function(el){
      el.classList.add('oa-btn-pulse');
    });
    /* Focus ring enhancement */
    document.addEventListener('keydown',function(e){
      if(e.key==='Tab') document.body.classList.add('keyboard-nav');
    });
    document.addEventListener('mousedown',function(){
      document.body.classList.remove('keyboard-nav');
    });
  }

  /* ── D. NUMBER MORPH (KPI count-up) ──────────────────────────── */
  window.OmegaCountUp = function(el, target, opts){
    if(REDUCED || !el){ if(el) el.textContent = target; return; }
    opts = opts||{};
    var dur = opts.duration||1200;
    var decimals = opts.decimals||(String(target).includes('.')?String(target).split('.')[1].length:0);
    var start = opts.from||0;
    var startTime = null;
    var suffix = opts.suffix||'';
    var prefix = opts.prefix||'';
    function step(ts){
      if(!startTime) startTime=ts;
      var progress = Math.min((ts-startTime)/dur,1);
      var ease = 1-Math.pow(1-progress,3); /* ease-out cubic */
      var current = start + (target-start)*ease;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if(progress<1) requestAnimationFrame(step);
      else el.textContent = prefix+target.toFixed(decimals)+suffix;
    }
    requestAnimationFrame(step);
  };

  /* ── E. AMBIENT PARTICLE BACKDROP ────────────────────────────── */
  window.OmegaParticles = function(canvas, opts){
    if(!canvas||REDUCED) return;
    opts = opts||{};
    var ctx = canvas.getContext('2d');
    var W=0,H=0,pts=[];
    var N = opts.count||40;
    var COL = opts.color||'201,168,76';
    var MAX_DIST = opts.maxDist||120;
    function resize(){
      W=canvas.width=canvas.offsetWidth||canvas.parentElement.offsetWidth||800;
      H=canvas.height=canvas.offsetHeight||canvas.parentElement.offsetHeight||400;
    }
    function mkPt(){return{x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.5+.5};}
    function draw(){
      ctx.clearRect(0,0,W,H);
      pts.forEach(function(p){
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='rgba('+COL+',.5)';ctx.fill();
        for(var i=pts.indexOf(p)+1;i<pts.length;i++){
          var dx=p.x-pts[i].x,dy=p.y-pts[i].y;
          var d=Math.sqrt(dx*dx+dy*dy);
          if(d<MAX_DIST){
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[i].x,pts[i].y);
            ctx.strokeStyle='rgba('+COL+','+(1-d/MAX_DIST)*.08+')';
            ctx.lineWidth=.5;ctx.stroke();
          }
        }
      });
      requestAnimationFrame(draw);
    }
    window.addEventListener('resize',function(){resize();pts=[];for(var i=0;i<N;i++)pts.push(mkPt());});
    resize();for(var i=0;i<N;i++)pts.push(mkPt());draw();
  };

  /* ── F. LOADING CHOREOGRAPHY ──────────────────────────────────── */
  window.OmegaLoading = {
    show: function(el, msg){
      if(!el) return;
      el.dataset.origHtml = el.innerHTML;
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:20px;opacity:.7">'
        +'<div class="oa-spin" style="width:16px;height:16px;border:2px solid rgba(201,168,76,.2);border-top-color:var(--gold,#C9A84C);border-radius:50%"></div>'
        +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:8px;letter-spacing:2px;color:var(--muted,#8a8676)">'+(msg||'LOADING')+'&hellip;</span>'
        +'</div>';
    },
    hide: function(el){
      if(!el) return;
      if(REDUCED){ el.style.opacity='1'; return; }
      el.style.animation='oa-fade-in .3s ease both';
    },
    error: function(el, msg){
      if(!el) return;
      el.innerHTML = '<div style="padding:16px;text-align:center;border:1px solid rgba(139,0,0,.3);border-radius:2px;background:rgba(139,0,0,.05)">'
        +'<div style="font-family:var(--M,\'Courier Prime\',monospace);font-size:8px;letter-spacing:2px;color:var(--crim,#8B0000);margin-bottom:4px">ERROR</div>'
        +'<div style="font-size:11px;color:rgba(233,230,220,.7)">'+(msg||'Failed to load data')+'</div>'
        +'</div>';
    },
    empty: function(el, msg, icon){
      if(!el) return;
      el.innerHTML = '<div style="padding:24px;text-align:center">'
        +'<div style="font-family:var(--D,\'Cinzel Decorative\',serif);font-size:32px;color:rgba(201,168,76,.15);margin-bottom:10px">'+(icon||'&#9670;')+'</div>'
        +'<div style="font-family:var(--M,\'Courier Prime\',monospace);font-size:9px;letter-spacing:2px;color:rgba(138,134,118,.4)">'+(msg||'NO DATA')+'</div>'
        +'</div>';
    }
  };

  /* ── G. PAGE ENTRANCE SEQUENCE ────────────────────────────────── */
  function runEntrance(){
    if(REDUCED) return;
    /* Topbar slides down */
    var topbar = document.querySelector('.topbar');
    if(topbar && !topbar.dataset.animated){
      topbar.dataset.animated='1';
      topbar.style.animation='oa-fade-in .4s ease both';
    }
    /* Setup scroll reveal with delay */
    setTimeout(setupScrollReveal, 100);
    setTimeout(setupMicroInteractions, 150);
  }

  injectEntranceCSS();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', runEntrance);
  } else { runEntrance(); }

  /* Re-run when omega populates */
  document.addEventListener('omega:populated', function(){
    setTimeout(setupScrollReveal, 200);
    setTimeout(setupMicroInteractions, 250);
  });

  window.OmegaAnimate = {
    reveal: setupScrollReveal,
    micro: setupMicroInteractions,
    countUp: window.OmegaCountUp,
    particles: window.OmegaParticles,
    loading: window.OmegaLoading
  };
})();
