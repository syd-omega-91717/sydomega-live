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
    command:'command',
    profile:'identity',settings:'identity',
    ascension:'ascend',matrix:'ascend',academy:'ascend',gaming:'ascend',
    honors:'ascend',trophies:'ascend',exam:'ascend',contributions:'ascend',
    agents:'cosmos',pantheons:'cosmos',elements:'cosmos',chatbot:'cosmos',
    media:'universe',
    blockchain:'vault',marketplace:'vault',income:'vault',
    family:'order',hall:'order',
    sovereigns:'order',factions:'order',city:'order',
    services:'services',consultancy:'services',contracts:'services',publishing:'services',
    studio:'services',marketing:'services',health:'services',events:'services',travel:'services',
    news:'services',social:'services',
    research:'intel',prediction:'intel',intelligence:'intel',
    automation:'intel',compliance:'intel',approvals:'intel',
    vault:'vault',sigil:'vault',cosmos:'cosmos',
    /* Below: each key's final/effective value — earlier duplicate keys with a
       different value that this silently overrode have been removed (JS object
       literals keep only the last assignment); see REPOSITORY_AUDIT.md §5. */
    analytics:'intel',achievements:'achieve',leaderboard:'achieve',
    bloodline:'archive',character:'archive',charter:'archive',
    cinema:'media',credentials:'archive',design_system:'govern',
    ecosystem:'govern',enterprise:'govern',feed:'media',
    gates:'achieve',governance:'govern',grades:'achieve',
    grid:'achieve',heritage:'archive',horoscope:'cosmos',
    identity:'archive',investment:'invest',kings:'achieve',
    knowledge:'govern',kyc:'archive',lab:'govern',
    levels:'achieve',membership:'archive',observatory:'govern',
    passport:'archive',payments:'vault',phases:'achieve',
    portfolio:'invest',privacy:'govern',revenue:'invest',
    roadmap:'govern',series:'media',sovereign_ai:'arena',
    treasury:'invest',trailers:'media',triads:'achieve',
    universe:'media',wallet:'invest',council:'govern',hercules:'achieve',
    'sovereign-ai':'arena','design-system':'govern',
    /* Navigation/IA-audit remediation: the 64 pages found reachable only via
       dashboard.html/intelligence.html's own quick-link grids, folded into the
       persistent sidebar by theme (REPOSITORY_AUDIT.md §9). */
    affirmations:'services',body:'services',breath:'services',fasting:'services',gratitude:'services',habits:'services',journal:'services',meditate:'services',mood:'services',nutrition:'services',oath:'services',physiology:'services',rituals:'services',sleep:'services',stoic:'services',targets:'services',water:'services',weekly:'services',workout:'services',budget:'invest',expenses:'invest',wealth:'invest',contacts:'command',decisions:'command',missions:'command',network:'command',notes:'command',projects:'command',quotes:'command',time:'command',vision:'command',chronicle:'cosmos',dna:'cosmos',graph:'cosmos',graphify:'intel','graph-admin':'intel','graph-timeline':'intel','graph-centrality':'intel','graph-explorer':'intel','graph-anomalies':'intel','graph-evidence':'intel',map:'cosmos',mirror:'cosmos',oracle:'cosmos',realm:'cosmos',rune:'cosmos',tribe:'cosmos',atlas:'intel',cipher:'intel',codex:'intel',mindmap:'intel',nexus:'intel',pulse:'intel',sigma:'intel',signal:'intel',architect:'ascend',clarity:'ascend',flashcard:'ascend',focus:'ascend',forge:'ascend',library:'ascend',mentors:'ascend',principles:'ascend',reading:'ascend',skills:'ascend',vocabulary:'ascend',maintenance:'govern',ops:'govern',queue:'arena',awards:'achieve',publications:'media',
  };

  var SECTIONS=[
    {key:'command', icon:'\u2316', label:'COMMAND', href:'/dashboard.html',  col:'#C9A84C',
     sub:[['dashboard','DASHBOARD','/dashboard.html'],['beacon','BEACON','/beacon.html'],
          ['search','SEARCH','/search.html'],['notifications','ALERTS','/notifications.html'],
          ['chatbot','CONCIERGE AI','/chatbot.html'],['matrix','THE MATRIX','/matrix.html'],['points','SOVEREIGN POINTS','/points.html'],
          ['command','COMMAND BRIEF','/command.html'],['contacts','CONTACTS','/contacts.html'],['decisions','DECISIONS','/decisions.html'],['missions','MISSIONS','/missions.html'],['network','NETWORK','/network.html'],['notes','NOTES','/notes.html'],['projects','PROJECTS','/projects.html'],['quotes','QUOTES','/quotes.html'],['time','TIME TRACKER','/time.html'],['vision','VISION BOARD','/vision.html']]},
    {key:'identity',icon:'\u25C8', label:'IDENTITY', href:'/profile.html', col:'#00E5FF',
     sub:[['identity','IDENTITY HUB','/profile.html#identity'],['profile','PROFILE','/profile.html'],
          ['passport','PASSPORT','/profile.html#passport'],['kyc','KYC VERIFY','/profile.html#kyc'],
          ['character','CHARACTER','/profile.html#character'],['settings','SETTINGS','/profile.html#settings'],['agents','AI AGENTS','/agents.html'],['factions','FACTIONS','/factions.html'],['pantheons','PANTHEONS','/pantheons.html'],['houses','THE HOUSES','/houses.html']]},
    {key:'ascend',  icon:'\u25B2', label:'ASCEND',   href:'/honors.html#ascension',col:'#E86A3A',
     sub:[['ascension','ASCENSION MAP','/honors.html#ascension'],['matrix','THE 729','/matrix.html'],
          ['achievements','MY RECORD','/honors.html#record'],
          ['academy','ACADEMY','/academy.html'],['gaming','GAMING ARENA','/gaming.html'],
          ['trophies','TROPHY VAULT','/trophies.html'],['honors','HONORS','/honors.html'],
          ['exam','EXAM HALL','/gaming.html#exam'],['contributions','CONTRIBUTIONS','/contributions.html'],['points','SOVEREIGN POINTS','/points.html'],['evolution','EVOLUTION','/evolution.html'],['architect','ARCHITECT','/architect.html'],['clarity','CLARITY','/clarity.html'],['flashcard','FLASHCARDS','/flashcard.html'],['focus','FOCUS','/focus.html'],['forge','FORGE','/forge.html'],['library','LIBRARY','/library.html'],['mentors','MENTORS','/mentors.html'],['principles','PRINCIPLES','/principles.html'],['reading','READING LIST','/reading.html'],['skills','SKILLS','/skills.html'],['vocabulary','VOCABULARY','/vocabulary.html']]},
    {key:'cosmos',  icon:'\u2609', label:'COSMOS',   href:'/cosmos.html',   col:'#9B6BF0',
     sub:[['cosmos','COSMOS HUB','/cosmos.html'],['horoscope','HOROSCOPE','/cosmos.html#horoscope'],
          ['agents','AI AGENTS','/agents.html'],['elements','9 ELEMENTS','/elements.html'],
          ['pantheons','PANTHEONS','/pantheons.html'],['gates','12 GATES','/elements.html#gates'],['houses','HOUSES LATTICE','/houses.html'],
          ['triads','12 TRIADS','/matrix.html#triads'],['kings','28 KINGS','/elements.html#kings'],['chronicle','CHRONICLE','/chronicle.html'],['dna','SOVEREIGN DNA','/dna.html'],['graph','CONSTELLATION GRAPH','/graph.html'],['map','STAR MAP','/map.html'],['mirror','SOVEREIGN MIRROR','/mirror.html'],['oracle','ORACLE','/oracle.html'],['realm','REALM','/realm.html'],['rune','RUNES','/rune.html'],['tribe','TRIBE','/tribe.html']]},
    {key:'universe',icon:'\u25BA', label:'UNIVERSE', href:'/media.html',   col:'#8B0000',
     sub:[['cinema','CINEMA & SAGA','/media.html'],['universe','CREATIVE UNIVERSE','/media.html'],
          ['media','MEDIA HUB','/media.html'],['hall','SOVEREIGN HALL','/hall.html'],['city','THE CITY','/city.html'],['elements','THE ELEMENTS','/elements.html'],['ledger','ASSET LEDGER','/ledger.html']]},
    {key:'vault',   icon:'\u03A9', label:'VAULT',    href:'/vault.html',    col:'#C9A84C',
     sub:[['vault','SOVEREIGN VAULT','/vault.html'],['treasury','RESERVE','/vault.html#reserve'],
          ['wallet','WALLET','/vault.html#wallet'],['blockchain','BLOCKCHAIN','/blockchain.html'],
          ['payments','PAYMENTS','/subscriptions.html#payments'],['subscriptions','SUBSCRIPTIONS','/subscriptions.html'],
          ['marketplace','MARKETPLACE','/marketplace.html'],['portfolio','PORTFOLIO','/profile.html#portfolio'],
          ['income','INCOME','/income.html'],['payments','PAYMENTS','/payments.html'],['evolution','EVOLUTION','/evolution.html'],
          ['ledger','LEDGER','/ledger.html'],['sigil','SIGIL VAULT','/vault.html#nft'],['settings','SETTINGS','/settings.html'],['advertising','ADVERTISING','/advertising.html'],['sovereign-covenant','COVENANT','/sovereign-covenant.html']]},
    {key:'order',   icon:'\u22D4', label:'ORDER',    href:'/family.html',   col:'#D9B86A',
     sub:[['family','FAMILY','/family.html'],['bloodline','BLOODLINE','/family.html#bloodline'],
          ['heritage','HERITAGE','/family.html#heritage'],['hall','HALL','/hall.html'],
          ['sovereigns','SOVEREIGNS','/sovereigns.html'],['factions','FACTIONS','/factions.html'],
          ['city','OMEGA CITY','/city.html'],['beacon','BEACON','/beacon.html'],['chatbot','CONCIERGE AI','/chatbot.html'],['approvals','APPROVALS','/approvals.html'],['interface-omni','OMNI INTERFACE','/interface-omni.html']]},
    {key:'services',icon:'\u2726', label:'SERVICES', href:'/services.html',col:'#3fb27f',
     sub:[['services','ALL SERVICES','/services.html'],['consultancy','CONSULTANCY','/consultancy.html'],['contracts','COMMISSIONS','/contracts.html'],
          ['publishing','PUBLISHING','/publishing.html'],['studio','PROD STUDIO','/studio.html'],['marketing','MARKETING','/marketing.html'],
          ['news','NEWS WIRE','/news.html'],['social','SOCIAL HUB','/social.html'],
          ['events','EVENTS','/events.html'],['travel','TRAVEL','/travel.html'],
          ['health','HEALTH & WELLNESS','/health.html'],['marketplace','MARKETPLACE','/marketplace.html'],['affirmations','AFFIRMATIONS','/affirmations.html'],['body','BODY COMPOSITION','/body.html'],['breath','BREATHWORK','/breath.html'],['fasting','FASTING','/fasting.html'],['gratitude','GRATITUDE','/gratitude.html'],['habits','HABITS','/habits.html'],['journal','JOURNAL','/journal.html'],['meditate','MEDITATION','/meditate.html'],['mood','MOOD TRACKER','/mood.html'],['nutrition','NUTRITION','/nutrition.html'],['oath','OATH','/oath.html'],['physiology','PHYSIOLOGY','/physiology.html'],['rituals','RITUALS','/rituals.html'],['sleep','SLEEP','/sleep.html'],['stoic','STOIC PRACTICE','/stoic.html'],['targets','DAILY TARGETS','/targets.html'],['water','HYDRATION','/water.html'],['weekly','WEEKLY REVIEW','/weekly.html'],['workout','WORKOUT','/workout.html']]},
    {key:'intel',   icon:'\u25CF', label:'INTEL',    href:'/intelligence.html',col:'#9B6BF0',
     sub:[['research','RESEARCH','/research.html'],['prediction','ORACLE PREDICT','/prediction.html'],
          ['intelligence','INTELLIGENCE','/intelligence.html'],['automation','AUTOMATION','/automation.html'],
          ['compliance','GOVERNANCE','/compliance.html'],['graphify','GRAPHIFY AI','/graphify.html'],['graph-admin','GRAPH ADMIN','/graph-admin.html'],['graph-timeline','GRAPH TIMELINE','/graph-timeline.html'],['graph-centrality','ENTITY CENTRALITY','/graph-centrality.html'],['graph-explorer','RELATIONSHIP EXPLORER','/graph-explorer.html'],['graph-anomalies','GRAPH ANOMALIES','/graph-anomalies.html'],['graph-evidence','EVIDENCE CHAIN','/graph-evidence.html'],['grid','THE GRID','/matrix.html#grid'],['charter','CHARTER','/matrix.html#charter'],['city','THE CITY','/city.html'],['horoscope','HOROSCOPE','/horoscope.html'],['elements','ELEMENTS','/elements.html'],['ledger','ASSET LEDGER','/ledger.html'],['hall','SOVEREIGN HALL','/hall.html'],['atlas','ATLAS','/atlas.html'],['cipher','CIPHER','/cipher.html'],['codex','CODEX','/codex.html'],['mindmap','MIND MAP','/mindmap.html'],['nexus','NEXUS','/nexus.html'],['pulse','PULSE','/pulse.html'],['sigma','SIGMA PROTOCOL','/sigma.html'],['signal','SIGNAL INTEL','/signal.html']]},
    /* ── NEW SECTIONS — Full 102-page coverage ─────────────── */
    {key:'arena',  icon:'\u25CF', label:'ARENA',   href:'/sovereign-ai.html',col:'#9B6BF0',
     sub:[['sovereign-ai','AI COMMAND','/sovereign-ai.html'],['chatbot','CONCIERGE','/chatbot.html'],['analytics','ANALYTICS','/analytics.html'],
          ['agents','12 AGENTS','/agents.html'],['intelligence','INTELLIGENCE','/intelligence.html'],
          ['automation','AUTOMATION','/automation.html'],['prediction','ORACLE','/prediction.html'],
          ['research','RESEARCH','/research.html'],['queue','SOVEREIGN QUEUE','/queue.html']]},
    {key:'govern', icon:'\u2736', label:'GOVERN',  href:'/governance.html',   col:'#3fb27f',
     sub:[['council','DECISION ENGINE','/council.html'],['governance','GOVERNANCE','/governance.html'],['observatory','OBSERVATORY','/observatory.html'],
          ['enterprise','ENTERPRISE','/enterprise.html'],['compliance','COMPLIANCE','/compliance.html'],
          ['privacy','PRIVACY','/privacy.html'],['roadmap','ROADMAP','/roadmap.html'],
          ['lab','INNOVATION LAB','/lab.html'],['design-system','DESIGN SYSTEM','/design-system.html'],
          ['ecosystem','ECOSYSTEM','/ecosystem.html'],['knowledge','KNOWLEDGE GRAPH','/knowledge.html'],['maintenance','MAINTENANCE','/maintenance.html'],['ops','OPS','/ops.html']]},
    {key:'invest', icon:'\u25C6', label:'INVEST',  href:'/investment.html',   col:'#E2C86D',
     sub:[['investment','INVESTMENT','/investment.html'],['portfolio','PORTFOLIO','/portfolio.html'],
          ['revenue','REVENUE','/revenue.html'],['wallet','WALLET','/wallet.html'],
          ['income','INCOME','/income.html'],['payments','PAYMENTS','/payments.html'],['treasury','TREASURY','/treasury.html'],
          ['blockchain','BLOCKCHAIN','/blockchain.html'],['budget','BUDGET','/budget.html'],['expenses','EXPENSES','/expenses.html'],['wealth','WEALTH','/wealth.html']]},
    {key:'achieve',icon:'\u265A', label:'ACHIEVE', href:'/achievements.html', col:'#C9A84C',
     sub:[['achievements','ACHIEVEMENTS','/achievements.html'],['leaderboard','LEADERBOARD','/leaderboard.html'],
          ['gates','AUTHORITY GATES','/gates.html'],['grades','GRADES','/grades.html'],
          ['levels','LEVELS','/levels.html'],['phases','PHASES','/phases.html'],
          ['ascension','ASCENSION','/ascension.html'],['kings','KINGS LATTICE','/kings.html'],
          ['triads','TRIADS','/triads.html'],['grid','LATTICE GRID','/grid.html'],['awards','AWARDS','/awards.html'],['hercules','HERCULES LABORS','/hercules.html']]},
    {key:'archive',icon:'\u2735', label:'ARCHIVE', href:'/heritage.html',     col:'#3fb27f',
     sub:[['heritage','HERITAGE','/heritage.html'],['bloodline','BLOODLINE','/bloodline.html'],
          ['character','CHARACTER','/character.html'],['identity','IDENTITY','/identity.html'],
          ['passport','PASSPORT','/passport.html'],['kyc','KYC','/kyc.html'],
          ['credentials','CREDENTIALS','/credentials.html'],['charter','CHARTER','/charter.html'],
          ['sigil','SIGIL','/sigil.html'],['membership','MEMBERSHIP','/membership.html']]},
    {key:'media',  icon:'\u25B6', label:'MEDIA',   href:'/cinema.html',       col:'#9B6BF0',
     sub:[['cinema','CINEMA','/cinema.html'],['series','SERIES','/series.html'],
          ['trailers','TRAILERS','/trailers.html'],['universe','UNIVERSE','/universe.html'],
          ['feed','ACTIVITY FEED','/feed.html'],['social','SOCIAL','/social.html'],
          ['news','NEWS INTEL','/news.html'],['events','EVENTS','/events.html'],['publications','PUBLICATIONS','/publications.html']]},
  ];

  /* INJECT CSS */
  if(!document.getElementById('omega-nav-css')){
    var s=document.createElement('style'); s.id='omega-nav-css';
    s.textContent=[
      /* Immediate layout fix before JS runs. overflow was 'visible' -- with a
         fixed height:100vh, items past the viewport had nowhere to go: not
         clipped, not scrollable, just unreachable. Sidebar items below the
         fold could never be scrolled to. Changed to overflow-y:auto so the
         dock scrolls independently of the page. */
      '#omega-side{width:80px!important;flex-shrink:0!important;height:100vh!important;position:sticky!important;top:0!important;overflow-y:auto!important;overflow-x:visible!important;z-index:200!important;background:#08080F!important;border-right:1px solid rgba(201,168,76,0.12)!important}',
      '.side{width:80px!important}',
      /* Icon dock */
      '.omega-side{width:80px;flex-shrink:0;background:#08080F;display:flex;flex-direction:column;align-items:center;padding:10px 0 14px;position:sticky;top:0;height:100vh;overflow-y:auto;overflow-x:visible;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,.35) transparent;z-index:200;border-right:1px solid rgba(201,168,76,0.12)}','.omega-side::-webkit-scrollbar{width:4px}','.omega-side::-webkit-scrollbar-thumb{background:rgba(201,168,76,.35);border-radius:2px}',
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
    h+='<span class="on-lbl" data-i18n="nav_sec_'+sec.key+'">'+sec.label+'</span>';
    /* Tooltip */
    h+='<div class="on-tip"><div class="tip-head" data-i18n="nav_sec_'+sec.key+'" style="color:'+sec.col+'">'+sec.label+'</div>';
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
    /* Reuse the shared client so signOut acts on the SAME GoTrueClient that
       holds the session. A fresh client here signs out a different instance
       under the same storage key -- the exact concurrent-use case Supabase
       warns about. Falls back to a one-off module if the singleton is absent. */
    if(window.OmegaSB){
      window.OmegaSB.get().then(function(sb){
        return sb.auth.signOut();
      }).then(function(){ location.href='/account.html'; })
        .catch(function(){ location.href='/account.html'; });
      return;
    }
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
      /* padding here is what carries these to a real touch size: the drawer is
         the ONLY navigation on a phone (the desktop aside is display:none
         below 761px), and measured at 375px every one of its 82 links and 11
         section heads came out 21px tall -- under the 24px WCAG 2.5.8 floor,
         and far under 44px. The text size is left alone; only the hit area
         grows. */
      '.dss-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:5px 2px;min-height:24px;cursor:pointer;text-decoration:none}',
      '.dss-icon{font-size:18px;color:#55534e}',
      '.dss-label{font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;color:#85837b}',
      '.dss-head:hover .dss-icon,.dss-head.ds-on .dss-icon{color:#C9A84C;text-shadow:0 0 8px rgba(201,168,76,.5)}',
      '.dss-head:hover .dss-label,.dss-head.ds-on .dss-label{color:#C9A84C}',
      '.ds-links{display:flex;flex-direction:column;gap:3px;padding-left:4px}',
      '.ds-link{font-family:"Courier Prime",monospace;font-size:10px;color:#55534e;text-decoration:none;padding:9px 6px;min-height:24px;border-left:2px solid transparent;transition:all .13s;letter-spacing:1px}',
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
      {icon:'\u25B2',label:'ASCEND',href:'/honors.html#ascension',key:'ascend'},
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
       links:[['DASHBOARD','/dashboard.html'],['BEACON','/beacon.html'],['SEARCH','/search.html'],['ALERTS','/notifications.html'],['AI CONCIERGE','/chatbot.html'],['COMMAND BRIEF','/command.html']]},
      {icon:'\u25C8',label:'IDENTITY',col:'#00E5FF',href:'/profile.html',key:'identity',
       links:[['IDENTITY HUB','/profile.html'],['PROFILE','/profile.html'],['PASSPORT','/profile.html#passport'],['KYC','/profile.html#kyc'],['SETTINGS','/profile.html#settings']]},
      {icon:'\u25B2',label:'ASCEND',col:'#E86A3A',href:'/honors.html#ascension',key:'ascend',
       links:[['ASCENSION','/honors.html#ascension'],['MATRIX 104,976','/matrix.html'],['MY RECORD','/honors.html#record'],['ACADEMY','/academy.html'],['GAMING','/gaming.html'],['TROPHIES','/trophies.html']]},
      {icon:'\u2609',label:'COSMOS',col:'#9B6BF0',href:'/cosmos.html',key:'cosmos',
       links:[['COSMOS HUB','/cosmos.html'],['HOROSCOPE','/cosmos.html#horoscope'],['AI AGENTS','/agents.html'],['ELEMENTS','/elements.html'],['PANTHEONS','/pantheons.html']]},
      {icon:'\u25BA',label:'UNIVERSE',col:'#8B0000',href:'/media.html',key:'universe',
       links:[['CINEMA','/media.html'],['UNIVERSE','/media.html'],['MEDIA HUB','/media.html']]},
      {icon:'\u03A9',label:'VAULT',col:'#C9A84C',href:'/vault.html',key:'vault',
       links:[['SOVEREIGN VAULT','/vault.html'],['WALLET','/vault.html#wallet'],['SUBSCRIPTIONS','/subscriptions.html'],['BLOCKCHAIN','/blockchain.html'],['MARKETPLACE','/marketplace.html'],['PORTFOLIO','/profile.html#portfolio']]},
      {icon:'\u22D4',label:'ORDER',col:'#D9B86A',href:'/family.html',key:'order',
       links:[['FAMILY','/family.html'],['BLOODLINE','/family.html#bloodline'],['HERITAGE','/family.html#heritage'],['HALL','/hall.html'],['OMEGA CITY','/city.html']]},
      {icon:'\u2726',label:'SERVICES',col:'#3fb27f',href:'/services.html',key:'services',
       links:[['ALL SERVICES','/services.html'],['CONSULTANCY','/consultancy.html'],['PUBLISHING','/publishing.html'],['NEWS','/news.html'],['SOCIAL HUB','/social.html']]},
      {icon:'\u25CF',label:'INTEL',col:'#9B6BF0',href:'/intelligence.html',key:'intel',
       links:[['INTELLIGENCE','/intelligence.html'],['RESEARCH','/research.html'],['PREDICTION','/prediction.html'],['AUTOMATION','/automation.html'],['COMPLIANCE','/compliance.html']]},
      {icon:'\u25CF',label:'ARENA',col:'#9B6BF0',href:'/sovereign-ai.html',key:'arena',
       links:[['AI COMMAND','/sovereign-ai.html'],['ANALYTICS','/analytics.html'],['12 AGENTS','/agents.html'],['AUTOMATION','/automation.html'],['ORACLE PREDICT','/prediction.html'],['SOVEREIGN QUEUE','/queue.html']]},
      {icon:'\u2736',label:'GOVERN',col:'#3fb27f',href:'/governance.html',key:'govern',
       links:[['GOVERNANCE','/governance.html'],['OBSERVATORY','/observatory.html'],['COMPLIANCE','/compliance.html'],['PRIVACY','/privacy.html'],['ROADMAP','/roadmap.html'],['MAINTENANCE','/maintenance.html']]},
      {icon:'\u25C6',label:'INVEST',col:'#E2C86D',href:'/investment.html',key:'invest',
       links:[['INVESTMENT','/investment.html'],['PORTFOLIO','/portfolio.html'],['WEALTH','/wealth.html'],['BUDGET','/budget.html'],['WALLET','/wallet.html'],['TREASURY','/treasury.html']]},
      {icon:'\u265A',label:'ACHIEVE',col:'#C9A84C',href:'/achievements.html',key:'achieve',
       links:[['ACHIEVEMENTS','/achievements.html'],['LEADERBOARD','/leaderboard.html'],['AWARDS','/awards.html'],['GATES','/gates.html'],['LEVELS','/levels.html'],['TRIADS','/triads.html']]},
      {icon:'\u2735',label:'ARCHIVE',col:'#3fb27f',href:'/heritage.html',key:'archive',
       links:[['HERITAGE','/heritage.html'],['BLOODLINE','/bloodline.html'],['CHARACTER','/character.html'],['PASSPORT','/passport.html'],['CREDENTIALS','/credentials.html'],['MEMBERSHIP','/membership.html']]},
      {icon:'\u25B6',label:'MEDIA',col:'#9B6BF0',href:'/cinema.html',key:'media',
       links:[['CINEMA','/cinema.html'],['SERIES','/series.html'],['TRAILERS','/trailers.html'],['ACTIVITY FEED','/feed.html'],['NEWS INTEL','/news.html'],['PUBLICATIONS','/publications.html']]},
    ];

    var drawer=document.createElement('div');drawer.id='omega-drawer';
    var dh=document.createElement('div');dh.className='drawer-header';
    dh.innerHTML='<div class="dh-title">&#937; SYD OMEGA 91717</div><div class="dh-close" id="drawer-close">CLOSE &#x2715;</div>';
    drawer.appendChild(dh);
    var dsgrid=document.createElement('div');dsgrid.className='drawer-sections';
    DRAWER_SECTIONS.forEach(function(sec){
      var ds=document.createElement('div');ds.className='ds-section';
      var head=document.createElement('a');head.className='dss-head'+(sec.key===activeSection?' ds-on':'');head.href=sec.href;
      head.innerHTML='<span class="dss-icon" style="color:'+(sec.key===activeSection?sec.col:'')+'">'+sec.icon+'</span><span class="dss-label" data-i18n="nav_sec_'+sec.key+'" style="color:'+(sec.key===activeSection?sec.col:'')+'">'+sec.label+'</span>';
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
