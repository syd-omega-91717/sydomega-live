/* Ω SYD OMEGA 91717 — living cinematic backdrop.
   Depth-layered light motes + golden frequency-grid + soft bloom.
   Subtle by design; sits behind all content; honors reduced-motion. */
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
    var n=Math.max(26, Math.min(60, Math.floor((W*H)/24000)));
    P=[];
    for(var i=0;i<n;i++){
      var depth=0.35+Math.random()*0.65;            // parallax depth: far -> near
      P.push({
        x:Math.random()*W, y:Math.random()*H,
        vx:(Math.random()-0.5)*0.16*depth,
        vy:(Math.random()-0.5)*0.16*depth,
        r:(0.5+Math.random()*1.4)*depth,
        d:depth,
        gold:Math.random()<0.78
      });
    }
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    // soft bloom, upper-centre
    var cx=W*0.5, cy=H*0.34;
    var g=ctx.createRadialGradient(cx,cy,10,cx,cy,Math.max(W,H)*0.62);
    g.addColorStop(0,'rgba(201,168,76,0.055)');
    g.addColorStop(0.55,'rgba(0,229,255,0.018)');
    g.addColorStop(1,'rgba(7,7,11,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    var i,j;
    if(!reduce){
      for(i=0;i<P.length;i++){ var p=P[i]; p.x+=p.vx; p.y+=p.vy;
        if(p.x<-10)p.x=W+10; if(p.x>W+10)p.x=-10; if(p.y<-10)p.y=H+10; if(p.y>H+10)p.y=-10; }
    }
    // frequency-grid links (near layers only, low alpha)
    ctx.lineWidth=0.5;
    for(i=0;i<P.length;i++){ for(j=i+1;j<P.length;j++){ var a=P[i],b=P[j];
      var dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
      if(d2<13000){ var al=(1-d2/13000)*0.10*Math.min(a.d,b.d);
        ctx.strokeStyle='rgba(201,168,76,'+al.toFixed(3)+')';
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
    // motes
    for(i=0;i<P.length;i++){ var q=P[i];
      ctx.beginPath();
      ctx.fillStyle=q.gold?'rgba(201,168,76,'+(0.45*q.d+0.15).toFixed(3)+')':'rgba(0,229,255,'+(0.4*q.d+0.1).toFixed(3)+')';
      ctx.shadowColor=q.gold?'rgba(201,168,76,0.5)':'rgba(0,229,255,0.45)';
      ctx.shadowBlur=6*q.d;
      ctx.arc(q.x,q.y,q.r,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0;
  }
  function loop(){ t+=0.004; draw(); raf=requestAnimationFrame(loop); }
  function start(){ resize(); init(); if(reduce){ draw(); } else { if(raf) cancelAnimationFrame(raf); loop(); } }
  window.addEventListener('resize', function(){ resize(); init(); if(reduce) draw(); });

  if(document.fonts && document.fonts.ready){ /* not needed; no text */ }
  attach();
})();

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
