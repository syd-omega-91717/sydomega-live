/* SYD OMEGA 91717 - sovereign sidebar. Injects HTML + its own CSS into <aside id="omega-side" data-page="KEY">. */
(function () {
  var el = document.getElementById('omega-side');
  if (!el) return;
  var page = el.getAttribute('data-page') || ((location.pathname.split('/').pop()||'').replace('.html','')) || 'dashboard';

  /* --- Inject nav CSS once so every page gets it without relying on local <style> --- */
  if (!document.getElementById('omega-nav-css')) {
    var st = document.createElement('style');
    st.id = 'omega-nav-css';
    st.textContent = [
      '.brand{font-family:"Cinzel Decorative",serif;font-weight:900;color:#C9A84C;font-size:20px;letter-spacing:1px;text-align:center;padding:4px 0}',
      '.brand small{display:block;font-family:"Courier Prime",monospace;font-size:9px;color:#85837b;letter-spacing:4px;margin-top:6px}',
      '.nav{margin-top:18px;display:flex;flex-direction:column;gap:1px}',
      '.nav a,.nav .lk{display:flex;align-items:center;justify-content:space-between;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:1.5px;color:#e9e6dc;padding:9px 12px;border-left:2px solid transparent;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:all .12s}',
      '.nav a:hover{color:#C9A84C;border-left-color:#C9A84C;background:rgba(201,168,76,.05)}',
      '.nav a.on{color:#C9A84C;border-left-color:#C9A84C;background:rgba(201,168,76,.07)}',
      '.nav .sec{font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:3px;color:#85837b;margin:14px 0 4px 12px;padding-bottom:4px;border-bottom:1px solid rgba(201,168,76,.12)}',
      '.nav .lk{color:#85837b;cursor:default}',
      '.nav .lk .ph{font-size:7px;letter-spacing:1px;color:#8B0000;border:1px solid rgba(139,0,0,.5);padding:2px 4px}',
      '.omega-back{display:flex;align-items:center;justify-content:center;gap:8px;font-family:"Courier Prime",monospace;font-size:10px;letter-spacing:2px;color:#00E5FF;padding:9px 12px;margin:12px 0 4px;cursor:pointer;border:1px solid rgba(201,168,76,.16);background:rgba(0,229,255,.04);transition:all .14s;user-select:none}',
      '.omega-back:hover{border-color:#00E5FF;background:rgba(0,229,255,.10)}',
      '.nav-out{margin-top:18px;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;color:#00E5FF;padding:10px 12px;cursor:pointer;border-top:1px solid rgba(201,168,76,.16);display:flex;align-items:center;gap:6px}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  /* --- Sectioned nav definition --- */
  var SECTIONS = [
    { label: 'COMMAND', items: [
      ['dashboard','DASHBOARD','/dashboard.html'],
      ['beacon','THE BEACON \u00B7 START','/beacon.html'],
      ['search','SEARCH','/search.html'],
      ['notifications','NOTIFICATIONS','/notifications.html'],
    ]},
    { label: 'IDENTITY', items: [
      ['profile','PROFILE','/profile.html'],
      ['passport','SOVEREIGN PASSPORT','/passport.html'],
      ['settings','SETTINGS','/settings.html'],
    ]},
    { label: 'ASCEND', items: [
      ['ascension','ASCENSION','/ascension.html'],
      ['intelligence','INTELLIGENCE \u00B7 ANALYTICS','/intelligence.html'],
      ['portfolio','INVESTMENT \u00B7 PORTFOLIO','/portfolio.html'],
      ['income','INCOME \u00B7 ALLOCATION','/income.html'],
      ['automation','AUTOMATION ENGINE','/automation.html'],
      ['research','RESEARCH \u00B7 DISCOVERY','/research.html'],
      ['exam','EXAM HALL','/exam.html'],
    ]},
    { label: 'COSMOS', items: [
      ['gates','THE TWELVE GATES','/gates.html'],
      ['kings','THE 28 KINGS','/kings.html'],
      ['matrix','THE LATTICE \u00B7 729','/matrix.html'],
      ['triads','THE TWELVE TRIADS','/triads.html'],
      ['agents','AI AGENTS','/agents.html'],
      ['chatbot','CONCIERGE','/chatbot.html'],
      ['honors','HONORS','/honors.html'],
    ]},
    { label: 'CELESTIAL', items: [
      ['horoscope','HOROSCOPE','/horoscope.html'],
      ['pantheons','PANTHEONS','/pantheons.html'],
      ['elements','THE NINE ELEMENTS','/elements.html'],
    ]},
    { label: 'LEARN \u00B7 PROVE', items: [
      ['academy','ACADEMY','/academy.html'],
      ['gaming','GAMING ARENA','/gaming.html'],
      ['contributions','CONTRIBUTIONS','/contributions.html'],
    ]},
    { label: 'SERVICES', items: [
      ['consultancy','CONSULTANCY','/consultancy.html'],
      ['contracts','COMMISSIONS','/contracts.html'],
      ['media','MEDIA HUB','/media.html'],
      ['cinema','CINEMA \u00B7 SAGA','/cinema.html'],
      ['news','NEWS \u00B7 WIRE','/news.html'],
      ['social','SOCIAL HUB','/social.html'],
      ['publishing','PUBLISHING','/publishing.html'],
      ['marketing','MARKETING','/marketing.html'],
      ['health','HEALTH \u00B7 WELLNESS','/health.html'],
      ['events','EVENTS \u00B7 CONFERENCES','/events.html'],
      ['travel','TRAVEL \u00B7 EXPERIENCES','/travel.html'],
    ]},
    { label: 'ECONOMY', items: [
      ['treasury','TREASURY','/treasury.html'],
      ['blockchain','BLOCKCHAIN \u00B7 NFT','/blockchain.html'],
      ['wallet','SOVEREIGN WALLET','/wallet.html'],
      ['membership','MEMBERSHIP','/membership.html'],
      ['marketplace','MARKETPLACE','/marketplace.html'],
      ['sigil','SIGIL VAULT','/sigil.html'],
    ]},
    { label: 'THE ORDER', items: [
      ['family','FAMILY \u00B7 LINEAGE','/family.html'],
      ['bloodline','BLOODLINE VAULT','/bloodline.html'],
      ['heritage','HERITAGE ARCHIVE','/heritage.html'],
      ['hall','HALL OF THE ORDER','/hall.html'],
      ['sovereigns','HALL OF SOVEREIGNS','/sovereigns.html'],
      ['factions','THE 12 FACTIONS','/factions.html'],
      ['city','&#937; CITY','/city.html'],
      ['city','&#937; CITY &amp; INFRASTRUCTURE','/city.html'],
    ]},
    { label: 'SYSTEM', items: [
      ['grid','THE GRID \u00B7 INFRASTRUCTURE','/grid.html'],
      ['compliance','GOVERNANCE \u00B7 COMPLIANCE','/compliance.html'],
      ['charter','CHARTER','/charter.html'],
      ['approvals','APPROVALS','/approvals.html'],
      ['public','PUBLIC SITE','/'],
    ]},
  ];

  var h = '<div class="brand">\u03A9 SYD OMEGA<small>9 1 7 1 7</small></div>';
  h += '<div class="omega-back" id="omega-back">\u2190 BACK</div>';
  h += '<nav class="nav">';

  for (var s = 0; s < SECTIONS.length; s++) {
    var sec = SECTIONS[s];
    h += '<div class="sec">' + sec.label + '</div>';
    for (var i = 0; i < sec.items.length; i++) {
      var it = sec.items[i], on = (it[0] === page);
      h += '<a' + (on ? ' class="on"' : '') + ' href="' + (on ? '#' : it[2]) + '">' + it[1] + '</a>';
    }
  }

  h += '</nav>';
  h += '<div class="nav-out" id="logout">LOG OUT \u2192</div>';
  el.innerHTML = h;

  /* Back button */
  var back = document.getElementById('omega-back');
  if (back) {
    back.addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = '/dashboard.html';
    });
  }
})();
