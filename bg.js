(function(){ try{ var c=localStorage.getItem("omega_bg"); if(c){ document.documentElement.style.setProperty("--void", c); document.body && (document.body.style.background=c); } }catch(e){} })();
/* Ω SYD OMEGA 91717 — living cinematic backdrop.
   Drifting aurora (gold + cyan) + depth motes with twinkle + frequency-grid +
   a faint rotating 9.17 ring + soft bloom. Subtle by design; behind content; honors reduced-motion. */
(function(){
  if (document.getElementById('omega-bg')) return;
  var cv = document.createElement('canvas');
  cv.id = 'omega-bg';
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  function attach(){ if(document.body){ document.body.appendChild(cv); start(); } else { requestAnimationFrame(attach); } }

  var ctx = cv.getContext('2d');
  var W=0, H=0, DPR=Math.min(window.devicePixelRatio||1, 2);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P=[], t=0, raf=null;

  function resize(){
    W=window.innerWidth; H=window.innerHeight;
    cv.width=Math.floor(W*DPR); cv.height=Math.floor(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  function init(){
    var n=Math.max(28, Math.min(66, Math.floor((W*H)/22000)));
    P=[];
    for(var i=0;i<n;i++){
      var depth=0.35+Math.random()*0.65;            // parallax depth: far -> near
      P.push({
        x:Math.random()*W, y:Math.random()*H,
        vx:(Math.random()-0.5)*0.16*depth,
        vy:(Math.random()-0.5)*0.16*depth,
        r:(0.5+Math.random()*1.5)*depth,
        d:depth,
        ph:Math.random()*6.283,
        gold:Math.random()<0.74
      });
    }
  }
  function aurora(){
    // two large slow-orbiting colour fields — the "alive" colour motion
    var cx=W*0.5, cy=H*0.42, rad=Math.max(W,H)*0.55;
    var ax=cx+Math.cos(t*0.6)*W*0.22, ay=cy+Math.sin(t*0.5)*H*0.18;
    var g1=ctx.createRadialGradient(ax,ay,10,ax,ay,rad);
    g1.addColorStop(0,'rgba(201,168,76,0.075)');
    g1.addColorStop(0.5,'rgba(201,168,76,0.022)');
    g1.addColorStop(1,'rgba(7,7,11,0)');
    ctx.fillStyle=g1; ctx.fillRect(0,0,W,H);
    var bx=cx+Math.cos(-t*0.45+2.1)*W*0.26, by=cy+Math.sin(-t*0.55+1.3)*H*0.2;
    var g2=ctx.createRadialGradient(bx,by,10,bx,by,rad*0.9);
    g2.addColorStop(0,'rgba(0,229,255,0.05)');
    g2.addColorStop(0.5,'rgba(0,229,255,0.015)');
    g2.addColorStop(1,'rgba(7,7,11,0)');
    ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);
    // a third deep-crimson ember, very low, lower-right
    var ex=W*0.82, ey=H*0.82;
    var g3=ctx.createRadialGradient(ex,ey,10,ex,ey,rad*0.6);
    g3.addColorStop(0,'rgba(139,0,0,0.05)');
    g3.addColorStop(1,'rgba(7,7,11,0)');
    ctx.fillStyle=g3; ctx.fillRect(0,0,W,H);
  }
  function ring(){
    // faint rotating frequency ring (9.17 motif) — multidimensional rotative accent
    var cx=W*0.5, cy=H*0.4, R=Math.min(W,H)*0.32;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*0.25);
    for(var k=0;k<2;k++){
      ctx.beginPath();
      ctx.ellipse(0,0,R*(1+k*0.16),R*0.34*(1+k*0.16),0,0,Math.PI*2);
      ctx.strokeStyle='rgba(201,168,76,'+(0.05-k*0.018).toFixed(3)+')';
      ctx.lineWidth=1; ctx.stroke();
    }
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    aurora();
    if(!reduce) ring();
    var i,j;
    if(!reduce){
      for(i=0;i<P.length;i++){ var p=P[i]; p.x+=p.vx; p.y+=p.vy;
        if(p.x<-10)p.x=W+10; if(p.x>W+10)p.x=-10; if(p.y<-10)p.y=H+10; if(p.y>H+10)p.y=-10; }
    }
    // frequency-grid links (near layers only, low alpha)
    ctx.lineWidth=0.5;
    for(i=0;i<P.length;i++){ for(j=i+1;j<P.length;j++){ var a=P[i],b=P[j];
      var dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
      if(d2<13000){ var al=(1-d2/13000)*0.11*Math.min(a.d,b.d);
        ctx.strokeStyle='rgba(201,168,76,'+al.toFixed(3)+')';
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
    // motes with twinkle
    for(i=0;i<P.length;i++){ var q=P[i];
      var tw=reduce?1:(0.55+0.45*Math.sin(t*2.2+q.ph));
      ctx.beginPath();
      ctx.fillStyle=q.gold?'rgba(201,168,76,'+((0.45*q.d+0.15)*tw).toFixed(3)+')':'rgba(0,229,255,'+((0.4*q.d+0.1)*tw).toFixed(3)+')';
      ctx.shadowColor=q.gold?'rgba(201,168,76,0.5)':'rgba(0,229,255,0.45)';
      ctx.shadowBlur=7*q.d;
      ctx.arc(q.x,q.y,q.r,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0;
  }
  function loop(){ t+=0.004; draw(); raf=requestAnimationFrame(loop); }
  function start(){ resize(); init(); if(reduce){ draw(); } else { if(raf) cancelAnimationFrame(raf); loop(); } }
  window.addEventListener('resize', function(){ resize(); init(); if(reduce) draw(); });

  attach();
})();

/* load the per-page living emblem */
(function(){ if(!document.querySelector('script[data-omega-emblem]')){ var s=document.createElement('script'); s.src='/emblem.js'; s.setAttribute('data-omega-emblem','1'); (document.body||document.documentElement).appendChild(s); } })();

/* load the generative ambient score across pages */
(function(){ if(!document.querySelector('script[data-omega-audio]')){ var s=document.createElement('script'); s.src='/audio.js'; s.setAttribute('data-omega-audio','1'); document.body.appendChild(s); } })();

/* terms gate: a signed-in member with cosmology must accept T&C before using the app */
(function(){
  var p=(location.pathname.split('/').pop()||'').replace('.html','');
  var EX={ '':1,'index':1,'account':1,'terms':1,'charter':1,'reset':1,'enter':1,'hall':1,'pending':1,'approvals':1 };
  if(EX[p]) return;
  import('https://esm.sh/@supabase/supabase-js@2').then(function(m){
    var sb=m.createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q");
    sb.auth.getSession().then(function(res){
      var s=res.data.session; if(!s) return;
      sb.from('profiles').select('sign,terms_accepted,access_approved').eq('id',s.user.id).maybeSingle().then(function(pr){
        if(!pr.data) return;
        if(pr.data.access_approved===false){ location.replace('/pending.html'); return; }
        if(pr.data.sign && !pr.data.terms_accepted){ location.replace('/terms.html'); }
      });
    });
  }).catch(function(){});
})();
