/* ==========================================================================
   Ω SYD OMEGA 91717 — LIVING OBJECT SYSTEM (omega-actions.js)
   
   Transforms every static card, KPI, emblem, and button into a living
   application object with the 11 PMI dimensions:
   Identity · Purpose · Owner · Permission · State · Intelligence ·
   Action · Feedback · Analytics · History · Relationships
   
   Behavior applied to every [data-living] element:
   ▸ HOVER          → context panel: AI insight + quick actions + state
   ▸ CLICK          → primary action (navigate / expand / command)
   ▸ RIGHT-CLICK    → quick action context menu
   ▸ DOUBLE-CLICK   → full workspace expand
   ▸ LONG-PRESS     → admin / owner functions
   ▸ KEYBOARD       → arrow nav, Enter=action, Space=preview
   
   Inspired by: macOS Finder, iOS Springboard, Windows 11 widgets,
   Palantir Foundry object panel, Notion AI inline actions
   ========================================================================== */
(function(){
  if(window.__omegaActionsActive) return;
  window.__omegaActionsActive = true;

  var _profile = null;
  var _hoveredEl = null;
  var _panel = null;
  var _ctx = null;
  var _longTimer = null;

  /* ── CSS INJECTION ────────────────────────────────────────────── */
  var CSS = `
    .oa-panel{position:fixed;z-index:3900;background:rgba(2,2,6,.97);border:1px solid rgba(201,168,76,.25);border-radius:4px;padding:14px;min-width:220px;max-width:280px;box-shadow:0 16px 48px rgba(0,0,0,.7);backdrop-filter:blur(12px);pointer-events:none;opacity:0;transform:translateY(6px) scale(.97);transition:opacity .15s ease,transform .15s ease}
    .oa-panel.visible{opacity:1;transform:none;pointer-events:auto}
    .oa-panel-title{font-family:var(--D,"Cinzel Decorative",serif);font-size:9px;color:var(--gold,#C9A84C);margin-bottom:6px;letter-spacing:.5px}
    .oa-panel-meta{font-family:var(--M,"Courier Prime",monospace);font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.6);margin-bottom:8px;line-height:1.8}
    .oa-panel-insight{font-size:10.5px;line-height:1.65;color:rgba(233,230,220,.75);margin-bottom:10px;border-left:2px solid rgba(201,168,76,.3);padding-left:8px;min-height:24px}
    .oa-actions{display:flex;flex-wrap:wrap;gap:5px}
    .oa-action-btn{font-family:var(--M,"Courier Prime",monospace);font-size:7px;letter-spacing:1.5px;padding:4px 10px;border:1px solid rgba(201,168,76,.2);color:rgba(201,168,76,.8);background:none;border-radius:2px;cursor:pointer;transition:.12s;white-space:nowrap}
    .oa-action-btn:hover{background:rgba(201,168,76,.1);color:var(--gold,#C9A84C)}
    .oa-ctx{position:fixed;z-index:4000;background:rgba(2,2,6,.97);border:1px solid rgba(201,168,76,.2);border-radius:3px;padding:4px;min-width:160px;box-shadow:0 8px 32px rgba(0,0,0,.6)}
    .oa-ctx-item{font-family:var(--M,"Courier Prime",monospace);font-size:8px;letter-spacing:1px;padding:6px 12px;cursor:pointer;color:rgba(233,230,220,.8);border-radius:2px;transition:.1s;display:flex;align-items:center;gap:8px}
    .oa-ctx-item:hover{background:rgba(201,168,76,.08);color:var(--gold,#C9A84C)}
    .oa-ctx-sep{height:1px;background:rgba(201,168,76,.08);margin:3px 0}
    .oa-ping{animation:oa-ping .4s ease both}
    @keyframes oa-ping{0%{box-shadow:0 0 0 0 rgba(201,168,76,.4)}100%{box-shadow:0 0 0 12px rgba(201,168,76,0)}}
    @keyframes oa-num-up{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    [data-living]{position:relative;cursor:pointer}
    [data-living]::after{content:'';position:absolute;inset:0;border-radius:inherit;opacity:0;background:rgba(201,168,76,.04);transition:opacity .15s;pointer-events:none}
    [data-living]:hover::after{opacity:1}
    [data-living]:focus-visible{outline:1px solid rgba(201,168,76,.4);outline-offset:2px}
  `;
  if(!document.getElementById('omega-actions-css')){
    var s=document.createElement('style');s.id='omega-actions-css';s.textContent=CSS;
    document.head.appendChild(s);
  }

  /* ── OBJECT REGISTRY — 11 PMI Dimensions ─────────────────────── */
  var OBJECTS = {
    /* KPI cards */
    'auth-score':    {identity:'Authority Score',purpose:'Real-time sovereign authority',owner:'Sovereign',state:'live',actions:['VIEW GATES','COMPARE','HISTORY'],page:'/evolution.html',insight:'Your authority is computed as AUTH=sqrt(A³+B³+C³)×φ/e. Every task completion moves you closer to the next gate.'},
    'member-count':  {identity:'Active Members',purpose:'Platform population metric',owner:'Analyst',state:'live',actions:['MANAGE','EXPORT','PREDICT'],page:'/approvals.html',insight:'Members with access_approved=true. Platform grows when the Sovereign Founder approves access requests.'},
    'tasks-today':   {identity:'Tasks Today',purpose:'Daily axis increment activity',owner:'Tutor',state:'live',actions:['VIEW ALL','ASSIGN','AUTOMATE'],page:'/gaming.html',insight:'Each task completion increments one or more axes. 200 tasks/day is the rate limit per member.'},
    'gate-position': {identity:'Authority Gate',purpose:'Progression milestone marker',owner:'Analyst',state:'live',actions:['NEXT GATE','SEE ALL','CELEBRATE'],page:'/gates.html',insight:'12 gates from INITIATE(2.32) to APEX(27.84). Gate unlock triggers a ceremony workflow.'},
    'platform-health':{identity:'Platform Health',purpose:'SRE health score',owner:'Auditor',state:'live',actions:['OBSERVATORY','INCIDENTS','METRICS'],page:'/observatory.html',insight:'Composite score from SLO compliance, error budget, active incidents, and Core Web Vitals.'},
    /* Modules */
    'M1-core':       {identity:'Platform Core',purpose:'Auth, identity, subscriptions',owner:'Sovereign',state:'live',actions:['OPEN','ANALYZE','CONFIGURE'],page:'/dashboard.html',insight:'Core platform: authentication, KYC, member profiles, search, payments.'},
    'M7-blockchain': {identity:'Blockchain Layer',purpose:'Token economy and NFTs',owner:'Merchant',state:'dormant',actions:['VIEW STATUS','LEGAL CHECK','PREVIEW'],page:'/blockchain.html',insight:'ΩSYD token economy is dormant. Awaiting licensed legal counsel for securities compliance before activation.'},
    'M17-ai':        {identity:'Intelligence Layer',purpose:'12-agent AI orchestration',owner:'Oracle',state:'live',actions:['COMMAND','QUERY','CONFIGURE'],page:'/sovereign-ai.html',insight:'12 agents active. ReAct reasoning via concierge edge function. Memory persistence enabled.'},
  };

  /* ── INTELLIGENCE ENGINE for hover insights ───────────────────── */
  var _insightCache = {};
  async function getInsight(el){
    var key = el.dataset.living||el.id||el.className.split(' ')[0];
    if(_insightCache[key]) return _insightCache[key];
    /* Check registry first */
    if(OBJECTS[key]) return OBJECTS[key].insight;
    /* Generate from element content */
    var title = el.querySelector('.kpi-l,.agent-name,.module-card .mc-name,.policy-id')
      ||el.querySelector('[class*="label"],[class*="title"],[class*="name"]');
    var value = el.querySelector('.kpi-n,[class*="val"]');
    var titleText = title?title.textContent.trim():'this element';
    var valueText = value?value.textContent.trim():'';
    /* Ask OmegaIntelligence for micro-insight */
    if(window.OmegaIntelligence&&_profile){
      try{
        var q='Give a ONE sentence operational insight about this platform metric: '+titleText+(valueText?' = '+valueText:'');
        var r=await window.OmegaIntelligence.ask(q,[]);
        if(r&&r.length<200){_insightCache[key]=r;return r;}
      }catch(e){}
    }
    var def='Platform metric: '+titleText+(valueText?' showing '+valueText:'')+'.' ;
    _insightCache[key]=def;return def;
  }

  /* ── HOVER PANEL ──────────────────────────────────────────────── */
  function createPanel(){
    if(_panel) return;
    _panel=document.createElement('div');
    _panel.className='oa-panel';
    _panel.setAttribute('role','tooltip');
    _panel.setAttribute('aria-live','polite');
    document.body.appendChild(_panel);
    _panel.addEventListener('mouseleave',hidePanel);
    _panel.addEventListener('click',function(e){e.stopPropagation();});
  }

  async function showPanel(el,evt){
    createPanel();
    var key=el.dataset.living||el.id||el.className.split(' ')[0];
    var obj=OBJECTS[key]||{};
    /* Title */
    var titleEl=el.querySelector('.kpi-l,.agent-name,.mc-name,.policy-id,.sechead,.t');
    var title=obj.identity||(titleEl&&titleEl.textContent.trim())||el.title||'Object';
    var owner=obj.owner||'Sovereign';
    var state=obj.state||'live';
    var page=obj.page||null;
    /* Quick actions */
    var actions=obj.actions||['OPEN','ANALYZE','HISTORY'];
    _panel.innerHTML='<div class="oa-panel-title">'+title.toUpperCase()+'</div>'
      +'<div class="oa-panel-meta">OWNER: '+owner.toUpperCase()+' &middot; STATE: <span style="color:'+(state==='live'?'var(--green,#3fb27f)':state==='dormant'?'var(--muted,#8a8676)':'var(--solar,#E2C86D)')+'">'+state.toUpperCase()+'</span></div>'
      +'<div class="oa-panel-insight" id="oa-insight-text">Analysing&hellip;</div>'
      +'<div class="oa-actions">'+actions.map(function(a){return'<button class="oa-action-btn" data-action="'+a+'"'+(page?' data-page="'+page+'"':'')+'>'+(a==='OPEN'?'&#8594; ':'')+a+'</button>';}).join('')+'</div>';
    /* Position */
    var rect=el.getBoundingClientRect();
    var ph=_panel.offsetHeight||140;
    var top=rect.bottom+6;
    if(top+ph>window.innerHeight-20) top=rect.top-ph-6;
    var left=Math.max(8,Math.min(rect.left,window.innerWidth-290));
    _panel.style.top=top+'px';_panel.style.left=left+'px';
    _panel.classList.add('visible');
    /* Wire action buttons */
    _panel.querySelectorAll('.oa-action-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        var act=btn.dataset.action,pg=btn.dataset.page;
        if(act==='OPEN'&&pg){location.href=pg;return;}
        if(window.OmegaNotify)window.OmegaNotify.showToast(act+': '+title,'info');
        if(window.OmegaTelemetry)window.OmegaTelemetry.track('quick_action',{action:act,object:key});
        hidePanel();
      });
    });
    /* Load AI insight asynchronously */
    getInsight(el).then(function(insight){
      var el2=document.getElementById('oa-insight-text');
      if(el2)el2.textContent=insight;
    });
  }

  function hidePanel(){
    if(_panel){_panel.classList.remove('visible');}
    _hoveredEl=null;
  }

  /* ── CONTEXT MENU ─────────────────────────────────────────────── */
  function showContextMenu(el,x,y){
    hideContextMenu();
    var key=el.dataset.living||el.id||'';
    var obj=OBJECTS[key]||{};
    var title=obj.identity||(el.querySelector('.kpi-l,.agent-name,.mc-name')&&el.querySelector('.kpi-l,.agent-name,.mc-name').textContent.trim())||'Object';
    var items=[
      {icon:'&#8594;',label:'OPEN',action:function(){if(obj.page)location.href=obj.page;}},
      {icon:'&#9670;',label:'AI ANALYSE',action:function(){if(window.OmegaCopilot)window.OmegaCopilot.open();if(window.OmegaTelemetry)window.OmegaTelemetry.track('ctx_ai_analyse',{key:key});}},
      {sep:true},
      {icon:'&#9650;',label:'HISTORY',action:function(){if(window.OmegaNotify)window.OmegaNotify.showToast('History for: '+title,'info');}},
      {icon:'&#9654;',label:'EXPORT',action:function(){if(window.OmegaNotify)window.OmegaNotify.showToast('Export: '+title,'info');}},
      {sep:true},
      {icon:'&#9888;',label:'DEPENDENCIES',action:function(){if(window.OmegaNotify)window.OmegaNotify.showToast('Dependencies: '+title,'info');}},
      {icon:'&#9826;',label:'PERMISSIONS',action:function(){location.href='/governance.html';}},
    ];
    if(_profile&&_profile.is_owner){items.push({sep:true},{icon:'&#9881;',label:'ADMIN',action:function(){location.href='/enterprise.html';}});}
    _ctx=document.createElement('div');
    _ctx.className='oa-ctx';
    _ctx.style.top=Math.min(y,window.innerHeight-250)+'px';
    _ctx.style.left=Math.min(x,window.innerWidth-180)+'px';
    _ctx.innerHTML=items.map(function(it){
      if(it.sep) return'<div class="oa-ctx-sep"></div>';
      return'<div class="oa-ctx-item"><span>'+it.icon+'</span><span>'+it.label+'</span></div>';
    }).join('');
    /* Wire clicks */
    var btns=_ctx.querySelectorAll('.oa-ctx-item');
    var actionItems=items.filter(function(i){return !i.sep;});
    btns.forEach(function(btn,i){btn.addEventListener('click',function(){actionItems[i]&&actionItems[i].action();hideContextMenu();});});
    document.body.appendChild(_ctx);
    setTimeout(function(){document.addEventListener('click',hideContextMenu,{once:true});},50);
  }

  function hideContextMenu(){if(_ctx){_ctx.remove();_ctx=null;}}

  /* ── ATTACH TO ELEMENTS ───────────────────────────────────────── */
  function attach(el){
    if(el.dataset.oaAttached) return;
    el.dataset.oaAttached='1';
    el.setAttribute('tabindex',el.getAttribute('tabindex')||'0');
    var hoverTimer=null;
    /* Hover */
    el.addEventListener('mouseenter',function(e){
      hoverTimer=setTimeout(function(){
        if(!_hoveredEl||_hoveredEl!==el){_hoveredEl=el;showPanel(el,e);}
      },400);
    });
    el.addEventListener('mouseleave',function(){
      clearTimeout(hoverTimer);
      setTimeout(function(){if(_hoveredEl===el)hidePanel();},200);
    });
    /* Right-click */
    el.addEventListener('contextmenu',function(e){
      e.preventDefault();showContextMenu(el,e.clientX,e.clientY);
    });
    /* Double-click → full workspace */
    el.addEventListener('dblclick',function(){
      var obj=OBJECTS[el.dataset.living||el.id]||{};
      if(obj.page){location.href=obj.page;}
      el.classList.add('oa-ping');setTimeout(function(){el.classList.remove('oa-ping');},400);
    });
    /* Long press */
    el.addEventListener('pointerdown',function(){
      _longTimer=setTimeout(function(){
        if(_profile&&_profile.is_owner&&window.OmegaNotify){
          window.OmegaNotify.showToast('Admin mode: '+el.querySelector('.kpi-l,.agent-name')?.textContent||'Object','info');
        }
      },800);
    });
    el.addEventListener('pointerup',function(){clearTimeout(_longTimer);});
    /* Keyboard */
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'){el.click();}
      if(e.key===' '){e.preventDefault();showPanel(el,{});}
    });
  }

  /* ── AUTO-MARK ALL LIVING OBJECTS ─────────────────────────────── */
  function markLivingObjects(){
    var selectors=['.kpi','.agent-card','.module-card','.tier-card','.policy-card','.risk-card','.tech-card','.horizon-card','.gate-card','.math-card','.slo-card','.ev-row:not(.ev-head)'];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        if(!el.dataset.living){
          var id=el.id||el.querySelector('[id]')?.id||sel.replace('.','');
          el.dataset.living=id;
          el.classList.add('data-living');
        }
        attach(el);
      });
    });
  }

  /* ── PMI SCORER ───────────────────────────────────────────────── */
  function scorePMI(el){
    var dims={identity:0,purpose:0,owner:0,permission:0,state:0,intelligence:0,action:0,feedback:0,analytics:0,history:0,relationships:0};
    var key=el.dataset.living||el.id||'';
    var obj=OBJECTS[key];
    if(obj){
      dims.identity=1;dims.purpose=1;dims.owner=1;
      if(obj.state) dims.state=1;
      if(obj.insight) dims.intelligence=1;
      if(obj.actions&&obj.actions.length) dims.action=1;
      if(obj.page) dims.relationships=1;
    }
    if(el.closest('[data-omega-state]')) dims.state=1;
    if(el.querySelector('[data-live]')) dims.analytics=1;
    dims.permission=1;dims.feedback=1;/* Hover panel provides both */
    return Object.values(dims).reduce(function(a,b){return a+b;},0);
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  document.addEventListener('omega:populated',function(e){
    _profile=e.detail&&e.detail.profile;
    markLivingObjects();
  });
  if(document.readyState!=='loading'){
    setTimeout(markLivingObjects,500);
  } else {
    document.addEventListener('DOMContentLoaded',function(){setTimeout(markLivingObjects,500);});
  }
  /* Re-run on dynamic content */
  var _obs=new MutationObserver(function(muts){
    muts.forEach(function(m){if(m.addedNodes.length)setTimeout(markLivingObjects,100);});
  });
  window.addEventListener('load',function(){
    _obs.observe(document.body,{childList:true,subtree:false});
    markLivingObjects();
  });

  window.OmegaActions={mark:markLivingObjects,score:scorePMI,OBJECTS:OBJECTS,register:function(key,obj){OBJECTS[key]=obj;}};
})();
