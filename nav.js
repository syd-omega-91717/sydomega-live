/* SYD OMEGA 91717 -- Sovereign Icon Navigation v4.0
   Visual icon dock. 8 sections. Rotating Omega.
   Self-injects all CSS. No external deps. */
(function(){
  var el=document.getElementById('omega-side');
  if(!el) return;
  var data_page=el.getAttribute('data-page')||
    ((location.pathname.split('/').pop()||'').replace('.html',''))||'dashboard';

  /* PAGE -> SECTION mapping */
  var PAGE_SECTION={
    dashboard:'command',beacon:'command',notifications:'command',search:'command',
    profile:'identity',passport:'identity',kyc:'identity',settings:'identity',
    character:'identity',sigil:'identity',
    ascension:'ascend',matrix:'ascend',academy:'ascend',gaming:'ascend',
    honors:'ascend',trophies:'ascend',exam:'ascend',contributions:'ascend',
    agents:'cosmos',horoscope:'cosmos',pantheons:'cosmos',elements:'cosmos',
    gates:'cosmos',triads:'cosmos',kings:'cosmos',
    cinema:'universe',universe:'universe',media:'universe',
    treasury:'vault',wallet:'vault',blockchain:'vault',payments:'vault',
    membership:'vault',marketplace:'vault',
    family:'order',bloodline:'order',heritage:'order',hall:'order',
    sovereigns:'order',factions:'order',city:'order',
    consultancy:'services',contracts:'services',publishing:'services',
    marketing:'services',health:'services',events:'services',travel:'services',
    research:'intel',prediction:'intel',intelligence:'intel',
    automation:'intel',social:'intel',news:'intel',
    compliance:'intel',charter:'intel',approvals:'intel',
  };

  var SECTIONS=[
    {key:'command', icon:'\u2316', label:'COMMAND',     href:'/dashboard.html',   col:'#C9A84C', sub:[
      ['dashboard','DASHBOARD','/dashboard.html'],['beacon','THE BEACON','/beacon.html'],
      ['search','SEARCH','/search.html'],['notifications','ALERTS','/notifications.html']]},
    {key:'identity',icon:'\u25C8', label:'IDENTITY',    href:'/identity.html',   col:'#00E5FF', sub:[
      ['profile','PROFILE','/profile.html'],['passport','PASSPORT','/passport.html'],
      ['kyc','KYC VERIFICATION','/kyc.html'],['character','CHARACTER','/character.html'],
      ['settings','SETTINGS','/settings.html']]},
    {key:'ascend',  icon:'\u25B2', label:'ASCEND',      href:'/ascension.html',   col:'#E86A3A', sub:[
      ['ascension','ASCENSION MAP','/ascension.html'],['matrix','THE 729 MATRIX','/matrix.html'],
      ['academy','ACADEMY','/academy.html'],['gaming','GAMING ARENA','/gaming.html'],
      ['trophies','TROPHY VAULT','/trophies.html'],['exam','EXAM HALL','/exam.html']]},
    {key:'cosmos',  icon:'\u2609', label:'COSMOS',      href:'/cosmos.html',     col:'#9B6BF0', sub:[
      ['horoscope','HOROSCOPE','/horoscope.html'],['agents','AI AGENTS','/agents.html'],
      ['elements','THE 9 ELEMENTS','/elements.html'],['pantheons','PANTHEONS','/pantheons.html'],
      ['gates','THE 12 GATES','/gates.html']]},
    {key:'universe',icon:'\u25BA', label:'UNIVERSE',    href:'/cinema.html',      col:'#8B0000', sub:[
      ['cinema','CINEMA & SAGA','/cinema.html'],['universe','CREATIVE UNIVERSE','/universe.html'],
      ['gaming','GAMING','/gaming.html']]},
    {key:'vault',   icon:'\u03A9', label:'VAULT',       href:'/vault.html',      col:'#C9A84C', sub:[
      ['treasury','SOVEREIGN RESERVE','/treasury.html'],['wallet','WALLET','/wallet.html'],
      ['blockchain','BLOCKCHAIN & NFT','/blockchain.html'],['payments','PAYMENTS','/payments.html'],
      ['membership','MEMBERSHIP','/membership.html'],['marketplace','MARKETPLACE','/marketplace.html']]},
    {key:'order',   icon:'\u22D4', label:'THE ORDER',   href:'/family.html',      col:'#D9B86A', sub:[
      ['family','FAMILY LINEAGE','/family.html'],['bloodline','BLOODLINE VAULT','/bloodline.html'],
      ['heritage','HERITAGE ARCHIVE','/heritage.html'],['sovereigns','HALL OF SOVEREIGNS','/sovereigns.html'],
      ['city','OMEGA CITY','/city.html']]},
    {key:'services',icon:'\u2726', label:'SERVICES',    href:'/consultancy.html', col:'#3fb27f', sub:[
      ['consultancy','CONSULTANCY','/consultancy.html'],['research','RESEARCH','/research.html'],
      ['prediction','ORACLE PREDICTION','/prediction.html'],['intelligence','INTELLIGENCE','/intelligence.html'],
      ['portfolio','PORTFOLIO','/portfolio.html'],['income','INCOME','/income.html'],
      ['automation','AUTOMATION','/automation.html'],['publishing','PUBLISHING','/publishing.html'],
      ['compliance','GOVERNANCE','/compliance.html'],['approvals','APPROVALS','/approvals.html']]},
  ];

  /* --- INJECT CSS --- */
  if(!document.getElementById('omega-nav-css')){
    var st=document.createElement('style'); st.id='omega-nav-css';
    st.textContent=[
      /* SIDEBAR */
      '.omega-side{width:72px;flex-shrink:0;border-right:1px solid rgba(201,168,76,0.12);background:#08080F;display:flex;flex-direction:column;align-items:center;padding:10px 0 16px;position:sticky;top:0;height:100vh;overflow:visible;z-index:200}',
      /* HOME + BACK */
      '.on-hb{display:flex;flex-direction:column;gap:5px;width:100%;align-items:center;padding:0 8px;margin-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.1);padding-bottom:10px}',
      '.on-btn{width:48px;height:28px;display:flex;align-items:center;justify-content:center;font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:1.5px;cursor:pointer;border:1px solid rgba(201,168,76,0.2);color:#85837b;background:rgba(201,168,76,0.03);transition:all .15s;white-space:nowrap;text-decoration:none}',
      '.on-btn:hover{color:#C9A84C;border-color:rgba(201,168,76,0.5);background:rgba(201,168,76,0.07)}',
      /* OMEGA BRAND */
      '.on-brand{width:48px;height:48px;border-radius:50%;border:1px solid rgba(201,168,76,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:10px;cursor:pointer;position:relative;flex-shrink:0}',
      '.on-brand canvas{display:block}',
      /* SECTION ICONS */
      '.on-sections{display:flex;flex-direction:column;gap:3px;align-items:center;width:100%;flex:1}',
      '.on-icon{width:48px;height:48px;border-radius:12px;border:1px solid transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;position:relative;font-size:18px;flex-shrink:0;text-decoration:none}',
      '.on-icon:hover,.on-icon.on-active{background:rgba(201,168,76,0.08);border-color:rgba(201,168,76,0.3)}',
      '.on-icon.on-active{box-shadow:0 0 12px rgba(201,168,76,0.2)}',
      /* TOOLTIP fly-out */
      '.on-tooltip{position:absolute;left:56px;top:50%;transform:translateY(-50%);background:#0d0d18;border:1px solid rgba(201,168,76,0.3);padding:0;min-width:160px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:9990;box-shadow:4px 4px 20px rgba(0,0,0,0.6)}',
      '.on-icon:hover .on-tooltip{opacity:1;pointer-events:all}',
      '.tt-header{font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:3px;padding:8px 12px 6px;border-bottom:1px solid rgba(201,168,76,0.15)}',
      '.tt-item{display:flex;align-items:center;padding:6px 12px;font-family:"Courier Prime",monospace;font-size:10px;color:#85837b;text-decoration:none;transition:color .1s,background .1s}',
      '.tt-item:hover{color:#C9A84C;background:rgba(201,168,76,0.05)}',
      '.tt-item.tt-on{color:#C9A84C}',
      '.tt-dot{width:4px;height:4px;border-radius:50%;margin-right:7px;flex-shrink:0}',
      /* LOGOUT */
      '.on-logout{font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:2px;color:#85837b;padding:6px 10px;cursor:pointer;border-top:1px solid rgba(201,168,76,0.08);width:100%;text-align:center;transition:color .15s;margin-top:4px}',
      '.on-logout:hover{color:#C9A84C}',
      /* MOBILE */
      '.omega-mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:9990;background:rgba(8,8,15,0.97);border-top:1px solid rgba(201,168,76,0.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}',
      '.mob-nav-ul{display:flex;list-style:none;margin:0;padding:0}',
      '.mob-nav-ul li{flex:1}',
      '.mob-nav-ul li a{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 4px 11px;text-decoration:none;gap:3px;transition:all .15s}',
      '.mob-nav-ul li a .mi{font-size:19px;line-height:1;transition:transform .15s}',
      '.mob-nav-ul li a .ml{font-family:"Courier Prime",monospace;font-size:7px;letter-spacing:1px;color:#85837b}',
      '.mob-nav-ul li a.m-on .mi,.mob-nav-ul li a:hover .mi{color:#C9A84C;text-shadow:0 0 10px rgba(201,168,76,0.6);transform:translateY(-2px) scale(1.1)}',
      '.mob-nav-ul li a:not(.m-on) .mi{color:#454340}',
      '@media(max-width:760px){.omega-mob-nav{display:block}body{padding-bottom:64px}aside.omega-side{display:none!important}}',
      '@media(min-width:761px){.omega-mob-nav{display:none}}',
      /* Prevent layout flash before nav.js runs */
      '#omega-side{width:72px!important;flex-shrink:0;height:100vh;position:sticky;top:0;overflow:visible;z-index:200;background:#08080F;border-right:1px solid rgba(201,168,76,0.12)}',
      '.side{width:72px!important}',,
      /* TOP STATUS BAR */
      '#omega-top-bar{position:fixed;top:0;left:0;right:0;height:2px;z-index:10000;pointer-events:none;background:linear-gradient(90deg,transparent,#C9A84C 30%,#00E5FF 70%,transparent);background-size:200% 100%;animation:top-scan 3.5s linear infinite}',
      '@keyframes top-scan{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    ].join('');
    (document.head||document.documentElement).appendChild(st);
  }

  var activeSection=PAGE_SECTION[data_page]||'command';

  /* --- BUILD SIDEBAR HTML --- */
  var html='';

  /* HOME + BACK */
  html+='<div class="on-hb">';
  html+='<a class="on-btn" href="/dashboard.html">\u2302 HOME</a>';
  html+='<div class="on-btn" id="on-back-btn">\u2190 BACK</div>';
  html+='</div>';

  /* Brand Omega canvas */
  html+='<div class="on-brand" onclick="location.href=\'/dashboard.html\'"><canvas id="on-brand-cv" width="96" height="96" style="width:48px;height:48px"></canvas></div>';

  /* Section icons */
  html+='<div class="on-sections">';
  SECTIONS.forEach(function(sec){
    var isActive=(sec.key===activeSection);
    /* tooltip items */
    var tipItems=sec.sub.map(function(s){
      var subOn=s[0]===data_page;
      return '<a class="tt-item'+(subOn?' tt-on':'')+'" href="'+s[2]+'"><div class="tt-dot" style="background:'+(subOn?sec.col:'rgba(133,131,123,0.5)')+'"></div>'+s[1]+'</a>';
    }).join('');
    html+='<a class="on-icon'+(isActive?' on-active':'')+'" style="color:'+(isActive?sec.col:'rgba(133,131,123,0.55)');
    if(isActive) html+=';border-color:'+sec.col+'44';
    html+='" href="'+sec.href+'">';
    html+=sec.icon;
    /* Tooltip */
    html+='<div class="on-tooltip">';
    html+='<div class="tt-header" style="color:'+sec.col+'">'+sec.label+'</div>';
    html+=tipItems;
    html+='</div>';
    html+='</a>';
  });
  html+='</div>';

  /* Logout */
  html+='<div class="on-logout" id="on-logout">LOG OUT</div>';

  el.className='omega-side';
  el.innerHTML=html;

  /* BACK button */
  var back=document.getElementById('on-back-btn');
  if(back) back.addEventListener('click',function(){
    window.history.length>1?window.history.back():location.href='/dashboard.html';
  });

  /* LOGOUT */
  var logout=document.getElementById('on-logout');
  if(logout) logout.addEventListener('click',function(){
    var imp=document.createElement('script'); imp.type='module';
    imp.textContent='import{createClient}from"https://esm.sh/@supabase/supabase-js@2";createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q").auth.signOut().then(()=>location.href="/account.html")';
    document.body.appendChild(imp);
  });

  /* Rotating Omega canvas */
  (function(){
    var cv=document.getElementById('on-brand-cv'); if(!cv) return;
    var ctx=cv.getContext('2d'),t=0;
    function f(){
      t+=.02; ctx.clearRect(0,0,96,96);
      /* rings */
      ctx.save(); ctx.translate(48,48); ctx.rotate(t*.5);
      ctx.beginPath(); ctx.arc(0,0,40,0,Math.PI*2);
      ctx.strokeStyle='rgba(201,168,76,0.2)'; ctx.lineWidth=1; ctx.stroke();
      ctx.save(); ctx.rotate(t*-.8);
      ctx.beginPath(); ctx.ellipse(0,0,38,14,0,0,Math.PI*2);
      ctx.strokeStyle='rgba(201,168,76,0.15)'; ctx.lineWidth=.8; ctx.stroke();
      ctx.restore(); ctx.restore();
      /* Omega */
      ctx.fillStyle='rgba(201,168,76,'+(0.7+0.3*Math.sin(t*1.5))+')';
      ctx.shadowColor='rgba(201,168,76,0.7)'; ctx.shadowBlur=12+4*Math.sin(t);
      ctx.font='700 24px "Cinzel Decorative",serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('\u03A9',48,49); ctx.shadowBlur=0;
      requestAnimationFrame(f);
    }
    f();
  })();

  /* MOBILE BOTTOM NAV */
  if(!document.getElementById('omega-mob-nav')){
    var MOB=[
      {icon:'\u2302',label:'HOME',href:'/dashboard.html',key:'command'},
      {icon:'\u25B2',label:'ASCEND',href:'/ascension.html',key:'ascend'},
      {icon:'\u03A9',label:'OMEGA',href:'/dashboard.html',key:'omega'},
      {icon:'\u2609',label:'COSMOS',href:'/horoscope.html',key:'cosmos'},
      {icon:'\u03A9',label:'VAULT',href:'/treasury.html',key:'vault'},
    ];
    var mob=document.createElement('nav'); mob.id='omega-mob-nav'; mob.className='omega-mob-nav';
    var ul=document.createElement('ul'); ul.className='mob-nav-ul';
    MOB.forEach(function(m){
      var li=document.createElement('li');
      var a=document.createElement('a'); a.href=m.href;
      if(m.key===activeSection||m.key===data_page) a.className='m-on';
      a.innerHTML='<span class="mi">'+m.icon+'</span><span class="ml">'+m.label+'</span>';
      li.appendChild(a); ul.appendChild(li);
    });
    mob.appendChild(ul); document.body.appendChild(mob);
  }

  /* TOP SCAN BAR */
  if(!document.getElementById('omega-top-bar')){
    var bar=document.createElement('div'); bar.id='omega-top-bar'; document.body.appendChild(bar);
  }
})();
