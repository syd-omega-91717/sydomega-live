/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN SEARCH ENGINE
   Ctrl+K opens overlay. Searches all 97 pages, tracks, elements, Olympians, canon.
   ========================================================================== */
(function(){
  if(window.__omegaSearchActive) return;
  window.__omegaSearchActive=true;
  var CAT_COLORS={PAGE:'var(--gold,#C9A84C)',TRACK:'var(--cyan,#00E5FF)',ELEMENT:'var(--purple,#9B6BF0)',OLYMPIAN:'var(--solar,#E2C86D)',CANON:'var(--green,#3fb27f)'};
  var INDEX=[
    /* ── CORE PAGES ─────────────────────────────────────────────────────── */
    {t:'DASHBOARD',d:'Authority axes KPIs system galaxy 5 layers AI query timeline',u:'/dashboard.html',c:'PAGE'},
    {t:'VAULT',d:'Reserve wallet NFT earning ledger articles audit ΩSYD token',u:'/vault.html',c:'PAGE'},
    {t:'GAMING UNIVERSE',d:'144 games 9 stages Axis B mastery ascension rewards',u:'/gaming.html',c:'PAGE'},
    {t:'CHATBOT AI CONCIERGE',d:'Sovereign AI chat Anthropic Claude 12 agents OmegaIntelligence',u:'/chatbot.html',c:'PAGE'},
    {t:'ANALYTICS INTELLIGENCE',d:'Charts axis radar telemetry user journeys data science ML',u:'/analytics.html',c:'PAGE'},
    {t:'LEADERBOARD',d:'Daily authority ranking percentile top sovereign members',u:'/leaderboard.html',c:'PAGE'},
    {t:'ACHIEVEMENTS',d:'12 gates trophies medals certificates progression milestones',u:'/achievements.html',c:'PAGE'},
    {t:'INTELLIGENCE AI LAYER',d:'AI logs agents reasoning models analytics nine-fold lattice',u:'/intelligence.html',c:'PAGE'},
    {t:'PROFILE IDENTITY',d:'Member identity edit zodiac element subscription credentials',u:'/profile.html',c:'PAGE'},
    {t:'COSMOS PLANETS',d:'Planet systems 12 Olympians astral mapping birth charts',u:'/cosmos.html',c:'PAGE'},
    {t:'ELEMENTS SYSTEM',d:'9 sovereign elements Fire Water Wind Metal Sand Soul Space Void Ninth',u:'/elements.html',c:'PAGE'},
    {t:'HERITAGE ARCHIVE',d:'Bloodline lineage historical archive cultural memory legacy',u:'/heritage.html',c:'PAGE'},
    {t:'HOROSCOPE',d:'12 zodiac signs birth charts element assignment astrology',u:'/horoscope.html',c:'PAGE'},
    {t:'KNOWLEDGE GRAPH',d:'Node graph tracks elements gates concepts entity network',u:'/knowledge.html',c:'PAGE'},
    {t:'PRIVACY CENTRE',d:'GDPR consent data export right to erasure member rights',u:'/privacy.html',c:'PAGE'},
    {t:'POINTS MATRIX',d:'Matrix progression axis values lattice position scoring',u:'/points.html',c:'PAGE'},
    {t:'BLOCKCHAIN',d:'NFT token economy wallet marketplace ΩSYD token engine',u:'/blockchain.html',c:'PAGE'},
    {t:'INVESTMENT',d:'Portfolio crypto holdings income tracker allocation yield',u:'/investment.html',c:'PAGE'},
    {t:'CONSULTANCY',d:'Expert bookings reports medical legal engineering services',u:'/consultancy.html',c:'PAGE'},
    {t:'APPROVALS',d:'Owner only trial grants permanent access member approvals',u:'/approvals.html',c:'PAGE'},
    /* ── ALL OTHER PAGES A-Z ─────────────────────────────────────────────── */
    {t:'ACADEMY',d:'Sovereign academy education curriculum learning tracks',u:'/academy.html',c:'PAGE'},
    {t:'ADVERTISING',d:'Sovereign advertising platform brand campaigns media buying',u:'/advertising.html',c:'PAGE'},
    {t:'AGENTS',d:'12 sovereign AI agents council bound agent direct channel',u:'/agents.html',c:'PAGE'},
    {t:'ASCENSION',d:'Stage 1-9 sovereign ascension progression system',u:'/ascension.html',c:'PAGE'},
    {t:'AUTOMATION',d:'Workflow engine automation rules triggers platform bots',u:'/automation.html',c:'PAGE'},
    {t:'AWARDS',d:'Sovereign honours lifetime achievements recognition trophies',u:'/awards.html',c:'PAGE'},
    {t:'BEACON',d:'Sovereign beacon broadcast outreach system signal pulse',u:'/beacon.html',c:'PAGE'},
    {t:'BLOODLINE',d:'Ancestral lineage bloodline tracker genealogy heritage DNA',u:'/bloodline.html',c:'PAGE'},
    {t:'CHARACTER',d:'Character genealogy inheritance profile sovereign persona',u:'/character.html',c:'PAGE'},
    {t:'CHARTER',d:'Sovereign platform charter articles governance constitution',u:'/charter.html',c:'PAGE'},
    {t:'CINEMA',d:'12 sovereign films franchise system streaming production',u:'/cinema.html',c:'PAGE'},
    {t:'CITY',d:'Sovereign city smart city layer urban development system',u:'/city.html',c:'PAGE'},
    {t:'COMPLIANCE',d:'Contracts copyright terms licenses regulatory compliance',u:'/compliance.html',c:'PAGE'},
    {t:'CONTRIBUTIONS',d:'Member contributions impact metrics open source records',u:'/contributions.html',c:'PAGE'},
    {t:'CONTRACTS',d:'Legal contracts agreements enforcement sovereign law',u:'/contracts.html',c:'PAGE'},
    {t:'CREDENTIALS',d:'Digital certificates verification badges achievement proof',u:'/credentials.html',c:'PAGE'},
    {t:'DESIGN SYSTEM',d:'Color tokens typography components sovereign design language',u:'/design-system.html',c:'PAGE'},
    {t:'ECOSYSTEM',d:'18 modules interconnected platform map architecture',u:'/ecosystem.html',c:'PAGE'},
    {t:'ENTERPRISE',d:'Fortune 500 accounts API keys SLA enterprise control centre',u:'/enterprise.html',c:'PAGE'},
    {t:'EVENTS',d:'Platform events sovereign calendar schedule milestones',u:'/events.html',c:'PAGE'},
    {t:'EVOLUTION',d:'Axis A B C authority gates progression radar sovereign rise',u:'/evolution.html',c:'PAGE'},
    {t:'EXAM',d:'Sovereign examination 10 questions Axis A increment knowledge test',u:'/exam.html',c:'PAGE'},
    {t:'FACTIONS',d:'Sovereign factions orders tribal alliance system',u:'/factions.html',c:'PAGE'},
    {t:'FAMILY',d:'Family tree genealogy heritage nodes inheritance bonds',u:'/family.html',c:'PAGE'},
    {t:'FEED',d:'Real-time member activity stream posts events notifications',u:'/feed.html',c:'PAGE'},
    {t:'GATES',d:'12 authority gates from INITIATE to APEX progression',u:'/gates.html',c:'PAGE'},
    {t:'GOVERNANCE',d:'Policies risk register ethics board sovereignty decisions',u:'/governance.html',c:'PAGE'},
    {t:'GRADES',d:'Progression grades levels lattice position classification',u:'/grades.html',c:'PAGE'},
    {t:'GRID',d:'Lattice grid coordinates axis mapping spatial sovereignty',u:'/grid.html',c:'PAGE'},
    {t:'HALL OF FAME',d:'Sovereign hall of records legendary members achievements',u:'/hall.html',c:'PAGE'},
    {t:'HEALTH',d:'Platform member wellness tracking vitality metrics',u:'/health.html',c:'PAGE'},
    {t:'HONORS MEDALS',d:'Medals trophies certificates honors recognition system',u:'/honors.html',c:'PAGE'},
    {t:'HOUSES CELESTIAL',d:'Celestial houses zodiac mapping astrological domains',u:'/houses.html',c:'PAGE'},
    {t:'IDENTITY VERIFICATION',d:'Sovereign identity digital persona KYC verification',u:'/identity.html',c:'PAGE'},
    {t:'INCOME STREAMS',d:'Income streams optimization passive revenue tracking',u:'/income.html',c:'PAGE'},
    {t:'KINGS LATTICE',d:'Kings lattice 571536 nodes advanced grid sovereign royalty',u:'/kings.html',c:'PAGE'},
    {t:'KYC VERIFICATION',d:'Know your customer identity verification onboarding',u:'/kyc.html',c:'PAGE'},
    {t:'LAB INNOVATION',d:'Innovation lab OSS technology radar adopt trial assess',u:'/lab.html',c:'PAGE'},
    {t:'LEDGER',d:'Transaction ledger audit trail financial records immutable',u:'/ledger.html',c:'PAGE'},
    {t:'LEVELS',d:'Progression levels tier classification system',u:'/levels.html',c:'PAGE'},
    {t:'MARKETING',d:'Platform marketing brand strategy campaigns sovereign growth',u:'/marketing.html',c:'PAGE'},
    {t:'MARKETPLACE',d:'Token marketplace listings transactions exchange',u:'/marketplace.html',c:'PAGE'},
    {t:'MATRIX LATTICE',d:'9×9×9 lattice 104976 nodes axis coordinates The Plane',u:'/matrix.html',c:'PAGE'},
    {t:'MEDIA UNIVERSE',d:'Complete media management streaming universe content',u:'/media.html',c:'PAGE'},
    {t:'MEMBERSHIP TIERS',d:'Subscription tiers membership status sovereign access',u:'/membership.html',c:'PAGE'},
    {t:'NEWS FEED',d:'AI-summarized news intelligence feed trend tracking',u:'/news.html',c:'PAGE'},
    {t:'NOTIFICATIONS ALERTS',d:'Member alerts notification system messages inbox',u:'/notifications.html',c:'PAGE'},
    {t:'OBSERVATORY SRE',d:'Error budgets SLOs incidents Core Web Vitals monitoring',u:'/observatory.html',c:'PAGE'},
    {t:'PANTHEONS',d:'Divine pantheon celestial hierarchy mythology system',u:'/pantheons.html',c:'PAGE'},
    {t:'PASSPORT DIGITAL',d:'Sovereign digital passport identity travel authorization',u:'/passport.html',c:'PAGE'},
    {t:'PAYMENTS BILLING',d:'Subscription management payment history Stripe billing',u:'/payments.html',c:'PAGE'},
    {t:'PHASES',d:'Platform evolution phases timeline development stages',u:'/phases.html',c:'PAGE'},
    {t:'PORTFOLIO ASSETS',d:'Asset allocation performance tracker holdings',u:'/portfolio.html',c:'PAGE'},
    {t:'PREDICTION ORACLE',d:'AI forecasting oracle trajectory probability analysis',u:'/prediction.html',c:'PAGE'},
    {t:'PUBLICATIONS',d:'Sovereign publications manifestos intellectual property',u:'/publications.html',c:'PAGE'},
    {t:'PUBLISHING',d:'Content publishing distribution editorial system',u:'/publishing.html',c:'PAGE'},
    {t:'RESEARCH',d:'Academic research patents papers innovation discovery',u:'/research.html',c:'PAGE'},
    {t:'REVENUE INTELLIGENCE',d:'MRR subscriptions enterprise revenue intelligence',u:'/revenue.html',c:'PAGE'},
    {t:'ROADMAP STRATEGY',d:'Evolution roadmap priority matrix strategy health',u:'/roadmap.html',c:'PAGE'},
    {t:'SEARCH DISCOVER',d:'Platform-wide search discovery Ctrl+K command palette',u:'/search.html',c:'PAGE'},
    {t:'SERIES EPISODES',d:'144 sovereign series episodes across 12 tracks',u:'/series.html',c:'PAGE'},
    {t:'SERVICES CATALOG',d:'Platform services catalog offerings sovereign tools',u:'/services.html',c:'PAGE'},
    {t:'SETTINGS PREFERENCES',d:'Member settings preferences customization account',u:'/settings.html',c:'PAGE'},
    {t:'SIGIL EMBLEM',d:'Sovereign sigil emblem heraldry design identity mark',u:'/sigil.html',c:'PAGE'},
    {t:'SOCIAL COMMUNITY',d:'Social hub posts member connections community activity',u:'/social.html',c:'PAGE'},
    {t:'SOVEREIGN',d:'Sovereign status declaration rights entitlements charter',u:'/sovereign.html',c:'PAGE'},
    {t:'SOVEREIGN AI COMMAND',d:'12 agent AI command centre sovereign intelligence',u:'/sovereign-ai.html',c:'PAGE'},
    {t:'SOVEREIGN COVENANT',d:'The founding covenant laws sovereign constitution',u:'/sovereign-covenant.html',c:'PAGE'},
    {t:'SOVEREIGNS MEMBERS',d:'Member directory sovereign profiles community',u:'/sovereigns.html',c:'PAGE'},
    {t:'SUBSCRIPTIONS',d:'Subscription plans tier management Stripe billing',u:'/subscriptions.html',c:'PAGE'},
    {t:'TRAILERS PREVIEWS',d:'Sovereign universe trailers previews demos media',u:'/trailers.html',c:'PAGE'},
    {t:'TRAVEL GLOBAL',d:'Global presence travel system sovereign mobility',u:'/travel.html',c:'PAGE'},
    {t:'TREASURY',d:'Treasury management sovereign financial reserve vault',u:'/treasury.html',c:'PAGE'},
    {t:'TRIADS',d:'Triadic lattice structure system triad formation',u:'/triads.html',c:'PAGE'},
    {t:'TROPHIES',d:'Trophy cabinet achievements hall sovereign rewards',u:'/trophies.html',c:'PAGE'},
    {t:'UNIVERSE STRUCTURE',d:'Platform universe architecture sovereign world map',u:'/universe.html',c:'PAGE'},
    {t:'WALLET TOKENS',d:'ΩSYD wallet token management digital assets balance',u:'/wallet.html',c:'PAGE'},
    /* ── TRACKS ─────────────────────────────────────────────────────────── */
    {t:'TRACK I GENESIS',d:'The origin — first sovereign knowledge track',u:'/gaming.html',c:'TRACK'},
    {t:'TRACK II FOUNDATION',d:'Core structure — second knowledge track',u:'/gaming.html',c:'TRACK'},
    {t:'TRACK III ASCENSION',d:'The rise begins — third knowledge track',u:'/evolution.html',c:'TRACK'},
    {t:'TRACK IV SOVEREIGNTY',d:'Personal power — fourth knowledge track',u:'/dashboard.html',c:'TRACK'},
    {t:'TRACK V HERITAGE',d:'Legacy and lineage — fifth knowledge track',u:'/heritage.html',c:'TRACK'},
    {t:'TRACK VI MASTERY',d:'Deep expertise — sixth knowledge track',u:'/achievements.html',c:'TRACK'},
    {t:'TRACK VII CREATION',d:'Building worlds — seventh knowledge track',u:'/gaming.html',c:'TRACK'},
    {t:'TRACK VIII ECONOMY',d:'Value and exchange — eighth knowledge track',u:'/blockchain.html',c:'TRACK'},
    {t:'TRACK IX INTELLIGENCE',d:'AI and mind — ninth knowledge track',u:'/intelligence.html',c:'TRACK'},
    {t:'TRACK X COVENANT',d:'Law and order — tenth knowledge track',u:'/contracts.html',c:'TRACK'},
    {t:'TRACK XI LEGACY',d:'The permanent record — eleventh track',u:'/heritage.html',c:'TRACK'},
    {t:'TRACK XII OMEGA',d:'The apex — twelfth sovereign track',u:'/dashboard.html',c:'TRACK'},
    /* ── ELEMENTS ───────────────────────────────────────────────────────── */
    {t:'ELEMENT FIRE',d:'Aries Leo Sagittarius — drive ambition sovereign force',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT WATER',d:'Cancer Scorpio Pisces — depth intuition flow',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT WIND',d:'Gemini Libra Aquarius — intellect connection speed',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT METAL',d:'Taurus Virgo Capricorn — structure will precision',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SAND',d:'Boundary element — transition between physical forces',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SOUL',d:'Metaphysical — inner dimension of sovereign identity',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SPACE',d:'Metaphysical — outer dimension expansion cosmos',u:'/cosmos.html',c:'ELEMENT'},
    {t:'ELEMENT VOID',d:'Metaphysical — the absence that contains everything',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT THE NINTH',d:'Transcendent — activates at Stage 9 for all sovereign members',u:'/elements.html',c:'ELEMENT'},
    /* ── OLYMPIANS ──────────────────────────────────────────────────────── */
    {t:'ARES ARIES',d:'God of war — sovereign founder Aries Fire ARENITE token',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'APHRODITE TAURUS',d:'Goddess of beauty — Taurus Metal element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'APOLLO GEMINI',d:'God of knowledge and light — Gemini Wind element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'HERMES VIRGO',d:'Messenger god — Virgo Metal element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'POSEIDON SCORPIO',d:'God of seas — Scorpio Water element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ZEUS SAGITTARIUS',d:'King of Olympians — Sagittarius Fire element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ATHENA LIBRA',d:'Goddess of wisdom — Libra Wind element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ARTEMIS CANCER',d:'Goddess of hunt — Cancer Water element',u:'/cosmos.html',c:'OLYMPIAN'},
    /* ── CANON ──────────────────────────────────────────────────────────── */
    {t:'AUTHORITY FORMULA',d:'AUTH=sqrt(A³+B³+C³)×φ/e Apex=27.8367 A=Knowledge B=Mastery C=Contribution',u:'/analytics.html',c:'CANON'},
    {t:'ARENITE TOKEN',d:'Founder token Aries sign Major Sleiman Youssef Dagher',u:'/vault.html',c:'CANON'},
    {t:'12×12×12×12 LATTICE',d:'104976 canonical nodes The Plane sovereign progression matrix',u:'/points.html',c:'CANON'},
    {t:'TRIAL 9 MINUTES 17 SECONDS',d:'557 seconds trial period granted by owner only',u:'/approvals.html',c:'CANON'},
    {t:'DEDICATION 9H 17M 17S',d:'33437 seconds daily dedication target',u:'/dashboard.html',c:'CANON'},
    {t:'PHI GOLDEN RATIO',d:'1.6180339887 used in authority formula',u:'/analytics.html',c:'CANON'},
    {t:'EULER E',d:'2.7182818285 used in authority formula',u:'/analytics.html',c:'CANON'},
  ];
  function scoreItem(item,q){
    var t=item.t.toLowerCase(),d=item.d.toLowerCase();
    q=q.toLowerCase().trim();
    if(!q)return 0;
    if(t===q)return 100;
    if(t.startsWith(q))return 80;
    if(t.includes(q))return 60;
    if(d.includes(q))return 30;
    var si=0,qi=0,b=0;
    while(si<t.length&&qi<q.length){if(t[si]===q[qi]){qi++;b++;}si++;}
    if(qi===q.length)return 10+b;
    return 0;
  }
  function doSearch(q){
    if(!q||q.length<1)return INDEX.slice(0,10);
    return INDEX.map(function(item){return{item:item,sc:scoreItem(item,q)};})
      .filter(function(r){return r.sc>0;})
      .sort(function(a,b){return b.sc-a.sc;})
      .slice(0,10).map(function(r){return r.item;});
  }
  function highlight(t,q){
    if(!q)return t;
    var re2=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    return t.replace(re2,'<mark style="background:rgba(201,168,76,.22);color:#E2C86D;border-radius:2px;padding:0 2px">$1</mark>');
  }
  function renderResults(results,q,el){
    if(!el)return;
    if(!results.length){
      el.innerHTML='<div style="padding:20px;text-align:center;font-family:var(--M,\'Courier Prime\',monospace);font-size:9px;letter-spacing:2px;color:rgba(138,134,118,.4)">NO RESULTS FOR “'+q.toUpperCase()+'” · TRY A DIFFERENT TERM</div>';
      return;
    }
    el.innerHTML=results.map(function(item){
      var col=CAT_COLORS[item.c]||'var(--gold,#C9A84C)';
      return '<a href="'+item.u+'" style="display:block;padding:11px 16px;text-decoration:none;border-bottom:1px solid rgba(201,168,76,.05);color:inherit;transition:background .12s" onmouseenter="this.style.background=\'rgba(201,168,76,.04)\'" onmouseleave="this.style.background=\'\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">'
          +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:7px;letter-spacing:2px;color:'+col+';border:1px solid;border-color:'+col+'33;padding:1px 7px;border-radius:10px;flex-shrink:0">'+item.c+'</span>'
          +'<span style="font-family:var(--R,\'Rajdhani\',sans-serif);font-size:13px;font-weight:600">'+highlight(item.t,q)+'</span>'
        +'</div>'
        +'<div style="font-family:var(--M,\'Courier Prime\',monospace);font-size:9px;color:rgba(138,134,118,.6);padding-left:60px">'+item.d.slice(0,80)+'</div>'
        +'</a>';
    }).join('');
  }
  var _ov=null;
  function openSearch(){
    if(_ov)return;
    _ov=document.createElement('div');
    _ov.id='omega-search-overlay';
    _ov.setAttribute('role','dialog');_ov.setAttribute('aria-modal','true');_ov.setAttribute('aria-label','Sovereign search');
    _ov.style.cssText='position:fixed;inset:0;z-index:9990;background:rgba(2,2,6,.93);display:flex;align-items:flex-start;justify-content:center;padding-top:10vh;backdrop-filter:blur(8px)';
    _ov.innerHTML='<div style="width:min(640px,90vw);background:#0A0A0F;border:1px solid rgba(201,168,76,.3);border-radius:4px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.6)">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(201,168,76,.12)">'
        +'<span style="font-family:\'Cinzel Decorative\',serif;font-size:18px;color:rgba(201,168,76,.5)">Ω</span>'
        +'<input id="omega-s-inp" type="search" placeholder="SEARCH THE SOVEREIGN PLATFORM…" autocomplete="off" spellcheck="false" style="flex:1;background:none;border:none;outline:none;font-family:var(--M,\'Courier Prime\',monospace);font-size:13px;color:#e9e6dc;letter-spacing:1.5px" aria-label="Search">'
        +'<kbd onclick="closeSearch()" style="font-family:var(--M,\'Courier Prime\',monospace);font-size:9px;color:rgba(138,134,118,.5);border:1px solid rgba(138,134,118,.2);padding:2px 6px;border-radius:2px;cursor:pointer">ESC</kbd>'
      +'</div>'
      +'<div id="omega-s-res" role="listbox" style="max-height:55vh;overflow-y:auto"></div>'
      +'<div style="padding:10px 16px;border-top:1px solid rgba(201,168,76,.07);display:flex;gap:8px;flex-wrap:wrap">'
        +Object.keys(CAT_COLORS).map(function(cat){return '<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:7px;letter-spacing:1.5px;color:'+CAT_COLORS[cat]+';padding:2px 8px;border:1px solid;border-color:'+CAT_COLORS[cat]+'33;border-radius:10px">'+cat+'</span>';}).join('')
        +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:7px;letter-spacing:1.5px;color:rgba(138,134,118,.4);margin-left:auto">'+INDEX.length+' INDEXED</span>'
      +'</div>'
    +'</div>';
    document.body.appendChild(_ov);
    var inp=document.getElementById('omega-s-inp');
    var res=document.getElementById('omega-s-res');
    if(inp){
      inp.focus();
      inp.addEventListener('input',function(){renderResults(doSearch(inp.value),inp.value,res);});
      /* Show top 8 on open */
      renderResults(INDEX.slice(0,8),'',res);
    }
    _ov.addEventListener('click',function(e){if(e.target===_ov)closeSearch();});
  }
  function closeSearch(){if(_ov&&_ov.parentNode){document.body.removeChild(_ov);}_ov=null;}
  window.closeSearch=closeSearch;
  function onKey(e){
    if(e.key==='Escape'){closeSearch();return;}
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();if(_ov)closeSearch();else openSearch();}
  }
  document.addEventListener('keydown',onKey);
  document.querySelectorAll('[data-search-trigger],[href="#search"]').forEach(function(el){el.addEventListener('click',function(ev){ev.preventDefault();openSearch();});});
  window.OmegaSearch={open:openSearch,close:closeSearch,search:doSearch};
})();
