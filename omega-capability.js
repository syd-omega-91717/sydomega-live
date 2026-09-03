/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN CAPABILITY ENGINE (omega-capability.js)
   
   Transforms every page from a static interface into a self-contained
   production business capability with owner, KPIs, SLOs, dependencies,
   lifecycle, threat model, and retirement policy.
   
   Architecture principle: "The platform is not built from pages.
   It is built from capabilities. Pages are only views of capabilities."
   
   Every capability registers itself with:
   A. IDENTITY    — id, name, domain, owner agent, version
   B. PURPOSE     — business objective, user objective, KPIs
   C. SLO         — target latency, error rate, availability
   D. DEPENDENCIES — what other capabilities it needs
   E. LIFECYCLE   — status: proposal→design→beta→live→deprecated
   F. HEALTH      — real-time status: healthy/degraded/down
   G. EVENTS      — what events it publishes and subscribes to
   ========================================================================== */
(function(){
  if(window.__omegaCapabilityActive) return;
  window.__omegaCapabilityActive = true;

  /* ── CAPABILITY REGISTRY ──────────────────────────────────────── */
  var REGISTRY = {};
  var _currentCap = null;

  /* ── CAPABILITY DEFINITIONS ───────────────────────────────────── */
  /* Auto-detected from data-page attribute or URL */
  var CAP_DEFS = {
    'dashboard':    {cap:'COMMAND_INTELLIGENCE',  domain:'Operations',  owner:'Sovereign',  kpis:['active_members','tasks_today','platform_health'],  slo:{p95:500,  avail:99.9}},
    'vault':        {cap:'TREASURY_RESERVE',      domain:'Finance',     owner:'Merchant',   kpis:['balance','transactions','nft_count'],              slo:{p95:800,  avail:99.9}},
    'gaming':       {cap:'MASTERY_ENGINE',        domain:'Education',   owner:'Tutor',      kpis:['games_completed','axis_b_delta','pass_rate'],      slo:{p95:600,  avail:99.5}},
    'chatbot':      {cap:'AI_CONCIERGE',          domain:'Intelligence',owner:'Oracle',     kpis:['queries_per_day','fallback_rate','quality_score'], slo:{p95:2000, avail:99.0}},
    'analytics':    {cap:'INTELLIGENCE_ANALYTICS',domain:'Data',        owner:'Analyst',    kpis:['charts_loaded','data_freshness'],                  slo:{p95:1000, avail:99.5}},
    'observatory':  {cap:'SRE_OBSERVATORY',       domain:'Operations',  owner:'Auditor',    kpis:['error_budget','slo_compliance','incidents_open'],  slo:{p95:400,  avail:99.9}},
    'governance':   {cap:'GOVERNANCE_BOARD',      domain:'Compliance',  owner:'Auditor',    kpis:['open_risks','policy_compliance','ethics_score'],   slo:{p95:600,  avail:99.5}},
    'enterprise':   {cap:'ENTERPRISE_CONTROL',    domain:'Business',    owner:'Sovereign',  kpis:['active_accounts','mrr','seats_utilised'],          slo:{p95:800,  avail:99.9}},
    'sovereign-ai': {cap:'AGENT_COMMAND',         domain:'AI',          owner:'Oracle',     kpis:['agents_active','queries_routed','tool_calls'],     slo:{p95:2500, avail:99.0}},
    'leaderboard':  {cap:'AUTHORITY_RANKING',     domain:'Progression', owner:'Analyst',    kpis:['members_ranked','snapshot_freshness'],             slo:{p95:600,  avail:99.5}},
    'knowledge':    {cap:'KNOWLEDGE_GRAPH',       domain:'Intelligence',owner:'Historian',  kpis:['nodes_explored','edges_traversed'],               slo:{p95:500,  avail:99.5}},
    'roadmap':      {cap:'EVOLUTION_STRATEGY',    domain:'Strategy',    owner:'Sovereign',  kpis:['milestones_on_track','health_score'],              slo:{p95:400,  avail:99.9}},
    'investment':   {cap:'INVESTMENT_ENGINE',     domain:'Finance',     owner:'Analyst',    kpis:['portfolio_value','allocation_score'],              slo:{p95:800,  avail:99.5}},
    'privacy':      {cap:'PRIVACY_CENTRE',        domain:'Compliance',  owner:'Auditor',    kpis:['consent_rate','pending_erasures'],                 slo:{p95:500,  avail:99.9}},
    'ecosystem':    {cap:'ECOSYSTEM_MAP',         domain:'Architecture',owner:'Sovereign',  kpis:['modules_healthy','connectivity_score'],            slo:{p95:400,  avail:99.9}},
    'lab':          {cap:'INNOVATION_LAB',        domain:'Research',    owner:'Historian',  kpis:['oss_adopted','experiments_running'],               slo:{p95:400,  avail:99.5}},
    'feed':         {cap:'ACTIVITY_STREAM',       domain:'Social',      owner:'Beacon',     kpis:['posts_today','engagement_rate'],                   slo:{p95:600,  avail:99.5}},
    'profile':      {cap:'MEMBER_IDENTITY',       domain:'Identity',    owner:'Sentinel',   kpis:['profile_completeness','kyc_status'],               slo:{p95:600,  avail:99.9}},
    'achievements': {cap:'ACHIEVEMENT_SYSTEM',    domain:'Progression', owner:'Tutor',      kpis:['gates_reached','trophies_earned'],                 slo:{p95:500,  avail:99.5}},
    'compliance':   {cap:'COMPLIANCE_ENGINE',     domain:'Compliance',  owner:'Auditor',    kpis:['policies_active','violations_open'],               slo:{p95:500,  avail:99.9}},
    'intelligence': {cap:'AI_INTELLIGENCE',       domain:'AI',          owner:'Oracle',     kpis:['models_active','inference_latency'],              slo:{p95:1500, avail:99.0}},
    'automation':   {cap:'AUTOMATION_ENGINE',     domain:'Operations',  owner:'Proxy',      kpis:['workflows_run','success_rate'],                    slo:{p95:300,  avail:99.5}},
    'heritage':     {cap:'HERITAGE_ARCHIVE',      domain:'Legacy',      owner:'Historian',  kpis:['records_count','lineage_depth'],                   slo:{p95:600,  avail:99.5}},
    'predictions':  {cap:'ORACLE_INTELLIGENCE',   domain:'AI',          owner:'Oracle',     kpis:['models_running','accuracy_score'],                 slo:{p95:2000, avail:99.0}},
  };

  /* ── REGISTER CAPABILITY ──────────────────────────────────────── */
  function register(pageId, overrides){
    var def = CAP_DEFS[pageId] || {};
    var cap = Object.assign({
      id: pageId,
      cap: 'UNKNOWN_CAPABILITY',
      domain: 'Platform',
      owner: 'Sovereign',
      kpis: [],
      slo: {p95: 1000, avail: 99.0},
      lifecycle: 'live',
      health: 'healthy',
      registered_at: Date.now(),
      page: location.pathname,
      version: '1.0'
    }, def, overrides||{});
    REGISTRY[pageId] = cap;
    _currentCap = cap;
    /* Emit to OmegaOS event bus */
    if(window.OmegaOS) window.OmegaOS.events.emit('capability:registered', cap);
    /* Emit to telemetry */
    if(window.OmegaTelemetry) window.OmegaTelemetry.track('capability_loaded', {cap:cap.cap, domain:cap.domain});
    return cap;
  }

  /* ── SLO MONITORING ───────────────────────────────────────────── */
  function checkSLO(capId, actualP95Ms){
    var cap = REGISTRY[capId];
    if(!cap) return null;
    var target = cap.slo.p95;
    var breach = actualP95Ms > target;
    if(breach){
      if(window.OmegaOS) window.OmegaOS.events.emit('capability:slo_breach', {cap:capId,actual:actualP95Ms,target:target});
      if(window.OmegaTelemetry) window.OmegaTelemetry.track('slo_breach', {cap:capId,actual:actualP95Ms,target:target});
    }
    return {ok:!breach, actual:actualP95Ms, target:target, breach:breach};
  }

  /* ── HEALTH BADGE INJECTION ───────────────────────────────────── */
  function injectCapabilityBadge(cap){
    if(!cap||document.getElementById('omega-cap-badge')) return;
    var badge=document.createElement('div');
    badge.id='omega-cap-badge';
    badge.setAttribute('aria-label','Capability: '+cap.cap);
    badge.style.cssText='position:fixed;bottom:24px;right:80px;z-index:200;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1px;color:rgba(138,134,118,.35);cursor:pointer;text-align:right;line-height:1.6';
    /* bottom:24px with z-index 200 puts this entirely inside nav.js's 66px
       #omega-mob bar (z-index 9990), so on a phone it has always been 100%
       covered -- measured at 375px as y 655..676 against the bar's 651..700.
       Hiding it there matches what a member already sees and keeps it out of
       the bottom-chrome stack; the desktop placement is unchanged. */
    if(!document.getElementById('omega-cap-badge-css')){
      var cs=document.createElement('style');
      cs.id='omega-cap-badge-css';
      cs.textContent='@media(max-width:760px){#omega-cap-badge{display:none!important}}';
      (document.head||document.documentElement).appendChild(cs);
    }
    badge.innerHTML=cap.cap+'<br>'+cap.domain.toUpperCase()+' &middot; '+cap.owner.toUpperCase();
    badge.title='Capability: '+cap.cap+' | Domain: '+cap.domain+' | Owner: '+cap.owner+' | SLO: p95<'+cap.slo.p95+'ms | Avail: '+cap.slo.avail+'%';
    badge.addEventListener('click',function(){
      if(window.OmegaNotify)window.OmegaNotify.showToast(cap.cap+' \u00b7 '+cap.domain+' \u00b7 SLO p95<'+cap.slo.p95+'ms','info');
    });
    document.body.appendChild(badge);
  }

  /* ── AUTO-DETECT PAGE AND REGISTER ───────────────────────────── */
  function autoRegister(){
    var sideEl=document.getElementById('omega-side');
    var pageId=sideEl?sideEl.getAttribute('data-page'):null;
    if(!pageId) pageId=location.pathname.replace(/^\/|\.html$/g,'')||'dashboard';
    var cap=register(pageId);
    /* Measure actual load time for SLO check */
    if(window.performance&&window.OmegaOS){
      setTimeout(function(){
        var nav=performance.getEntriesByType('navigation')[0];
        if(nav){
          var loadTime=Math.round(nav.loadEventEnd);
          checkSLO(pageId,loadTime);
          window.OmegaOS.health.record('capability_load_ms',loadTime);
        }
      },2000);
    }
    injectCapabilityBadge(cap);
    return cap;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',autoRegister);
  } else { autoRegister(); }

  /* ── DATA PRODUCT METADATA ────────────────────────────────────── */
  /* Every capability exposes its data products */
  window.OmegaCapability = {
    register: register,
    get: function(id){ return REGISTRY[id||(_currentCap&&_currentCap.id)]; },
    getAll: function(){ return Object.assign({},REGISTRY); },
    current: function(){ return _currentCap; },
    checkSLO: checkSLO,
    CAP_DEFS: CAP_DEFS,
    /* Data product descriptor — every dataset is a managed product */
    dataProduct: function(id, opts){
      return Object.assign({
        id:id,
        owner:(_currentCap&&_currentCap.owner)||'Sovereign',
        quality_slo:99.0,
        freshness_minutes:5,
        consumers:[],
        lineage:[],
        sensitivity:'internal',
        retention_days:365
      }, opts||{});
    }
  };
})();
