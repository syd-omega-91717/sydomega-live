/* SYD OMEGA 91717 &mdash; shared sovereign sidebar. Inject into <aside id="omega-side" data-page="KEY">. */
(function () {
  var el = document.getElementById('omega-side');
  if (!el) return;
  var page = el.getAttribute('data-page');
  if (!page) { page = ((location.pathname.split('/').pop() || '').replace('.html','')) || 'home'; }

  var LIVE = [
    ['dashboard','DASHBOARD','/dashboard.html'],
    ['beacon','THE BEACON &middot; START','/beacon.html'],
    ['search','SEARCH','/search.html'],
    ['notifications','NOTIFICATIONS','/notifications.html'],
    ['profile','PROFILE','/profile.html'],
    ['passport','SOVEREIGN PASSPORT','/passport.html'],
    ['ascension','ASCENSION','/ascension.html'],
    ['intelligence','INTELLIGENCE & ANALYTICS','/intelligence.html'],
    ['portfolio','INVESTMENT & PORTFOLIO','/portfolio.html'],
    ['income','INCOME &amp; ALLOCATION','/income.html'],
    ['automation','AUTOMATION ENGINE','/automation.html'],
    ['gates','THE TWELVE GATES','/gates.html'],
    ['kings','THE 28 KINGS','/kings.html'],
    ['matrix','THE LATTICE','/matrix.html'],
    ['triads','THE TWELVE TRIADS','/triads.html'],
    ['agents','AI AGENTS','/agents.html'],
    ['chatbot','CONCIERGE','/chatbot.html'],
    ['honors','HONORS','/honors.html'],
    ['horoscope','HOROSCOPE','/horoscope.html'],
    ['pantheons','PANTHEONS','/pantheons.html'],
    ['elements','THE NINE ELEMENTS','/elements.html'],
    ['academy','ACADEMY','/academy.html'],
    ['gaming','GAMING ARENA','/gaming.html'],
    ['contributions','CONTRIBUTIONS','/contributions.html'],
    ['consultancy','CONSULTANCY','/consultancy.html'],
    ['contracts','COMMISSIONS','/contracts.html'],
    ['media','MEDIA HUB','/media.html'],
    ['cinema','CINEMA &middot; SAGA','/cinema.html'],
    ['news','NEWS &middot; WIRE','/news.html'],
    ['social','SOCIAL','/social.html'],
    ['publishing','PUBLISHING','/publishing.html'],
    ['marketing','MARKETING','/marketing.html'],
    ['treasury','TREASURY','/treasury.html'],
    ['blockchain','BLOCKCHAIN &middot; NFT','/blockchain.html'],
    ['wallet','SOVEREIGN WALLET','/wallet.html'],
    ['membership','MEMBERSHIP','/membership.html'],
    ['marketplace','MARKETPLACE','/marketplace.html'],
    ['sigil','SIGIL VAULT','/sigil.html'],
    ['family','FAMILY &middot; HERITAGE','/family.html'],
    ['heritage','HERITAGE ARCHIVE','/heritage.html'],
    ['hall','HALL OF THE ORDER','/hall.html'],
    ['sovereigns','HALL OF SOVEREIGNS','/sovereigns.html'],
    ['factions','THE 12 FACTIONS','/factions.html'],
    ['settings','SETTINGS','/settings.html'],
    ['charter','CHARTER','/charter.html'],
    ['approvals','APPROVALS','/approvals.html'],
    ['public','PUBLIC SITE','/']
  ];
  var LOCKED = [];

  var backStyle = 'display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--mono);font-size:11px;letter-spacing:2px;color:var(--cyan);padding:10px 12px;margin:14px 0 4px;cursor:pointer;border:1px solid var(--line);background:rgba(0,229,255,.04);transition:all .14s;user-select:none';

  var h = '<div class="brand">\u03A9 SYD OMEGA<small>9 1 7 1 7</small></div>';
  h += '<div id="omega-back" style="' + backStyle + '">\u2190 BACK</div>';
  h += '<nav class="nav">';
  for (var i = 0; i < LIVE.length; i++) {
    var it = LIVE[i], on = (it[0] === page);
    h += '<a' + (on ? ' class="on"' : '') + ' href="' + (on ? '#' : it[2]) + '">' + it[1] + '</a>';
  }
  if (LOCKED.length) {
    h += '<div class="sec">PHASE II \u2014 ACTIVATING</div>';
    for (var j = 0; j < LOCKED.length; j++) { h += '<div class="lk">' + LOCKED[j] + ' <span class="ph">SOON</span></div>'; }
  }
  h += '</nav><div class="out" id="logout">LOG OUT \u2192</div>';

  el.innerHTML = h;

  var back = document.getElementById('omega-back');
  if (back) {
    back.addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = '/dashboard.html';
    });
    back.addEventListener('mouseover', function(){ back.style.borderColor = 'var(--cyan)'; back.style.background = 'rgba(0,229,255,.10)'; });
    back.addEventListener('mouseout', function(){ back.style.borderColor = 'var(--line)'; back.style.background = 'rgba(0,229,255,.04)'; });
  }
})();
