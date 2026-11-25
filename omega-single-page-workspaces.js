(function(){
  'use strict';
  /* Workspace hubs: each hub page lists the specialist pages that belong to it as
     plain links. They used to open in an <iframe> dialog, but production sends
     X-Frame-Options: DENY + frame-ancestors 'none' on every page
     (vercel.json "/(.*)", enforced by security-headers-contract.py), so the
     browser refused every frame, and an allowed frame would load a second full
     copy of the platform (bg.js + ~160 modules) inside the first. A link has
     neither problem, keeps every URL, and works with middle-click and no JS. */
  var WORKSPACES={
    '/dashboard.html':['beacon','search','notifications','chatbot','missions','world','replay','evidence','recovery','contacts','decisions','network','notes','projects','quotes','time','vision'],
    '/profile.html':['identity','passport','character','credentials','membership'],
    '/life.html':['body','physiology','workout','nutrition','sleep','mood','breath','habits','journal','rituals','fasting','targets','weekly','affirmations','gratitude','oath','stoic','water'],
    '/ascend.html':['academy','courses','focus','contributions','evolution','levels','phases','ascension','domain-mastery','clarity','flashcard','library','mentors','principles','reading','skills','vocabulary','architect','forge'],
    '/cosmos.html':['horoscope','elements','pantheons','houses','chronicle','dna','graph','map','mirror','oracle','realm','rune','tribe','realms','sculpture','cosmic-ledger'],
    '/vault.html':['wallet','subscriptions','ledger','blockchain','advertising','ad-network','sovereign-covenant'],
    '/order.html':['family','heritage','bloodline','hall','sovereigns','factions','city','approvals','interface-omni'],
    '/services.html':['consultancy','contracts','publishing','marketing','events','travel','health','social','studio','creation-studio','project-studio','creator'],
    '/intel.html':['insight','research','prediction','intelligence','automation','graph-admin','atlas','cipher','codex','mindmap','nexus','pulse','sigma','signal','news'],
    '/arena.html':['sovereign-ai','agent-network','agents','analytics','queue','gaming'],
    '/govern.html':['governance','observatory','enterprise','privacy','roadmap','ecosystem','knowledge','knowledge-loom','maintenance','control-center','platform-kernel','agent-operations','ops','architecture','autonomous-insights','lab','design-system','design-showcase','design-lab'],
    '/invest.html':['investment','portfolio','treasury','revenue','income','expenses','wealth'],
    '/achieve.html':['achievements','my-quests','quest-progress','leaderboard','domain-mastery','seasonal-events','gates','grades','levels','phases','ascension','kings','triads','grid','awards','hercules'],
    '/archive.html':['kyc','charter','sigil'],
    '/media.html':['cinema','movies','series','trailers','universe','feed','publications','visual-atlas','characters']
  };
  /* PANELS: pages shown as TABS that open in place (omega-panels.js) instead of chips that leave the hub.
     Space-separated strings, not arrays, so the hub-list parser in test_hub_picker_links.py does not read this
     as a second chip list. Only pages that PASSED a measured comparison with their own standalone page are
     here (same controls, same storage written, no errors, content present); every other page in the hub
     stays a chip. Payments, KYC, consent and privacy pages and the ARENA agent tools are deliberately left
     out of this first batch. */
  var PANELS={
    '/ascend.html':'academy focus contributions evolution levels phases ascension domain-mastery clarity flashcard library mentors principles reading skills vocabulary architect forge',
    '/cosmos.html':'horoscope elements dna graph mirror oracle realm rune tribe realms sculpture cosmic-ledger',
    '/order.html':'family heritage bloodline hall sovereigns factions city',
    '/services.html':'consultancy publishing marketing events social studio creation-studio',
    '/intel.html':'intelligence automation atlas cipher codex mindmap nexus pulse sigma signal news',
    '/govern.html':'governance roadmap ecosystem knowledge knowledge-loom maintenance control-center platform-kernel agent-operations ops architecture autonomous-insights lab design-system design-showcase design-lab',
    '/achieve.html':'achievements leaderboard domain-mastery gates grades levels phases ascension kings triads grid hercules'
  };
  /* Published for the one-shell router (omega-one-shell.js): the hub -> pages map and the pages already enabled as tabs, read
     from here so the shell never keeps a second copy of them. Copies, so a caller cannot edit the tables this file uses. */
  (function(){
    var hubs={},panels={};
    Object.keys(WORKSPACES).forEach(function(h){hubs[h]=WORKSPACES[h].slice();});
    Object.keys(PANELS).forEach(function(h){panels[h]=PANELS[h];});
    window.OmegaWorkspaces={hubs:hubs,panels:panels,label:label};
    try{document.dispatchEvent(new CustomEvent('omega:workspaces-ready'));}catch(e){}
  })();
  var modules=WORKSPACES[location.pathname]||[];
  if(!modules.length)return;

  function label(key){return key.replace(/[-_]/g,' ').replace(/\b\w/g,function(m){return m.toUpperCase();});}
  function route(key){return '/'+key+'.html';}

  /* Old deep links (#module=<key>) opened the dialog; send them to the page itself. */
  var legacy=(location.hash.match(/(?:^#|[?&])module=([^&]+)/)||[])[1];
  if(legacy){
    var k0=decodeURIComponent(legacy);
    if(modules.indexOf(k0)>=0){location.replace(route(k0));return;}
  }

  if(!document.getElementById('omega-single-page-css')){
    var s=document.createElement('style');s.id='omega-single-page-css';
    s.textContent=[
      '.omega-module-picker{display:flex;gap:6px;overflow:auto;padding:8px 10px;margin:0 0 14px;border:1px solid rgba(201,168,76,.12);background:rgba(10,10,15,.48);scrollbar-width:none}',
      '.omega-module-picker::-webkit-scrollbar{display:none}',
      '.omega-module-chip{flex:0 0 auto;min-height:38px;padding:0 11px;border:1px solid rgba(201,168,76,.16);background:transparent;color:#85837b;font:var(--fs-1,12px) "Courier Prime",monospace;letter-spacing:.8px;cursor:pointer;border-radius:7px;display:inline-flex;align-items:center;text-decoration:none}',
      '.omega-module-chip:hover,.omega-module-chip[aria-current="true"]{color:#e8c97a;border-color:rgba(201,168,76,.5);background:rgba(201,168,76,.08)}'
    ].join('');
    document.head.appendChild(s);
  }

  var main=document.querySelector('main');
  if(!main)return;
  /* HOME shows no chip strip (2026-11-14): seventeen links above the dashboard's own content was a third
     row of navigation on the first page a member sees. Every one of them is in the menu, the full
     launcher or search, and the old #module= links above still redirect. */
  if(location.pathname==='/dashboard.html'){window.OmegaSinglePage={open:function(k){if(modules.indexOf(k)>=0)location.href=route(k);},close:function(){},modules:modules.slice()};return;}
  /* LIFE: life.html shows each of these twelve as a tab under the daily log (omega-panels.js; nine of them
     also have a tile in omega-life-log.js KINDS), so a chip for each was the same links twice. They stay in WORKSPACES:
     the #module= redirect, search and the launcher still reach them. */
  var AS_TABS=(PANELS[location.pathname]||'').split(' ').filter(Boolean);
  var IN_PAGE=location.pathname==='/life.html'?'body workout sleep mood breath habits fasting gratitude water affirmations stoic rituals'.split(' '):[];
  var picker=document.createElement('nav');picker.className='omega-module-picker';picker.setAttribute('aria-label','Workspace capabilities');
  modules.forEach(function(k){
    if(IN_PAGE.indexOf(k)>=0||AS_TABS.indexOf(k)>=0)return;
    var a=document.createElement('a');a.href=route(k);a.className='omega-module-chip';a.textContent=label(k);a.dataset.module=k;
    picker.appendChild(a);
  });
  main.insertBefore(picker,main.firstChild);
  if(AS_TABS.length){
    var host=document.createElement('section');
    host.id='hub-tools';
    host.setAttribute('aria-label','Tools in this workspace');
    host.setAttribute('data-omega-panels',JSON.stringify(AS_TABS.map(function(k){return [k,label(k).toUpperCase(),route(k)];})));
    host.setAttribute('data-omega-panels-label','Tools in this workspace');
    main.insertBefore(host,picker.nextSibling);
    if(window.OmegaPanels){window.OmegaPanels.boot();}
    else if(!document.querySelector('script[src="/omega-panels.js"]')){var ps=document.createElement('script');ps.src='/omega-panels.js';ps.defer=true;document.head.appendChild(ps);}
  }
  window.OmegaSinglePage={open:function(k){if(modules.indexOf(k)>=0)location.href=route(k);},close:function(){},modules:modules.slice()};
})();
