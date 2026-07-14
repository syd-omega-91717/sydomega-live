/* SYD OMEGA 91717 -- Sovereign Navigation v5.0
   Icon dock. All 71 pages covered. Permanent labels. Rotating Omega. */
(function(){
  var el=document.getElementById('omega-side');
  if(!el) return;
  var dp=el.getAttribute('data-page')||
    ((location.pathname.split('/').pop()||'').replace('.html',''))||'dashboard';

  /* Map every page to a section */
  var PS={
    dashboard:'command',beacon:'command',notifications:'command',search:'command',
    profile:'identity',passport:'identity',kyc:'identity',settings:'identity',
    character:'identity',
    ascension:'ascend',matrix:'ascend',academy:'ascend',gaming:'ascend',
    honors:'ascend',trophies:'ascend',exam:'ascend',contributions:'ascend',
    agents:'cosmos',horoscope:'cosmos',pantheons:'cosmos',elements:'cosmos',
    gates:'cosmos',triads:'cosmos',kings:'cosmos',chatbot:'cosmos',
    cinema:'universe',universe:'universe',media:'universe',
    treasury:'vault',wallet:'vault',blockchain:'vault',payments:'vault',
    membership:'vault',marketplace:'vault',income:'vault',portfolio:'vault',
    family:'order',bloodline:'order',heritage:'order',hall:'order',
    sovereigns:'order',factions:'order',city:'order',
    services:'services',consultancy:'services',contracts:'services',publishing:'services',
    marketing:'services',health:'services',events:'services',travel:'services',
    news:'services',social:'services',
    research:'intel',prediction:'intel',intelligence:'intel',
    automation:'intel',compliance:'intel',charter:'intel',approvals:'intel',
    grid:'intel',
    identity:'identity',vault:'vault',sigil:'vault',cosmos:'cosmos',
  };

  var SECTIONS=[
    {key:'command', icon:'\u2316', label:'COMMAND', href:'/dashboard.html',  col:'#C9A84C',
     sub:[['dashboard','DASHBOARD','/dashboard.html'],['beacon','BEACON','/beacon.html'],
          ['search','SEARCH','/search.html'],['notifications','ALERTS','/notifications.html'],
          ['chatbot','CONCIERGE AI','/chatbot.html']]},
    {key:'identity',icon:'\u25C8', label:'IDENTITY', href:'/identity.html', col:'#00E5FF',
     sub:[['identity','IDENTITY HUB','/identity.html'],['profile','PROFILE','/profile.html'],
          ['passport','PASSPORT','/passport.html'],['kyc','KYC VERIFY','/kyc.html'],
          ['character','CHARACTER','/character.html'],['settings','SETTINGS','/settings.html']]},
    {key:'ascend',  icon:'\u25B2', label:'ASCEND',   href:'/ascension.html',col:'#E86A3A',
     sub:[['ascension','ASCENSION MAP','/ascension.html'],['matrix','THE 729','/matrix.html'],
          ['achievements','MY RECORD','/achievements.html'],
          ['academy','ACADEMY','/academy.html'],['gaming','GAMING ARENA','/gaming.html'],
          ['trophies','TROPHY VAULT','/trophies.html'],['honors','HONORS','/honors.html'],
          ['exam','EXAM HALL','/exam.html'],['contributions','CONTRIBUTIONS','/contributions.html'],['points','SOVEREIGN POINTS','/points.html']]},
    {key:'cosmos',  icon:'\u2609', label:'COSMOS',   href:'/cosmos.html',   col:'#9B6BF0',
     sub:[['cosmos','COSMOS HUB','/cosmos.html'],['horoscope','HOROSCOPE','/horoscope.html'],
          ['agents','AI AGENTS','/agents.html'],['elements','9 ELEMENTS','/elements.html'],
          ['pantheons','PANTHEONS','/pantheons.html'],['gates','12 GATES','/gates.html'],['houses','HOUSES LATTICE','/houses.html'],
          ['triads','12 TRIADS','/triads.html'],['kings','28 KINGS','/kings.html']]},
    {key:'universe',icon:'\u25BA', label:'UNIVERSE', href:'/cinema.html',   col:'#8B0000',
     sub:[['cinema','CINEMA & SAGA','/cinema.html'],['universe','CREATIVE UNIVERSE','/universe.html'],
          ['media','MEDIA HUB','/media.html']]},
    {key:'vault',   icon:'\u03A9', label:'VAULT',    href:'/vault.html',    col:'#C9A84C',
     sub:[['vault','SOVEREIGN VAULT','/vault.html'],['treasury','RESERVE','/treasury.html'],
          ['wallet','WALLET','/wallet.html'],['blockchain','BLOCKCHAIN','/blockchain.html'],
          ['payments','PAYMENTS','/payments.html'],['subscriptions','SUBSCRIPTIONS','/subscriptions.html'],
          ['marketplace','MARKETPLACE','/marketplace.html'],['portfolio','PORTFOLIO','/portfolio.html'],
          ['income','INCOME','/income.html'],['evolution','EVOLUTION','/evolution.html'],
          ['ledger','LEDGER','/ledger.html'],['sigil','SIGIL VAULT','/sigil.html']]},
    {key:'order',   icon:'\u22D4', label:'ORDER',    href:'/family.html',   col:'#D9B86A',
     sub:[['family','FAMILY','/family.html'],['bloodline','BLOODLINE','/bloodline.html'],
          ['heritage','HERITAGE','/heritage.html'],['hall','HALL','/hall.html'],
          ['sovereigns','SOVEREIGNS','/sovereigns.html'],['factions','FACTIONS','/factions.html'],
          ['city','OMEGA CITY','/city.html']]},
    {key:'services',icon:'\u2726', label:'SERVICES', href:'/services.html',col:'#3fb27f',
     sub:[['services','ALL SERVICES','/services.html'],['consultancy','CONSULTANCY','/consultancy.html'],['contracts','COMMISSIONS','/contracts.html'],
          ['publishing','PUBLISHING','/publishing.html'],['marketing','MARKETING','/marketing.html'],
          ['news','NEWS WIRE','/news.html'],['social','SOCIAL HUB','/social.html'],
          ['events','EVENTS','/events.html'],['travel','TRAVEL','/travel.html'],
          ['health','HEALTH & WELLNESS','/health.html']]},
    {key:'intel',   icon:'\u25CF', label:'INTEL',    href:'/intelligence.html',col:'#9B6BF0',
     sub:[['research','RESEARCH','/research.html'],['prediction','ORACLE PREDICT','/prediction.html'],
          ['intelligence','INTELLIGENCE','/intelligence.html'],['automation','AUTOMATION','/automation.html'],
          ['compliance','GOVERNANCE','/compliance.html'],['grid','THE GRID','/grid.html'],['charter','CHARTER','/charter.html']]},
  ];

  /* INJECT CSS */
  if(!document.getElementById('omega-nav-css')){
    var s=document.createElement('style'); s.id='omega-nav-css';
    s.textContent=[
      /* Immediate layout fix before JS runs */
      '#omega-side{width:80px!important;flex-shrink:0!important;height:100vh!important;position:sticky!important;top:0!important;overflow:visible!important;z-index:200!important;background:#08080F!important;border-right:1px solid rgba(201,168,76,0.12)!important}',
      '.side{width:80px!important}',
      /* Icon dock */
      '.omega-side{width:80px;flex-shrink:0;background:#08080F;display:flex;flex-direction:column;align-items:center;padding:10px 0 14px;position:sticky;top:0;height:100vh;overflow:visible;z-index:200;border-right:1px solid rgba(201,168,76,0.12)}',
      '.on-hb{display:flex;gap:4px;margin-bottom:8px;padding:0 6px 10px;border-bottom:1px solid rgba(201,168,76,0.1);width:100%;justify-content:center}',
      '.on-btn{font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:1px;width:34px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(201,168,76,0.2);color:#85837b;background:transparent;transition:all .14s;text-decoration:none}',
      '.on-btn:hover{color:#C9A84C;border-color:rgba(201,168,76,0.5)}',
      '.on-brand{width:44px;height:44px;border-radius:50%;border:1px solid rgba(201,168,76,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:8px;flex-shrink:0}',
      '.on-sections{display:flex;flex-direction:column;gap:2px;align-items:center;width:100%;flex:1;overflow-y:auto;scrollbar-width:none}',
      '.on-sections::-webkit-scrollbar{display:none}',
      /* Each icon cell: icon + permanent label */
      '.on-icon{width:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 4px 6px;cursor:pointer;transition:all .15s;position:relative;border-radius:8px;text-decoration:none;border:1px solid transparent}',
      '.on-icon:hover,.on-icon.on-active{background:rgba(201,168,76,0.07);border-color:rgba(201,168,76,0.25)}',
      '.on-icon.on-active{box-shadow:0 0 10px rgba(201,168,76,0.15)}',
      '.on-glyph{font-size:16px;line-height:1;transition:transform .2s}',
      '.on-icon:hover .on-glyph,.on-icon.on-active .on-glyph{transform:scale(1.15)}',
      '.on-lbl{font-family:"Courier Prime",monospace;font-size:6px;letter-spacing:1.5px;color:#55534e;text-align:center;line-height:1;transition:color .15s}',
      '.on-icon:hover .on-lbl,.on-icon.on-active .on-lbl{color:var(--col,#C9A84C)}',
      /* Fly-out tooltip */
      '.on-tip{position:absolute;left:78px;top:0;background:#0d0d18;border:1px solid rgba(201,168,76,0.25);min-width:180px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:9990;box-shadow:6px 6px 24px rgba(0,0,0,0.7)}',
      '.on-icon:hover .on-tip{opacity:1;pointer-events:all}',
      '.tip-head{font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:3px;padding:8px 12px 6px;border-bottom:1px solid rgba(201,168,76,0.12)}',
      '.tip-a{display:flex;align-items:center;padding:6px 12px;font-family:"Courier Prime",monospace;font-size:10px;color:#85837b;text-decoration:none;transition:all .1s;gap:6px;white-space:nowrap}',
      '.tip-a:hover{color:#C9A84C;background:rgba(201,168,76,0.05)}',
      '.tip-a.tip-on{color:#C9A84C}',
      '.tip-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0}',
      /* Logout */
      '.on-logout{font-family:"Courier Prime",monospace;font-size:7px;letter-spacing:2px;color:#55534e;padding:6px;cursor:pointer;border-top:1px solid rgba(201,168,76,0.08);width:100%;text-align:center;transition:color .15s;margin-top:4px}',
      '.on-logout:hover{color:#C9A84C}',
      /* Mobile bottom nav */
      '#omega-mob{display:none;position:fixed;bottom:0;left:0;right:0;z-index:9990;background:rgba(8,8,15,0.97);border-top:1px solid rgba(201,168,76,0.15);backdrop-filter:blur(12px)}',
      '#omega-mob ul{display:flex;list-style:none;margin:0;padding:0}',
      '#omega-mob ul li{flex:1}',
      '#omega-mob ul li a{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 3px 11px;text-decoration:none;gap:3px}',
      '#omega-mob ul li a .mi{font-size:18px;line-height:1;transition:all .15s;color:#353330}',
      '#omega-mob ul li a .ml{font-family:"Courier Prime",monospace;font-size:6px;letter-spacing:1.5px;color:#55534e}',
      '#omega-mob ul li a.m-on .mi,#omega-mob ul li a:hover .mi{color:#C9A84C;text-shadow:0 0 10px rgba(201,168,76,0.6);transform:translateY(-2px)}',
      '#omega-mob ul li a.m-on .ml,#omega-mob ul li a:hover .ml{color:#C9A84C}',
      '@media(max-width:760px){#omega-mob{display:block}body{padding-bottom:66px}aside.omega-side,aside.side{display:none!important}}',
      '@media(min-width:761px){#omega-mob{display:none}}',
      /* Top scan line */
      '#omega-top{position:fixed;top:0;left:0;right:0;height:2px;z-index:10000;pointer-events:none;background:linear-gradient(90deg,transparent,#C9A84C 30%,#00E5FF 70%,transparent);background-size:200% 100%;animation:top-sc 3.5s linear infinite}',
      '@keyframes top-sc{0%{background-position:200% 0}100%{background-position:-200% 0}}',
    ].join('');
    (document.head||document.documentElement).appendChild(s);
  }

  var activeSection=PS[dp]||'command';

  /* BUILD SIDEBAR */
  var h='';
  h+='<div class="on-hb">';
  h+='<a class="on-btn" href="/dashboard.html" title="Home">&#x2302;</a>';
  h+='<div class="on-btn" id="on-back" title="Back">&#x2190;</div>';
  h+='</div>';
  h+='<div class="on-brand" onclick="location.href=\'/dashboard.html\'" title="SYD OMEGA 91717"><canvas id="on-bcv" width="88" height="88" style="width:44px;height:44px"></canvas></div>';
  h+='<div class="on-sections">';
  SECTIONS.forEach(function(sec){
    var isAct=sec.key===activeSection;
    h+='<a class="on-icon'+(isAct?' on-active':'')+'" href="'+sec.href+'" style="--col:'+sec.col+'">';
    h+='<span class="on-glyph" style="color:'+(isAct?sec.col:'#55534e')+'">'+sec.icon+'</span>';
    h+='<span class="on-lbl">'+sec.label+'</span>';
    /* Tooltip */
    h+='<div class="on-tip"><div class="tip-head" style="color:'+sec.col+'">'+sec.label+'</div>';
    sec.sub.forEach(function(sub){
      var on=sub[0]===dp;
      h+='<a class="tip-a'+(on?' tip-on':'')+'" href="'+sub[2]+'">';
      h+='<div class="tip-dot" style="background:'+(on?sec.col:'rgba(133,131,123,0.4)')+'"></div>';
      h+=sub[1]+'</a>';
    });
    h+='</div></a>';
  });
  h+='</div>';
  h+='<div class="on-logout" id="on-logout">LOG OUT</div>';

  el.className='omega-side';
  el.innerHTML=h;

  /* Back btn */
  document.getElementById('on-back')?.addEventListener('click',function(){
    window.history.length>1?window.history.back():location.href='/dashboard.html';
  });

  /* Logout */
  document.getElementById('on-logout')?.addEventListener('click',function(){
    var sc=document.createElement('script');sc.type='module';
    sc.textContent='import{createClient}from"https://esm.sh/@supabase/supabase-js@2";createClient("https://ydqhzvvoyufiiqvzcjns.supabase.co","sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q").auth.signOut().then(()=>location.href="/account.html")';
    document.body.appendChild(sc);
  });

  /* Rotating Omega brand */
  (function(){
    var cv=document.getElementById('on-bcv');if(!cv)return;
    var ctx=cv.getContext('2d'),t=0;
    function f(){
      t+=.022;ctx.clearRect(0,0,88,88);
      ctx.save();ctx.translate(44,44);
      ctx.save();ctx.rotate(t*.5);ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.strokeStyle='rgba(201,168,76,0.2)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
      ctx.save();ctx.rotate(-t*.8);ctx.beginPath();ctx.ellipse(0,0,36,13,0,0,Math.PI*2);ctx.strokeStyle='rgba(201,168,76,0.12)';ctx.lineWidth=0.8;ctx.stroke();ctx.restore();
      ctx.fillStyle='rgba(201,168,76,'+(0.7+0.28*Math.sin(t*1.5))+')';
      ctx.shadowColor='rgba(201,168,76,0.7)';ctx.shadowBlur=12+4*Math.sin(t);
      ctx.font='700 22px "Cinzel Decorative",serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('\u03A9',0,1);ctx.shadowBlur=0;
      ctx.restore();requestAnimationFrame(f);
    }
    f();
  })();

  /* ===== MOBILE NAV -- ALL 9 SECTIONS ===== */
  if(!document.getElementById('omega-mob')){
    /* CSS for mobile nav + drawer */
    var mcs=document.createElement('style');mcs.id='omega-mob-css';
    mcs.textContent=[
      '#omega-mob{display:none;position:fixed;bottom:0;left:0;right:0;z-index:9990;background:rgba(8,8,15,.97);border-top:1px solid rgba(201,168,76,.15);backdrop-filter:blur(16px)}',
      '#omega-mob-bar{display:flex;list-style:none;margin:0;padding:0}',
      '.mob-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 3px 12px;cursor:pointer;text-decoration:none;gap:3px;border:none;background:transparent}',
      '.mob-item .mi{font-size:20px;line-height:1;color:#353330;transition:all .15s}',
      '.mob-item .ml{font-family:"Courier Prime",monospace;font-size:6px;letter-spacing:1.5px;color:#55534e;transition:all .15s}',
      '.mob-item.m-on .mi,.mob-item:hover .mi{color:#C9A84C;text-shadow:0 0 10px rgba(201,168,76,.6);transform:translateY(-2px)}',
      '.mob-item.m-on .ml,.mob-item:hover .ml{color:#C9A84C}',
      '.mob-item.mob-menu-btn .mi{color:#85837b}',
      '.mob-item.mob-menu-btn.menu-open .mi{color:#C9A84C}',
      /* DRAWER */
      '#omega-drawer{position:fixed;bottom:-100%;left:0;right:0;z-index:9989;background:rgba(8,8,15,.99);border-top:1px solid rgba(201,168,76,.25);backdrop-filter:blur(20px);transition:bottom .3s cubic-bezier(.25,.46,.45,.94);max-height:75vh;overflow-y:auto;padding-bottom:80px}',
      '#omega-drawer.drawer-open{bottom:66px}',
      '.drawer-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(201,168,76,.1)}',
      '.dh-title{font-family:"Cinzel Decorative",serif;font-size:14px;color:#C9A84C;font-weight:700;letter-spacing:2px}',
      '.dh-close{font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;color:#85837b;cursor:pointer;padding:6px 12px;border:1px solid rgba(201,168,76,.2)}',
      '.drawer-sections{display:grid;grid-template-columns:1fr 1fr;gap:0}',
      '.ds-section{border-right:1px solid rgba(201,168,76,.08);border-bottom:1px solid rgba(201,168,76,.08);padding:14px 16px}',
      '.ds-section:nth-child(2n){border-right:none}',
      '.dss-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;text-decoration:none}',
      '.dss-icon{font-size:18px;color:#55534e}',
      '.dss-label{font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;color:#85837b}',
      '.dss-head:hover .dss-icon,.dss-head.ds-on .dss-icon{color:#C9A84C;text-shadow:0 0 8px rgba(201,168,76,.5)}',
      '.dss-head:hover .dss-label,.dss-head.ds-on .dss-label{color:#C9A84C}',
      '.ds-links{display:flex;flex-direction:column;gap:2px;padding-left:4px}',
      '.ds-link{font-family:"Courier Prime",monospace;font-size:10px;color:#55534e;text-decoration:none;padding:5px 4px;border-left:2px solid transparent;transition:all .13s;letter-spacing:1px}',
      '.ds-link:hover,.ds-link.dl-on{color:#C9A84C;border-left-color:#C9A84C;background:rgba(201,168,76,.04);padding-left:8px}',
      '@media(min-width:761px){#omega-mob{display:none!important}#omega-drawer{display:none!important}}',
      '@media(max-width:760px){#omega-mob{display:block}body{padding-bottom:66px}}',
      /* ===== MOBILE HARDENING -- no sideways scroll, tables + media fit ===== */
      '@media(max-width:760px){',
        'html,body{overflow-x:hidden;max-width:100vw}',
        '.main,.shell,.pad{max-width:100vw}',
        'table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}',
        'img,video,iframe{max-width:100%;height:auto}',
        'canvas,svg{max-width:100%}',
        'pre,code{max-width:100%;overflow-x:auto}',
        '.topbar .t small{display:block;font-size:8px;line-height:1.5;margin-top:3px;white-space:normal}',
      '}',
    ].join('');
    (document.head||document.documentElement).appendChild(mcs);

    /* BOTTOM BAR - 5 items + menu */
    var MOB5=[
      {icon:'\u2302',label:'HOME',href:'/dashboard.html',key:'command'},
      {icon:'\u25B2',label:'ASCEND',href:'/ascension.html',key:'ascend'},
      {icon:'\u03A9',label:'VAULT',href:'/vault.html',key:'vault'},
      {icon:'\u2609',label:'COSMOS',href:'/cosmos.html',key:'cosmos'},
      {icon:'\u2726',label:'MORE',key:'menu',isMenu:true},
    ];

    var mob=document.createElement('nav');mob.id='omega-mob';
    var ul=document.createElement('ul');ul.id='omega-mob-bar';
    MOB5.forEach(function(m){
      var li=document.createElement('li');li.style.flex='1';
      var a=document.createElement('a');
      a.className='mob-item'+(m.isMenu?' mob-menu-btn':m.key===activeSection?' m-on':'');
      if(!m.isMenu){a.href=m.href;}else{a.href='#';}
      a.innerHTML='<span class="mi">'+m.icon+'</span><span class="ml">'+m.label+'</span>';
      if(m.isMenu){
        a.addEventListener('click',function(e){e.preventDefault();toggleDrawer();});
      }
      li.appendChild(a);ul.appendChild(li);
    });
    mob.appendChild(ul);document.body.appendChild(mob);

    /* DRAWER -- ALL 9 SECTIONS */
    var DRAWER_SECTIONS=[
      {icon:'\u2316',label:'COMMAND',col:'#C9A84C',href:'/dashboard.html',key:'command',
       links:[['DASHBOARD','/dashboard.html'],['BEACON','/beacon.html'],['SEARCH','/search.html'],['ALERTS','/notifications.html'],['AI CONCIERGE','/chatbot.html']]},
      {icon:'\u25C8',label:'IDENTITY',col:'#00E5FF',href:'/identity.html',key:'identity',
       links:[['IDENTITY HUB','/identity.html'],['PROFILE','/profile.html'],['PASSPORT','/passport.html'],['KYC','/kyc.html'],['SETTINGS','/settings.html']]},
      {icon:'\u25B2',label:'ASCEND',col:'#E86A3A',href:'/ascension.html',key:'ascend',
       links:[['ASCENSION','/ascension.html'],['MATRIX 729','/matrix.html'],['MY RECORD','/achievements.html'],['ACADEMY','/academy.html'],['GAMING','/gaming.html'],['TROPHIES','/trophies.html']]},
      {icon:'\u2609',label:'COSMOS',col:'#9B6BF0',href:'/cosmos.html',key:'cosmos',
       links:[['COSMOS HUB','/cosmos.html'],['HOROSCOPE','/horoscope.html'],['AI AGENTS','/agents.html'],['ELEMENTS','/elements.html'],['PANTHEONS','/pantheons.html']]},
      {icon:'\u25BA',label:'UNIVERSE',col:'#8B0000',href:'/cinema.html',key:'universe',
       links:[['CINEMA','/cinema.html'],['UNIVERSE','/universe.html'],['MEDIA HUB','/media.html']]},
      {icon:'\u03A9',label:'VAULT',col:'#C9A84C',href:'/vault.html',key:'vault',
       links:[['SOVEREIGN VAULT','/vault.html'],['WALLET','/wallet.html'],['SUBSCRIPTIONS','/subscriptions.html'],['BLOCKCHAIN','/blockchain.html'],['MARKETPLACE','/marketplace.html'],['PORTFOLIO','/portfolio.html']]},
      {icon:'\u22D4',label:'ORDER',col:'#D9B86A',href:'/family.html',key:'order',
       links:[['FAMILY','/family.html'],['BLOODLINE','/bloodline.html'],['HERITAGE','/heritage.html'],['HALL','/hall.html'],['OMEGA CITY','/city.html']]},
      {icon:'\u2726',label:'SERVICES',col:'#3fb27f',href:'/services.html',key:'services',
       links:[['ALL SERVICES','/services.html'],['CONSULTANCY','/consultancy.html'],['PUBLISHING','/publishing.html'],['NEWS','/news.html'],['SOCIAL HUB','/social.html']]},
      {icon:'\u25CF',label:'INTEL',col:'#9B6BF0',href:'/intelligence.html',key:'intel',
       links:[['INTELLIGENCE','/intelligence.html'],['RESEARCH','/research.html'],['PREDICTION','/prediction.html'],['AUTOMATION','/automation.html'],['COMPLIANCE','/compliance.html']]},
    ];

    var drawer=document.createElement('div');drawer.id='omega-drawer';
    var dh=document.createElement('div');dh.className='drawer-header';
    dh.innerHTML='<div class="dh-title">&#937; SYD OMEGA 91717</div><div class="dh-close" id="drawer-close">CLOSE &#x2715;</div>';
    drawer.appendChild(dh);
    var dsgrid=document.createElement('div');dsgrid.className='drawer-sections';
    DRAWER_SECTIONS.forEach(function(sec){
      var ds=document.createElement('div');ds.className='ds-section';
      var head=document.createElement('a');head.className='dss-head'+(sec.key===activeSection?' ds-on':'');head.href=sec.href;
      head.innerHTML='<span class="dss-icon" style="color:'+(sec.key===activeSection?sec.col:'')+'">'+sec.icon+'</span><span class="dss-label" style="color:'+(sec.key===activeSection?sec.col:'')+'">'+sec.label+'</span>';
      ds.appendChild(head);
      var links=document.createElement('div');links.className='ds-links';
      sec.links.forEach(function(lk){
        var a=document.createElement('a');a.className='ds-link';a.href=lk[1];a.textContent=lk[0];
        links.appendChild(a);
      });
      ds.appendChild(links);dsgrid.appendChild(ds);
    });
    drawer.appendChild(dsgrid);document.body.appendChild(drawer);

    document.getElementById('drawer-close').addEventListener('click',function(){closeDrawer();});
    drawer.addEventListener('click',function(e){if(e.target===drawer) closeDrawer();});

    function toggleDrawer(){
      var d=document.getElementById('omega-drawer');
      var btn=document.querySelector('.mob-menu-btn');
      if(d.classList.contains('drawer-open')){closeDrawer();}
      else{d.classList.add('drawer-open');if(btn)btn.classList.add('menu-open');}
    }
    function closeDrawer(){
      var d=document.getElementById('omega-drawer');
      var btn=document.querySelector('.mob-menu-btn');
      d.classList.remove('drawer-open');if(btn)btn.classList.remove('menu-open');
    }
    window.__closeOmegaDrawer=closeDrawer;
    /* Close drawer on navigation */
    document.querySelectorAll('.ds-link,.dss-head').forEach(function(a){
      a.addEventListener('click',function(){setTimeout(closeDrawer,100);});
    });
  }

  /* Top scan bar */
  if(!document.getElementById('omega-top')){
    var tb=document.createElement('div');tb.id='omega-top';document.body.appendChild(tb);
  }
})();
