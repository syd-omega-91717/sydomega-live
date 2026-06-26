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
    /* Ensure touch feedback */
    'a,button{-webkit-tap-highlight-color:rgba(201,168,76,.15)}',
    /* Swipe hint for drawer */
    '#omega-drawer{border-top:3px solid #C9A84C}',
    '#omega-drawer .drawer-header{position:sticky;top:0;background:rgba(8,8,15,.98);z-index:1}',
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

/* Cinematic FX engine loader */
(function(){if(!document.querySelector('script[data-omega-fx]')){var s=document.createElement('script');s.src='/omega-fx.js';s.setAttribute('data-omega-fx','1');(document.body||document.documentElement).appendChild(s);}})();

/* ACCESS GUARD + TRIAL ENGINE */
(function(){
  var pg=(location.pathname.split('/').pop()||'').replace('.html','');
  var EX={'':1,'index':1,'account':1,'terms':1,'charter':1,'reset':1,'enter':1,'hall':1,'pending':1,'approvals':1};
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
      });
    });
  }).catch(function(){});
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
    var expired=false;
    function tick(){if(expired)return;var rem=expiresAt-Date.now();if(rem<=0){expired=true;timer.textContent='00:00';label.textContent='TRIAL EXPIRED';note.textContent='SESSION ENDED \u00B7 RESETTING PROGRESS...';sb.rpc('expire_trial',{p_uid:uid}).then(function(){setTimeout(function(){location.replace('/pending.html?t=expired');},2200);});return;}var m=Math.floor(rem/60000),sc=Math.floor((rem%60000)/1000);timer.textContent=(m<10?'0':'')+m+':'+(sc<10?'0':'')+sc;if(rem<60000)bar.style.boxShadow='0 -2px 24px rgba(139,0,0,0.6)';setTimeout(tick,500);}
    tick();
  }
})();

/* LUMINOUS TOGGLE */
(function(){
  if(document.getElementById('omega-lux-toggle'))return;
  var stored=localStorage.getItem('omega_lux_mode')||'void';
  function applyMode(m){if(m==='lux'){document.documentElement.style.setProperty('--void','#F5F5F7');document.documentElement.style.setProperty('--panel','#EFEFEF');document.documentElement.style.setProperty('--ink','#111114');document.documentElement.style.setProperty('--muted','#555558');document.body.style.background='#F5F5F7';btn.textContent='[O] VOID MODE';btn.style.color='#07070b';btn.style.borderColor='rgba(7,7,11,.2)';}else{document.documentElement.style.removeProperty('--void');document.documentElement.style.removeProperty('--panel');document.documentElement.style.removeProperty('--ink');document.documentElement.style.removeProperty('--muted');document.body.style.background='';btn.textContent='[*] LUX MODE';btn.style.color='rgba(201,168,76,0.5)';btn.style.borderColor='rgba(201,168,76,0.14)';}}
  var btn=document.createElement('button');btn.id='omega-lux-toggle';btn.style.cssText='position:fixed;bottom:68px;right:18px;z-index:9997;font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;padding:6px 12px;background:transparent;border:1px solid;cursor:pointer;transition:all .2s';
  btn.addEventListener('click',function(){var cur=localStorage.getItem('omega_lux_mode')||'void';var next=cur==='void'?'lux':'void';localStorage.setItem('omega_lux_mode',next);applyMode(next);});
  document.body.appendChild(btn);applyMode(stored);
})();

/* TOPBAR HOME+BACK + MOBILE BOTTOM NAV */
(function(){
  var pg=(location.pathname.split('/').pop()||'').replace('.html','');
  var EX={'':1,'index':1,'account':1,'terms':1,'charter':1,'reset':1,'enter':1,'pending':1};
  if(EX[pg])return;
  /* CSS injection */
  if(!document.getElementById('omega-ui-css')){
    var s=document.createElement('style');s.id='omega-ui-css';
    s.textContent='.tnav-btn{font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;color:var(--muted,#85837b);padding:5px 10px;border:1px solid rgba(201,168,76,.2);background:transparent;cursor:pointer;text-decoration:none;transition:all .15s;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.tnav-btn:hover{color:#C9A84C;border-color:rgba(201,168,76,.5)}.tnav-wrap{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}#omega-mob-nav{position:fixed;bottom:0;left:0;right:0;z-index:9990;display:none;align-items:stretch;height:58px;background:rgba(7,7,11,.97);border-top:1px solid rgba(201,168,76,.2);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}#omega-mob-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;color:#85837b;border-top:2px solid transparent;font-family:"Courier Prime",monospace;font-size:7px;letter-spacing:1.5px;transition:all .15s}#omega-mob-nav a.mbn-on{color:#C9A84C;border-top-color:#C9A84C;background:rgba(201,168,76,.05)}#omega-mob-nav .mbn-ic{font-size:15px;line-height:1;display:block}@media(max-width:767px){#omega-mob-nav{display:flex}body{padding-bottom:70px!important}}';
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
  /* Mobile bottom nav */
  function injectMobileNav(){
    if(document.getElementById('omega-mob-nav'))return;
    var LINKS=[
      ['\u2302','HOME','/dashboard.html','dashboard'],
      ['\u25C7','MATRIX','/matrix.html','matrix'],
      ['\u25B6','MEDIA','/cinema.html','cinema'],
      ['\u25C8','WALLET','/wallet.html','wallet'],
      ['\u25CF','PROFILE','/profile.html','profile']
    ];
    var bar=document.createElement('nav');bar.id='omega-mob-nav';
    LINKS.forEach(function(l){
      var a=document.createElement('a');a.href=l[2];
      if(pg===l[3])a.className='mbn-on';
      a.innerHTML='<span class="mbn-ic">'+l[0]+'</span><span>'+l[1]+'</span>';
      bar.appendChild(a);
    });
    document.body.appendChild(bar);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){injectTopbar();injectMobileNav();});}
  else{injectTopbar();injectMobileNav();}
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
        var pub=['/index.html','/account.html','/enter.html','/reset.html','/terms.html','/charter.html','/pending.html','/'];
        if(!pub.some(function(p){return path.endsWith(p)||path===p;})){
          window.location.href='/pending.html';
        }
      }
    }catch(e){}
  }
  /* Run after page load, with delay so canvas renders first */
  setTimeout(checkTrialExpiry,2000);
})();
