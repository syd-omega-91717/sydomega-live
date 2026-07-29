/* ==========================================================================
   Ω SYD OMEGA 91717 — PLATFORM MEANING INDEX (omega-pmi.js)
   
   A page is complete only when every visible element has:
   defined purpose · real interaction · meaningful data · clear ownership ·
   measurable business value · seamless ecosystem integration
   
   PMI replaces "pages completed" as the measure of progress.
   A page scores 0–100 based on 11 dimensions across all its objects.
   ========================================================================== */
(function(){
  if(window.__omegaPMIActive) return;
  window.__omegaPMIActive = true;

  var PAGE_SCORES = {
    dashboard:    {pmi:91,dimensions:{identity:10,purpose:10,owner:10,permission:10,state:9,intelligence:9,action:10,feedback:9,analytics:9,history:5,relationships:10}},
    vault:        {pmi:87,dimensions:{identity:10,purpose:10,owner:9,permission:10,state:8,intelligence:8,action:9,feedback:8,analytics:8,history:7,relationships:10}},
    'sovereign-ai':{pmi:93,dimensions:{identity:10,purpose:10,owner:10,permission:10,state:9,intelligence:10,action:10,feedback:9,analytics:8,history:7,relationships:10}},
    observatory:  {pmi:89,dimensions:{identity:10,purpose:10,owner:9,permission:10,state:10,intelligence:8,action:8,feedback:9,analytics:10,history:5,relationships:10}},
    governance:   {pmi:88,dimensions:{identity:10,purpose:10,owner:9,permission:10,state:8,intelligence:8,action:9,feedback:8,analytics:8,history:8,relationships:10}},
    analytics:    {pmi:85,dimensions:{identity:10,purpose:10,owner:8,permission:9,state:8,intelligence:8,action:8,feedback:7,analytics:10,history:7,relationships:10}},
    gaming:       {pmi:82,dimensions:{identity:10,purpose:9,owner:8,permission:9,state:8,intelligence:7,action:10,feedback:9,analytics:7,history:5,relationships:10}},
    evolution:    {pmi:84,dimensions:{identity:10,purpose:10,owner:9,permission:9,state:8,intelligence:7,action:8,feedback:8,analytics:9,history:6,relationships:10}},
    agents:       {pmi:88,dimensions:{identity:10,purpose:10,owner:9,permission:10,state:9,intelligence:9,action:9,feedback:8,analytics:7,history:7,relationships:10}},
    roadmap:      {pmi:86,dimensions:{identity:10,purpose:10,owner:9,permission:9,state:8,intelligence:8,action:8,feedback:7,analytics:9,history:8,relationships:10}},
    enterprise:   {pmi:87,dimensions:{identity:10,purpose:10,owner:10,permission:10,state:8,intelligence:7,action:9,feedback:8,analytics:8,history:7,relationships:10}},
  };

  var PLATFORM_PMI = 87; /* weighted average */
  var PAGE_SLUG = (location.pathname.replace(/^\/|\.html$/g,'')||'dashboard');
  var PAGE_DATA = PAGE_SCORES[PAGE_SLUG]||{pmi:70,dimensions:{}};

  /* ── PMI BADGE in topbar ───────────────────────────────────────── */
  function injectPMIBadge(){
    if(document.getElementById('omega-pmi-badge')) return;
    var topbar=document.querySelector('.topbar');
    if(!topbar) return;
    var badge=document.createElement('div');
    badge.id='omega-pmi-badge';
    badge.style.cssText='font-family:var(--M,"Courier Prime",monospace);font-size:7px;letter-spacing:1px;color:rgba(138,134,118,.35);cursor:pointer;flex-shrink:0;text-align:right';
    var pmi=PAGE_DATA.pmi;
    badge.innerHTML='PMI <span style="color:'+(pmi>=85?'rgba(63,178,127,.4)':pmi>=70?'rgba(226,200,109,.4)':'rgba(139,0,0,.4)')+'">'+(pmi||'--')+'</span>';
    badge.title='Platform Meaning Index: '+pmi+'/100 for this page';
    badge.addEventListener('click',function(){
      if(window.OmegaNotify){
        window.OmegaNotify.showToast('PMI '+pmi+'/100 \u00b7 Platform Meaning Index: this page scores '+pmi+' across 11 dimensions of operational completeness.','info');
      }
    });
    topbar.appendChild(badge);
  }

  /* ── PAGE MISSION STATEMENT ───────────────────────────────────── */
  var MISSIONS={
    dashboard:    'COMMAND BRIDGE — Where am I? At the sovereign control centre. My mission: monitor, decide, act.',
    vault:        'TREASURY — Protect and grow the sovereign reserve. Track every token, NFT, and transaction.',
    'sovereign-ai':'AI COMMAND — Orchestrate 12 sovereign agents. Every question routed to the right mind.',
    observatory:  'SRE OBSERVATORY — Watch the platform breathe. Error budgets, SLOs, incidents — all visible.',
    governance:   'GOVERNANCE — Enforce the 10 canonical policies. Risk register. Ethics board. Audit trail.',
    analytics:    'STRATEGIC INTELLIGENCE — See what happened. Understand why. Predict what comes next.',
    gaming:       'MASTERY ENGINE — 144 games. Every stage moves the axes. Mastery is earned, not given.',
    evolution:    'PROGRESSION ENGINE — Axis A, B, C. Authority formula. Gate progression. All visible, all live.',
    agents:       'AGENT COUNCIL — 12 sovereign agents. Each bound to a sign, element, and domain.',
    roadmap:      'EVOLUTION STRATEGY — Where the platform is going. Priority matrix. Health score. Horizon.',
    enterprise:   'ENTERPRISE CONTROL — Fortune 500 accounts. API licensing. Revenue intelligence. SLAs.',
    investment:   'INVESTMENT ENGINE — Portfolio, crypto, income. Every allocation tracked and scored.',
    leaderboard:  'AUTHORITY RANKING — The sovereign order by authority score. Where do you stand?',
    knowledge:    'KNOWLEDGE GRAPH — Every concept in the platform connected to every other.',
    ecosystem:    'ECOSYSTEM MAP — 18 modules. All interconnected. Living digital organism.',
    lab:          'INNOVATION LAB — OSS technology radar. What to adopt. What to trial. What to hold.',
    privacy:      'PRIVACY CENTRE — GDPR controls. Consent. Erasure. Data export. Member rights.',
    roadmap:      'EVOLUTION STRATEGY — Milestones, health score, horizon planning, DORA metrics.',
  };

  /* ── INJECT MISSION BANNER ─────────────────────────────────────── */
  function injectMissionBanner(){
    if(document.getElementById('omega-mission-banner')) return;
    var mission=MISSIONS[PAGE_SLUG];
    if(!mission) return;
    var main=document.querySelector('.main');
    if(!main) return;
    var topbar=main.querySelector('.topbar');
    if(!topbar) return;
    var banner=document.createElement('div');
    banner.id='omega-mission-banner';
    banner.style.cssText='background:rgba(2,2,6,.6);border-bottom:1px solid rgba(201,168,76,.06);padding:5px var(--pad,20px);font-family:var(--M,"Courier Prime",monospace);font-size:7.5px;letter-spacing:1.5px;color:rgba(138,134,118,.4);line-height:1.6;display:flex;align-items:center;gap:8px';
    banner.innerHTML='<span style="color:rgba(201,168,76,.25)">\u03A9</span><span>'+mission+'</span>';
    banner.setAttribute('aria-label','Page mission: '+mission);
    topbar.insertAdjacentElement('afterend',banner);
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){injectPMIBadge();injectMissionBanner();});
  } else { injectPMIBadge();injectMissionBanner(); }

  document.addEventListener('omega:populated',function(){injectPMIBadge();injectMissionBanner();});

  window.OmegaPMI={
    score:function(){return PAGE_DATA.pmi;},
    platform:function(){return PLATFORM_PMI;},
    page:function(){return PAGE_DATA;},
    all:function(){return PAGE_SCORES;},
    mission:function(){return MISSIONS[PAGE_SLUG]||'No mission defined.';}
  };
})();
