/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN SEARCH ENGINE
   Ctrl+K opens overlay. Searches all 160 pages, tracks, elements, Olympians, canon.
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
    /* ── PAGES ADDED — was reachable from dashboard/nav but missing from
       search, so ⌘K couldn't find them (64 pages) ────────────────────────── */
    {t:'AFFIRMATIONS',d:'daily positive affirmations sovereign mindset practice repetition',u:'/affirmations.html',c:'PAGE'},
    {t:'ARCHITECT',d:'architecture decision records ADR platform blueprint event bus design',u:'/architect.html',c:'PAGE'},
    {t:'ATLAS',d:'knowledge mind map constellation nodes concepts network',u:'/atlas.html',c:'PAGE'},
    {t:'BODY COMPOSITION',d:'body composition tracker weight measurements physical identity',u:'/body.html',c:'PAGE'},
    {t:'BREATHWORK',d:'breathing exercises box breathing sovereign breathwork practice',u:'/breath.html',c:'PAGE'},
    {t:'BUDGET',d:'budget planner income expenses allocation sovereign finance',u:'/budget.html',c:'PAGE'},
    {t:'CHRONICLE',d:'heritage timeline historical chronicle events milestones legacy',u:'/chronicle.html',c:'PAGE'},
    {t:'CIPHER',d:'cipher encoding cryptography puzzle sovereign cipher tools',u:'/cipher.html',c:'PAGE'},
    {t:'CLARITY',d:'mental clarity practice focus reflection sovereign clarity',u:'/clarity.html',c:'PAGE'},
    {t:'CODEX',d:'sovereign codex knowledge reference compendium',u:'/codex.html',c:'PAGE'},
    {t:'CONSTELLATION GRAPH',d:'knowledge graph constellation nodes connections network',u:'/graph.html',c:'PAGE'},
    {t:'CONTACTS',d:'contact directory relationships network sovereign contacts',u:'/contacts.html',c:'PAGE'},
    {t:'CONTROL DECK',d:'omni control deck unified interface command',u:'/interface-omni.html',c:'PAGE'},
    {t:'DAILY COMMAND BRIEF',d:'daily command brief strategy operations summary',u:'/command.html',c:'PAGE'},
    {t:'DECISIONS',d:'decision log sovereign decisions rationale clarity tracker',u:'/decisions.html',c:'PAGE'},
    {t:'DNA',d:'genetic traits DNA ancestry heritage profile',u:'/dna.html',c:'PAGE'},
    {t:'ELEMENT TRIBES',d:'element tribes cosmos community groups',u:'/tribe.html',c:'PAGE'},
    {t:'EXPENSES',d:'expense tracker spending categories budget finance',u:'/expenses.html',c:'PAGE'},
    {t:'FASTING',d:'intermittent fasting tracker windows sovereign body fuel',u:'/fasting.html',c:'PAGE'},
    {t:'FLASHCARDS',d:'spaced repetition SM-2 flashcards study memory',u:'/flashcard.html',c:'PAGE'},
    {t:'FOCUS DEEP WORK',d:'deep work focus sessions timer productivity engine',u:'/focus.html',c:'PAGE'},
    {t:'FORGE',d:'sovereign forge creation crafting build tools',u:'/forge.html',c:'PAGE'},
    {t:'GRATITUDE',d:'gratitude journal daily practice sovereign reflection',u:'/gratitude.html',c:'PAGE'},
    {t:'HABITS',d:'atomic habit stack tracker streaks daily habits',u:'/habits.html',c:'PAGE'},
    {t:'HYDRATION',d:'sovereign hydration water intake tracker',u:'/water.html',c:'PAGE'},
    {t:'JOURNAL',d:'sovereign journal daily writing reflection entries',u:'/journal.html',c:'PAGE'},
    {t:'LIBRARY',d:'sovereign reading list library books catalog',u:'/library.html',c:'PAGE'},
    {t:'MAP',d:'sovereign map navigation overview',u:'/map.html',c:'PAGE'},
    {t:'MEDITATE',d:'meditation breathwork mindfulness sovereign practice',u:'/meditate.html',c:'PAGE'},
    {t:'MENTORS',d:'mentor directory guidance relationships advisors',u:'/mentors.html',c:'PAGE'},
    {t:'MIND MAP',d:'mind mapping ideas brainstorm visual notes',u:'/mindmap.html',c:'PAGE'},
    {t:'MISSIONS',d:'sovereign missions goals quests objectives',u:'/missions.html',c:'PAGE'},
    {t:'MOOD',d:'mood tracker emotional intelligence daily check-in',u:'/mood.html',c:'PAGE'},
    {t:'NETWORK',d:'sovereign network connections relationships professional',u:'/network.html',c:'PAGE'},
    {t:'NEXUS',d:'sovereign nexus hub connections intelligence',u:'/nexus.html',c:'PAGE'},
    {t:'NOTES',d:'sovereign notes capture ideas quick notes',u:'/notes.html',c:'PAGE'},
    {t:'NUTRITION',d:'nutrition tracker sovereign body fuel meals macros',u:'/nutrition.html',c:'PAGE'},
    {t:'OPS',d:'sovereign SRE command health probes incident log',u:'/ops.html',c:'PAGE'},
    {t:'ORACLE',d:'oracle predictions insight sovereign foresight',u:'/oracle.html',c:'PAGE'},
    {t:'PHYSIOLOGY',d:'physiology metrics body systems health tracking',u:'/physiology.html',c:'PAGE'},
    {t:'PRINCIPLES',d:'personal principles sovereign philosophy guidelines',u:'/principles.html',c:'PAGE'},
    {t:'PROJECTS',d:'sovereign projects tracker milestones initiatives',u:'/projects.html',c:'PAGE'},
    {t:'PULSE',d:'sovereign market signal pulse indicators',u:'/pulse.html',c:'PAGE'},
    {t:'READING',d:'sovereign reading library books tracker',u:'/reading.html',c:'PAGE'},
    {t:'RITUALS',d:'sovereign protocols daily rituals routines',u:'/rituals.html',c:'PAGE'},
    {t:'SIGIL RUNE',d:'sigil rune symbol identity mark',u:'/rune.html',c:'PAGE'},
    {t:'SIGMA PROTOCOL',d:'sigma protocol sovereign discipline system',u:'/sigma.html',c:'PAGE'},
    {t:'SIGNAL INTELLIGENCE',d:'signal intelligence sovereign monitoring alerts',u:'/signal.html',c:'PAGE'},
    {t:'SLEEP OPTIMIZATION',d:'sleep optimization tracker restoration identity',u:'/sleep.html',c:'PAGE'},
    {t:'SOVEREIGN MIRROR',d:'self reflection sovereign mirror introspection',u:'/mirror.html',c:'PAGE'},
    {t:'SOVEREIGN OATH',d:'sovereign oath commitment declaration personal pledge',u:'/oath.html',c:'PAGE'},
    {t:'SOVEREIGN QUEUE',d:'message queues consumer workers DLQ circuit breakers',u:'/queue.html',c:'PAGE'},
    {t:'SOVEREIGN REALM',d:'sovereign realm territory domain overview',u:'/realm.html',c:'PAGE'},
    {t:'SOVEREIGN SKILLS',d:'skill inventory deliberate practice mastery stack',u:'/skills.html',c:'PAGE'},
    {t:'SOVEREIGN WISDOM',d:'sovereign quotes wisdom collection inspiration',u:'/quotes.html',c:'PAGE'},
    {t:'STOIC PROTOCOL',d:'stoic philosophy protocol identity practice',u:'/stoic.html',c:'PAGE'},
    {t:'STUDIO',d:'sovereign studio creation production tools',u:'/studio.html',c:'PAGE'},
    {t:'TARGETS',d:'sovereign OKR system targets goals objectives',u:'/targets.html',c:'PAGE'},
    {t:'TIME',d:'sovereign time mastery tracking allocation',u:'/time.html',c:'PAGE'},
    {t:'VISION BOARD',d:'sovereign vision board life goals board',u:'/vision.html',c:'PAGE'},
    {t:'VOCABULARY',d:'vocabulary builder word learning study',u:'/vocabulary.html',c:'PAGE'},
    {t:'WEALTH ENGINE',d:'sovereign wealth engine treasury calculator finance',u:'/wealth.html',c:'PAGE'},
    {t:'WEEKLY REVIEW',d:'sovereign weekly review planning reflection',u:'/weekly.html',c:'PAGE'},
    {t:'WORKOUT',d:'sovereign workout physical training fitness sovereignty',u:'/workout.html',c:'PAGE'},
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
    {t:'ELEMENT METAL',d:'Taurus Capricorn — structure will precision',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SAND',d:'Virgo — the universal amplifier, strengthens every element around it',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SOUL',d:'Metaphysical — inner dimension of sovereign identity',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SPACE',d:'Metaphysical — outer dimension expansion cosmos',u:'/cosmos.html',c:'ELEMENT'},
    {t:'ELEMENT VOID',d:'Metaphysical — the absence that contains everything',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT THE NINTH',d:'Transcendent — activates at Stage 9 for all sovereign members',u:'/elements.html',c:'ELEMENT'},
    /* ── OLYMPIANS ──────────────────────────────────────────────────────── */
    {t:'ARES ARIES',d:'God of war — sovereign founder Aries Fire ARENITE token',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'APHRODITE TAURUS',d:'Goddess of beauty — Taurus Metal element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'APOLLO LEO',d:'God of knowledge and light — Leo Fire element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'HERMES GEMINI',d:'Messenger god — Gemini Wind element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'POSEIDON PISCES',d:'God of seas — Pisces Water element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ZEUS SAGITTARIUS',d:'King of Olympians — Sagittarius Fire element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ATHENA VIRGO',d:'Goddess of wisdom — Virgo Sand element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ARTEMIS CANCER',d:'Goddess of hunt — Cancer Water element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'HERA LIBRA',d:'Queen of Olympus — Libra Wind element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'DEMETER SCORPIO',d:'Goddess of earth — Scorpio Water element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'HESTIA CAPRICORN',d:'Goddess of hearth — Capricorn Metal element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'HEPHAESTUS AQUARIUS',d:'God of the forge — Aquarius Wind element',u:'/cosmos.html',c:'OLYMPIAN'},
    /* ── CANON ──────────────────────────────────────────────────────────── */
    {t:'AUTHORITY FORMULA',d:'AUTH=sqrt(A³+B³+C³)×φ/e Apex=27.8367 A=Knowledge B=Mastery C=Contribution',u:'/analytics.html',c:'CANON'},
    {t:'ARENITE TOKEN',d:'Founder token Aries sign Major Sleiman Youssef Dagher',u:'/vault.html',c:'CANON'},
    {t:'12×12×9×9×9 LATTICE',d:'104976 canonical nodes The Plane 12x12x9^3 sovereign matrix',u:'/points.html',c:'CANON'},
    {t:'TRIAL 9 MINUTES 17 SECONDS',d:'557 seconds trial period granted by owner only',u:'/approvals.html',c:'CANON'},
    {t:'DEDICATION 9H 17M 17S',d:'33437 seconds daily dedication target',u:'/dashboard.html',c:'CANON'},
    {t:'PHI GOLDEN RATIO',d:'1.6180339887 used in authority formula',u:'/analytics.html',c:'CANON'},
    {t:'EULER E',d:'2.7182818285 used in authority formula',u:'/analytics.html',c:'CANON'},
  ];
  /* ── FUSE.JS (lazy background init for better fuzzy results) ───── */
  var _fuse=null;
  function initFuse(){
    if(_fuse||!window.OmegaOSS) return;
    window.OmegaOSS.require('fuse',function(Fuse){
      if(!Fuse) return;
      _fuse=new Fuse(INDEX,{keys:[{name:'t',weight:2},{name:'d',weight:1}],threshold:0.35,includeScore:true,minMatchCharLength:2});
    });
  }

  /* ── INDEX EXTENSION ────────────────────────────────────────────
     omega-ui.js has always called OmegaSearch.addItems(...) behind an
     `if(!window.OmegaSearch||!window.OmegaSearch.addItems) return;`
     guard — and addItems never existed, so that call silently did
     nothing and the index stayed frozen at whatever this file hardcodes.
     Deduped by URL so calling it repeatedly (or from two modules) is
     safe. Fuse copies the collection at construction, so it has to be
     told when the collection grows or new pages stay unfindable by
     fuzzy search even after they are in INDEX. */
  var _seenUrl={};
  INDEX.forEach(function(it){ _seenUrl[normUrl(it.u)]=1; });
  function normUrl(u){
    return String(u||'').trim().toLowerCase().replace(/\/index\.html$/,'/');
  }
  function addItems(items){
    if(!items) return 0;
    if(!Array.isArray(items)) items=[items];
    var added=0;
    items.forEach(function(it){
      if(!it||!it.u||!it.t) return;
      var k=normUrl(it.u);
      if(_seenUrl[k]) return;
      _seenUrl[k]=1;
      INDEX.push({t:String(it.t),d:String(it.d||''),u:String(it.u),c:it.c||'PAGE'});
      added++;
    });
    if(added&&_fuse&&typeof _fuse.setCollection==='function') _fuse.setCollection(INDEX);
    if(added) refreshCount();
    return added;
  }

  /* Harvest whatever nav.js actually rendered. nav.js is the authoritative
     list of member-reachable pages and it grows; a hardcoded index does
     not. Doing it this way means a page added to nav.js is searchable
     without anyone remembering to also edit this file — which is exactly
     what had not been happening (9 nav-reachable pages, among them
     council.html, hercules.html and the six graph-* views, were absent
     from the hardcoded index above). */
  function harvestNav(){
    var side=document.getElementById('omega-side')||document.body;
    if(!side) return 0;
    var items=[];
    side.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href')||'';
      if(!/^\/[a-z0-9._-]+\.html(#|$)/i.test(href)) return;
      var label=(a.textContent||'').replace(/\s+/g,' ').trim();
      if(!label||label.length>60) return;
      var url=href.split('#')[0];
      /* Carry the slug in the description too. Several nav labels say nothing
         about the URL -- /council.html is labelled "DECISION ENGINE" -- so
         without this a member searching the page's own name finds nothing. */
      var slug=url.replace(/^\//,'').replace(/\.html$/,'');
      var words=slug.replace(/[-_]/g,' ');
      items.push({t:label.toUpperCase(),
        d:'Navigate to '+label+' · '+slug+(words===slug?'':' '+words),
        u:url,c:'PAGE'});
    });
    return addItems(items);
  }
  /* Warm Fuse.js in background after load */
  window.addEventListener('load',function(){setTimeout(initFuse,1500);});

  function scoreItem(item,q){
    var t=item.t.toLowerCase(),d=item.d.toLowerCase();
    q=q.toLowerCase().trim();
    if(!q)return 0;
    if(t===q)return 100;
    if(t.startsWith(q))return 80;
    if(t.includes(q))return 60;
    if(d.includes(q))return 30;
    // Multi-word: score by how many query words appear in title or description.
    // Handles word-order differences like "sovereign city" matching "CITY SOVEREIGN".
    var words=q.split(/\s+/).filter(Boolean);
    if(words.length>1){
      var inT=0,inD=0;
      for(var i=0;i<words.length;i++){
        if(t.includes(words[i]))inT++;
        else if(d.includes(words[i]))inD++;
      }
      var hit=inT+inD;
      if(hit===words.length)return 40+(inT*4); // all words found
      if(hit>0)return 5+hit*3;                 // partial match
      return 0;
    }
    // Single-word fuzzy subsequence
    var si=0,qi=0,b=0;
    while(si<t.length&&qi<q.length){if(t[si]===q[qi]){qi++;b++;}si++;}
    if(qi===q.length)return 10+b;
    return 0;
  }
  function doSearch(q){
    if(!q||q.length<1)return INDEX.slice(0,10);
    /* Use Fuse.js if available (better typo tolerance + relevance ranking) */
    if(_fuse&&q.length>=2){
      var fuseResults=_fuse.search(q).slice(0,10).map(function(r){return r.item;});
      if(fuseResults.length) return fuseResults;
    }
    return INDEX.map(function(item){return{item:item,sc:scoreItem(item,q)};})
      .filter(function(r){return r.sc>0;})
      .sort(function(a,b){return b.sc-a.sc;})
      .slice(0,10).map(function(r){return r.item;});
  }
  /* Results go through .innerHTML. The hardcoded INDEX above is static and
     safe, but addItems()/harvestNav() feed it text read out of the DOM, so
     escape before highlighting rather than trusting every future caller. */
  function esc(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function highlight(t,q){
    t=esc(t);
    if(!q)return t;
    var re2=new RegExp('('+esc(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    return t.replace(re2,'<mark style="background:rgba(201,168,76,.22);color:#E2C86D;border-radius:2px;padding:0 2px">$1</mark>');
  }
  function refreshCount(){
    var c=document.getElementById('omega-s-count');
    if(c)c.textContent=INDEX.length+' INDEXED';
  }
  function renderResults(results,q,el){
    if(!el)return;
    if(!results.length){
      el.innerHTML='<div style="padding:20px;text-align:center;font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:2px;color:rgba(138,134,118,.4)">NO RESULTS FOR “'+q.toUpperCase()+'” · TRY A DIFFERENT TERM</div>';
      return;
    }
    el.innerHTML=results.map(function(item){
      var col=CAT_COLORS[item.c]||'var(--gold,#C9A84C)';
      return '<a href="'+item.u+'" style="display:block;padding:11px 16px;text-decoration:none;border-bottom:1px solid rgba(201,168,76,.05);color:inherit;transition:background .12s" onmouseenter="this.style.background=\'rgba(201,168,76,.04)\'" onmouseleave="this.style.background=\'\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">'
          +'<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:2px;color:'+col+';border:1px solid;border-color:'+col+'33;padding:1px 7px;border-radius:10px;flex-shrink:0">'+item.c+'</span>'
          +'<span style="font-family:var(--R,\'Rajdhani\',sans-serif);font-size:13px;font-weight:600">'+highlight(item.t,q)+'</span>'
        +'</div>'
        +'<div style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;color:rgba(138,134,118,.6);padding-left:60px">'+esc(item.d.slice(0,80))+'</div>'
        +'</a>';
    }).join('');
  }
  var _ov=null,_sel=-1;
  function moveSel(dir){
    var links=_ov?_ov.querySelectorAll('#omega-s-res a'):[];
    if(!links.length)return;
    if(_sel>=0&&_sel<links.length)links[_sel].style.background='';
    _sel=Math.max(0,Math.min(links.length-1,_sel+dir));
    links[_sel].style.background='rgba(201,168,76,.08)';
    links[_sel].scrollIntoView({block:'nearest'});
  }
  function openSearch(){
    if(_ov)return;
    harvestNav();
    _ov=document.createElement('div');
    _ov.id='omega-search-overlay';
    _ov.setAttribute('role','dialog');_ov.setAttribute('aria-modal','true');_ov.setAttribute('aria-label','Sovereign search');
    _ov.style.cssText='position:fixed;inset:0;z-index:9990;background:rgba(2,2,6,.93);display:flex;align-items:flex-start;justify-content:center;padding-top:10vh;backdrop-filter:blur(8px)';
    _ov.innerHTML='<div style="width:min(640px,90vw);background:#0A0A0F;border:1px solid rgba(201,168,76,.3);border-radius:4px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.6)">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(201,168,76,.12)">'
        +'<span style="font-family:\'Cinzel Decorative\',serif;font-size:18px;color:rgba(201,168,76,.5)">Ω</span>'
        +'<input id="omega-s-inp" type="search" placeholder="SEARCH THE SOVEREIGN PLATFORM…" autocomplete="off" spellcheck="false" style="flex:1;background:none;border:none;outline:none;font-family:var(--M,\'Courier Prime\',monospace);font-size:13px;color:#e9e6dc;letter-spacing:1.5px" aria-label="Search">'
        +'<kbd onclick="closeSearch()" style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;color:rgba(138,134,118,.5);border:1px solid rgba(138,134,118,.2);padding:2px 6px;border-radius:2px;cursor:pointer">ESC</kbd>'
      +'</div>'
      +'<div id="omega-s-res" role="listbox" style="max-height:55vh;overflow-y:auto"></div>'
      +'<div style="padding:10px 16px;border-top:1px solid rgba(201,168,76,.07);display:flex;gap:8px;flex-wrap:wrap">'
        +Object.keys(CAT_COLORS).map(function(cat){return '<span style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:1.5px;color:'+CAT_COLORS[cat]+';padding:2px 8px;border:1px solid;border-color:'+CAT_COLORS[cat]+'33;border-radius:10px">'+cat+'</span>';}).join('')
        +'<span id="omega-s-count" style="font-family:var(--M,\'Courier Prime\',monospace);font-size:12px;letter-spacing:1.5px;color:rgba(138,134,118,.4);margin-left:auto">'+INDEX.length+' INDEXED</span>'
      +'</div>'
    +'</div>';
    document.body.appendChild(_ov);
    var inp=document.getElementById('omega-s-inp');
    var res=document.getElementById('omega-s-res');
    if(inp){
      inp.focus();
      inp.addEventListener('input',function(){_sel=-1;renderResults(doSearch(inp.value),inp.value,res);});
      /* Show top 8 on open */
      renderResults(INDEX.slice(0,8),'',res);
    }
    _ov.addEventListener('click',function(e){if(e.target===_ov)closeSearch();});
  }
  function closeSearch(){if(_ov&&_ov.parentNode){document.body.removeChild(_ov);}_ov=null;}
  window.closeSearch=closeSearch;
  function onKey(e){
    if(e.key==='Escape'){closeSearch();return;}
    if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();if(_ov)closeSearch();else openSearch();return;}
    if(!_ov)return;
    if(e.key==='ArrowDown'){e.preventDefault();moveSel(1);return;}
    if(e.key==='ArrowUp'){e.preventDefault();moveSel(-1);return;}
    if(e.key==='Enter'&&_sel>=0){
      var links=_ov.querySelectorAll('#omega-s-res a');
      if(links[_sel])links[_sel].click();
    }
  }
  document.addEventListener('keydown',onKey);
  /* Delegated, not a one-shot querySelectorAll at module-eval time: this file
     is injected by bg.js as an async <script>, so it runs at an arbitrary
     point relative to page render, and every shared chrome element (the nav
     sidebar, the controls dock) is itself injected later still. A direct
     binding could only ever have caught triggers that were already in the
     markup, and no page has one. */
  document.addEventListener('click',function(e){
    var t=e.target&&e.target.closest&&e.target.closest('[data-search-trigger],[href="#search"]');
    if(!t)return;
    e.preventDefault();
    openSearch();
  });
  window.OmegaSearch={open:openSearch,close:closeSearch,search:doSearch,addItems:addItems,count:function(){return INDEX.length;}};
})();
