/* SYD OMEGA 91717 -- Sovereign Navigation v5.0
   Icon dock. Full deployed-page coverage. Permanent labels. Rotating Omega. */
(function(){
  var el=document.getElementById('omega-side');
  if(!el) return;
  var dp=el.getAttribute('data-page')||
    ((location.pathname.split('/').pop()||'').replace('.html',''))||'dashboard';

  /* Map every page to a section */
  var PS={
    dashboard:'command',beacon:'command',notifications:'command',search:'command',
    command:'command',gateway:'command',
    profile:'identity',settings:'identity',
    ascension:'ascend',matrix:'ascend',sculpture:'cosmos',academy:'ascend',courses:'ascend',gaming:'ascend',
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
    /* Fifteen deployed pages had no PS entry, so nav rendered with NO section
       highlighted on any of them -- including gateway, the page whose whole
       purpose is to be the way in. Reachability (a link in SECTIONS) and active
       state (a key here) are separate concerns and had drifted apart. */
    points:'achieve',houses:'cosmos',evolution:'ascend',
    ledger:'vault',subscriptions:'vault',advertising:'vault','ad-network':'vault',
    'sovereign-covenant':'vault',
    creator:'services','project-studio':'services',
    architecture:'govern','control-plane':'govern','world-shell':'govern',
    'autonomous-insights':'govern',
    'interface-omni':'order',
    analytics:'intel',achievements:'achieve',leaderboard:'achieve',
    bloodline:'archive',character:'archive',charter:'archive',
    cinema:'media',characters:'archive',movies:'media',credentials:'archive',design_system:'govern',
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
    'sovereign-ai':'arena','design-system':'govern','agent-network':'arena','design-showcase':'govern',
    /* Navigation/IA-audit remediation: the 64 pages found reachable only via
       dashboard.html/intelligence.html's own quick-link grids, folded into the
       persistent sidebar by theme (REPOSITORY_AUDIT.md §9). */
    affirmations:'services',body:'services',breath:'services',fasting:'services',gratitude:'services',habits:'services',journal:'services',meditate:'services',mood:'services',nutrition:'services',oath:'services',physiology:'services',rituals:'services',sleep:'services',stoic:'services',targets:'services',water:'services',weekly:'services',workout:'services',budget:'invest',expenses:'invest',wealth:'invest',contacts:'command',decisions:'command',missions:'command',network:'command',notes:'command',projects:'command',quotes:'command',time:'command',vision:'command',chronicle:'cosmos',dna:'cosmos',graph:'cosmos',graphify:'intel','graph-admin':'intel','graph-timeline':'intel','graph-centrality':'intel','graph-explorer':'intel','graph-anomalies':'intel','graph-evidence':'intel',map:'cosmos',mirror:'cosmos',oracle:'cosmos',realm:'cosmos',rune:'cosmos',tribe:'cosmos',atlas:'intel',cipher:'intel',codex:'intel',mindmap:'intel',nexus:'intel',pulse:'intel',sigma:'intel',signal:'intel',architect:'ascend',clarity:'ascend',flashcard:'ascend',focus:'ascend',forge:'ascend',library:'ascend',mentors:'ascend',principles:'ascend',reading:'ascend',skills:'ascend',vocabulary:'ascend',maintenance:'govern',ops:'govern',queue:'arena',awards:'achieve',publications:'media',
  };

  var SECTIONS=[
    {key:'command', icon:'\u2316', label:'COMMAND', href:'/dashboard.html',  col:'#C9A84C',
     sub:[['gateway','GATEWAY','/gateway.html'],['dashboard','DASHBOARD','/dashboard.html'],['beacon','BEACON','/beacon.html'],
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
          ['academy','ACADEMY','/academy.html'],['courses','COURSES','/courses.html'],['gaming','GAMING ARENA','/gaming.html'],