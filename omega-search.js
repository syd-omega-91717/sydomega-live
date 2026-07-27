/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN SEARCH ENGINE
   Ctrl+K opens overlay. Searches pages, tracks, elements, Olympians, canon.
   ========================================================================== */
(function(){
  if(window.__omegaSearchActive) return;
  window.__omegaSearchActive=true;
  var CAT_COLORS={PAGE:'var(--gold,#C9A84C)',TRACK:'var(--cyan,#00E5FF)',ELEMENT:'var(--purple,#9B6BF0)',OLYMPIAN:'var(--solar,#E2C86D)',CANON:'var(--green,#3fb27f)'};
  var INDEX=[
    {t:'DASHBOARD',d:'Authority, axes, overview — command centre',u:'/dashboard.html',c:'PAGE'},
    {t:'VAULT',d:'Reserve, wallet, NFT, earning ledger, articles, audit',u:'/vault.html',c:'PAGE'},
    {t:'GAMING UNIVERSE',d:'144 games — Axis B Mastery',u:'/gaming.html',c:'PAGE'},
    {t:'LEADERBOARD',d:'Daily authority ranking — all sovereign members',u:'/leaderboard.html',c:'PAGE'},
    {t:'ACHIEVEMENTS',d:'12 gates — trophies, medals, certificates',u:'/achievements.html',c:'PAGE'},
    {t:'ANALYTICS',d:'Data science, ML, algorithm intelligence',u:'/analytics.html',c:'PAGE'},
    {t:'INTELLIGENCE',d:'AI systems, nine-fold lattice, deep learning',u:'/intelligence.html',c:'PAGE'},
    {t:'CHATBOT',d:'AI concierge — Anthropic Claude powered sovereign guide',u:'/chatbot.html',c:'PAGE'},
    {t:'PROFILE',d:'Identity, credentials, membership status',u:'/profile.html',c:'PAGE'},
    {t:'HERITAGE',d:'Bloodline, lineage, historical archive',u:'/heritage.html',c:'PAGE'},
    {t:'COSMOS',d:'Planet systems, 12 Olympians, astral mapping',u:'/cosmos.html',c:'PAGE'},
    {t:'ELEMENTS',d:'9 sovereign elements — Fire Water Wind Metal Sand Soul Space Void Ninth',u:'/elements.html',c:'PAGE'},
    {t:'HOROSCOPE',d:'12 zodiac signs, birth charts, element assignment',u:'/horoscope.html',c:'PAGE'},
    {t:'KNOWLEDGE GRAPH',d:'Node graph — tracks, elements, gates, concepts',u:'/knowledge.html',c:'PAGE'},
    {t:'PRIVACY CENTRE',d:'GDPR consent, data export, right to erasure',u:'/privacy.html',c:'PAGE'},
    {t:'POINTS',d:'Matrix progression — axis values, lattice position',u:'/points.html',c:'PAGE'},
    {t:'BLOCKCHAIN',d:'NFT, token economy, wallet, marketplace',u:'/blockchain.html',c:'PAGE'},
    {t:'INVESTMENT',d:'Portfolio, crypto holdings, income tracker',u:'/investment.html',c:'PAGE'},
    {t:'CONSULTANCY',d:'Expert services — medical, legal, engineering',u:'/consultancy.html',c:'PAGE'},
    {t:'APPROVALS',d:'Owner only — trial grants, permanent access',u:'/approvals.html',c:'PAGE'},
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
    {t:'ELEMENT FIRE',d:'Aries Leo Sagittarius — drive ambition sovereign force',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT WATER',d:'Cancer Scorpio Pisces — depth intuition flow',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT WIND',d:'Gemini Libra Aquarius — intellect connection speed',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT METAL',d:'Taurus Virgo Capricorn — structure will precision',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SAND',d:'Boundary element — transition between physical forces',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SOUL',d:'Metaphysical — inner dimension of sovereign identity',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT SPACE',d:'Metaphysical — outer dimension expansion cosmos',u:'/cosmos.html',c:'ELEMENT'},
    {t:'ELEMENT VOID',d:'Metaphysical — the absence that contains everything',u:'/elements.html',c:'ELEMENT'},
    {t:'ELEMENT THE NINTH',d:'Transcendent — activates at Stage 9 for all sovereign members',u:'/elements.html',c:'ELEMENT'},
    {t:'ARES ARIES',d:'God of war — sovereign founder Aries Fire ARENITE token',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'APHRODITE TAURUS',d:'Goddess of beauty — Taurus Metal element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'APOLLO GEMINI',d:'God of knowledge and light — Gemini Wind element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'HERMES VIRGO',d:'Messenger god — Virgo Metal element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'POSEIDON SCORPIO',d:'God of seas — Scorpio Water element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ZEUS SAGITTARIUS',d:'King of Olympians — Sagittarius Fire element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ATHENA LIBRA',d:'Goddess of wisdom — Libra Wind element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'ARTEMIS CANCER',d:'Goddess of hunt — Cancer Water element',u:'/cosmos.html',c:'OLYMPIAN'},
    {t:'AUTHORITY FORMULA',d:'AUTH=sqrt(A3+B3+C3)xphi/e Apex=27.8367 A=Knowledge B=Mastery C=Contribution',u:'/analytics.html',c:'CANON'},
    {t:'ARENITE TOKEN',d:'Founder token Aries sign Major Sleiman Youssef Dagher',u:'/vault.html',c:'CANON'},
    {t:'9x9x9 LATTICE',d:'729 inner cube nodes The Plane 12x12x9^3=104976 canonical',u:'/points.html',c:'CANON'},
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
    if(!q||q.length<1)return[];
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
      el.innerHTML='<div style="padding:20px;text-align:center;font-family:var(--M,\'Courier Prime\',monospace);font-size:9px;letter-spacing:2px;color:rgba(138,134,118,.4)">NO RESULTS FOR \u201C'+q.toUpperCase()+'\u201D \u00b7 TRY A DIFFERENT TERM</div>';
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
        +'<span style="font-family:\'Cinzel Decorative\',serif;font-size:18px;color:rgba(201,168,76,.5)">\u03A9</span>'
        +'<input id="omega-s-inp" type="search" placeholder="SEARCH THE SOVEREIGN PLATFORM\u2026" autocomplete="off" spellcheck="false" style="flex:1;background:none;border:none;outline:none;font-family:var(--M,\'Courier Prime\',monospace);font-size:13px;color:#e9e6dc;letter-spacing:1.5px" aria-label="Search">'
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
      /* Show popular on open */
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
