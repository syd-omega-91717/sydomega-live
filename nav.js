/* SYD OMEGA 91717 - sovereign sidebar + mobile bottom nav.
   Injects its own CSS into every app page. HOME + BACK side by side at top. */
(function () {
  var el = document.getElementById('omega-side');
  if (!el) return;
  var page = el.getAttribute('data-page') ||
    ((location.pathname.split('/').pop() || '').replace('.html', '')) || 'dashboard';

  /* --- Inject nav CSS (self-contained, no page dependency) --- */
  if (!document.getElementById('omega-nav-css')) {
    var st = document.createElement('style'); st.id = 'omega-nav-css';
    st.textContent = [
      ':root{--void:#07070b;--panel:#0d0d15;--gold:#C9A84C;--solar:#E2C86D;--cyan:#00E5FF;--crim:#8B0000;--green:#3fb27f;--ink:#e9e6dc;--muted:#85837b;--line:rgba(201,168,76,0.16)}',
      '.brand{font-family:"Cinzel Decorative",serif;font-weight:900;color:#C9A84C;font-size:18px;letter-spacing:1px;text-align:center;padding:4px 0;line-height:1.2}',
      '.brand small{display:block;font-family:"Courier Prime",monospace;font-size:8px;color:#85837b;letter-spacing:4px;margin-top:5px}',
      /* HOME + BACK row */
      '.nav-hb{display:flex;gap:6px;margin:14px 0 4px}',
      '.nav-home,.nav-back{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;padding:9px 6px;cursor:pointer;border:1px solid rgba(201,168,76,.2);background:rgba(201,168,76,.04);color:#C9A84C;transition:all .14s;user-select:none;text-decoration:none}',
      '.nav-home:hover{background:rgba(201,168,76,.14);border-color:#C9A84C}',
      '.nav-back{color:#00E5FF;border-color:rgba(0,229,255,.2);background:rgba(0,229,255,.04)}',
      '.nav-back:hover{background:rgba(0,229,255,.14);border-color:#00E5FF}',
      '.nav{margin-top:4px;display:flex;flex-direction:column;gap:1px}',
      '.nav a{display:flex;align-items:center;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:1.5px;color:#e9e6dc;padding:9px 12px;border-left:2px solid transparent;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:all .12s}',
      '.nav a:hover{color:#C9A84C;border-left-color:#C9A84C;background:rgba(201,168,76,.05)}',
      '.nav a.on{color:#C9A84C;border-left-color:#C9A84C;background:rgba(201,168,76,.07)}',
      '.nav .sec{font-family:"Courier Prime",monospace;font-size:8px;letter-spacing:3px;color:#85837b;margin:13px 0 3px 12px;padding-bottom:4px;border-bottom:1px solid rgba(201,168,76,.1)}',
      '.nav-out{margin-top:14px;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;color:#00E5FF;padding:10px 12px;cursor:pointer;border-top:1px solid rgba(201,168,76,.14);display:flex;align-items:center;gap:6px}',
      '.nav-out:hover{color:#C9A84C}',
      /* Mobile bottom nav */
      '.omega-mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:9990;background:rgba(7,7,11,.97);border-top:1px solid rgba(201,168,76,.2);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}',
      '.omega-mobile-nav ul{display:flex;list-style:none;margin:0;padding:0}',
      '.omega-mobile-nav ul li{flex:1}',
      '.omega-mobile-nav ul li a{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px 12px;text-decoration:none;gap:3px;transition:color .15s}',
      '.omega-mobile-nav ul li a .mn-icon{font-size:18px;line-height:1}',
      '.omega-mobile-nav ul li a .mn-label{font-family:"Courier Prime",monospace;font-size:7px;letter-spacing:1.5px;color:#85837b}',
      '.omega-mobile-nav ul li a.on .mn-icon{color:#C9A84C;text-shadow:0 0 10px rgba(201,168,76,.5)}',
      '.omega-mobile-nav ul li a.on .mn-label{color:#C9A84C}',
      '.omega-mobile-nav ul li a:not(.on) .mn-icon{color:#55534e}',
      '@media(max-width:760px){.omega-mobile-nav{display:block}body{padding-bottom:70px}.side{display:none!important}}',
      '@media(min-width:761px){.omega-mobile-nav{display:none}}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  /* --- Sectioned nav --- */
  var SECTIONS = [
    { label: 'COMMAND', items: [
      ['dashboard','DASHBOARD','/dashboard.html'],
      ['beacon','THE BEACON','/beacon.html'],
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
      ['intelligence','INTELLIGENCE','/intelligence.html'],
      ['portfolio','PORTFOLIO','/portfolio.html'],
      ['income','INCOME & ALLOCATION','/income.html'],
      ['automation','AUTOMATION ENGINE','/automation.html'],
      ['research','RESEARCH & DISCOVERY','/research.html'],
      ['prediction','GLOBAL PREDICTION','/prediction.html'],
      ['exam','EXAM HALL','/exam.html'],
    ]},
    { label: 'COSMOS', items: [
      ['gates','THE TWELVE GATES','/gates.html'],
      ['kings','THE 28 KINGS','/kings.html'],
      ['matrix','THE LATTICE','/matrix.html'],
      ['triads','THE TWELVE TRIADS','/triads.html'],
      ['character','CHARACTER SYSTEM','/character.html'],
      ['agents','AI AGENTS','/agents.html'],
      ['chatbot','CONCIERGE','/chatbot.html'],
      ['honors','HONORS','/honors.html'],
      ['trophies','TROPHY VAULT','/trophies.html'],
    ]},
    { label: 'CELESTIAL', items: [
      ['horoscope','HOROSCOPE','/horoscope.html'],
      ['pantheons','PANTHEONS','/pantheons.html'],
      ['elements','THE NINE ELEMENTS','/elements.html'],
    ]},
    { label: 'LEARN & PROVE', items: [
      ['academy','ACADEMY','/academy.html'],
      ['gaming','GAMING ARENA','/gaming.html'],
      ['contributions','CONTRIBUTIONS','/contributions.html'],
    ]},
    { label: 'SERVICES', items: [
      ['consultancy','CONSULTANCY','/consultancy.html'],
      ['contracts','COMMISSIONS','/contracts.html'],
      ['media','MEDIA HUB','/media.html'],
      ['cinema','CINEMA & SAGA','/cinema.html'],
      ['universe','CREATIVE UNIVERSE','/universe.html'],
      ['news','NEWS & WIRE','/news.html'],
      ['social','SOCIAL HUB','/social.html'],
      ['publishing','PUBLISHING','/publishing.html'],
      ['marketing','MARKETING','/marketing.html'],
      ['health','HEALTH & WELLNESS','/health.html'],
      ['events','EVENTS','/events.html'],
      ['travel','TRAVEL','/travel.html'],
    ]},
    { label: 'ECONOMY', items: [
      ['treasury','TREASURY','/treasury.html'],
      ['blockchain','BLOCKCHAIN & NFT','/blockchain.html'],
      ['wallet','SOVEREIGN WALLET','/wallet.html'],
      ['payments','PAYMENTS','/payments.html'],
      ['membership','MEMBERSHIP','/membership.html'],
      ['marketplace','MARKETPLACE','/marketplace.html'],
      ['sigil','SIGIL VAULT','/sigil.html'],
    ]},
    { label: 'THE ORDER', items: [
      ['family','FAMILY & LINEAGE','/family.html'],
      ['bloodline','BLOODLINE VAULT','/bloodline.html'],
      ['heritage','HERITAGE ARCHIVE','/heritage.html'],
      ['hall','HALL OF THE ORDER','/hall.html'],
      ['sovereigns','HALL OF SOVEREIGNS','/sovereigns.html'],
      ['factions','THE 12 FACTIONS','/factions.html'],
      ['city','OMEGA CITY','/city.html'],
    ]},
    { label: 'SYSTEM', items: [
      ['grid','THE GRID','/grid.html'],
      ['compliance','GOVERNANCE','/compliance.html'],
      ['research','RESEARCH','/research.html'],
      ['charter','CHARTER','/charter.html'],
      ['approvals','APPROVALS','/approvals.html'],
    ]},
  ];

  /* Build sidebar HTML */
  var h = '<div class="brand">\u03A9 SYD OMEGA<small>9 1 7 1 7</small></div>';
  h += '<div class="nav-hb">';
  h += '<a class="nav-home" href="/dashboard.html">\u2302 HOME</a>';
  h += '<div class="nav-back" id="omega-back">\u2190 BACK</div>';
  h += '</div>';
  h += '<nav class="nav">';

  var seenKeys = {};
  for (var s = 0; s < SECTIONS.length; s++) {
    var sec = SECTIONS[s];
    h += '<div class="sec">' + sec.label + '</div>';
    for (var i = 0; i < sec.items.length; i++) {
      var it = sec.items[i];
      if (seenKeys[it[0]]) continue; /* no duplicates */
      seenKeys[it[0]] = 1;
      var on = (it[0] === page);
      h += '<a' + (on ? ' class="on"' : '') + ' href="' + (on ? '#' : it[2]) + '">' + it[1] + '</a>';
    }
  }
  h += '</nav>';
  h += '<div class="nav-out" id="logout">LOG OUT \u2192</div>';
  el.innerHTML = h;

  /* Back button */
  var back = document.getElementById('omega-back');
  if (back) back.addEventListener('click', function () {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/dashboard.html';
  });

  /* --- Mobile bottom navigation bar --- */
  if (!document.getElementById('omega-mobile-nav')) {
    var MOB_ITEMS = [
      { key: 'dashboard', icon: '\u03A9', label: 'HOME', href: '/dashboard.html' },
      { key: 'search',    icon: '\u25C9', label: 'SEARCH', href: '/search.html' },
      { key: 'notifications', icon: '\u25CF', label: 'ALERTS', href: '/notifications.html' },
      { key: 'profile',   icon: '\u25C8', label: 'PROFILE', href: '/profile.html' },
      { key: 'beacon',    icon: '\u2726', label: 'BEACON', href: '/beacon.html' },
    ];
    var mob = document.createElement('nav'); mob.id = 'omega-mobile-nav';
    mob.className = 'omega-mobile-nav';
    var ul = document.createElement('ul');
    MOB_ITEMS.forEach(function (m) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = m.href;
      if (m.key === page) a.className = 'on';
      a.innerHTML = '<span class="mn-icon">' + m.icon + '</span><span class="mn-label">' + m.label + '</span>';
      li.appendChild(a); ul.appendChild(li);
    });
    mob.appendChild(ul);
    document.body.appendChild(mob);
  }
})();
