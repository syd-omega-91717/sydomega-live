/* SYD OMEGA 91717 — shared sovereign sidebar. Inject into <aside id="omega-side" data-page="KEY">. */
(function () {
  var el = document.getElementById('omega-side');
  if (!el) return;
  var page = el.getAttribute('data-page');
  if (!page) { page = ((location.pathname.split('/').pop() || '').replace('.html','')) || 'home'; }

  var LIVE = [
    ['dashboard','DASHBOARD','/dashboard.html'],
    ['search','SEARCH','/search.html'],
    ['profile','PROFILE','/profile.html'],
    ['ascension','ASCENSION','/ascension.html'],
    ['gates','THE TWELVE GATES','/gates.html'],
    ['kings','THE 28 KINGS','/kings.html'],
    ['matrix','THE LATTICE','/matrix.html'],
    ['agents','AI AGENTS','/agents.html'],
    ['chatbot','CONCIERGE','/chatbot.html'],
    ['honors','HONORS','/honors.html'],
    ['horoscope','HOROSCOPE','/horoscope.html'],
    ['pantheons','PANTHEONS','/pantheons.html'],
    ['academy','ACADEMY','/academy.html'],
    ['gaming','GAMING ARENA','/gaming.html'],
    ['contributions','CONTRIBUTIONS','/contributions.html'],
    ['consultancy','CONSULTANCY','/consultancy.html'],
    ['contracts','COMMISSIONS','/contracts.html'],
    ['media','MEDIA HUB','/media.html'],
    ['cinema','CINEMA · SAGA','/cinema.html'],
    ['news','NEWS · WIRE','/news.html'],
    ['social','SOCIAL','/social.html'],
    ['publishing','PUBLISHING','/publishing.html'],
    ['marketing','MARKETING','/marketing.html'],
    ['treasury','TREASURY','/treasury.html'],
    ['sigil','SIGIL VAULT','/sigil.html'],
    ['family','FAMILY · HERITAGE','/family.html'],
    ['hall','HALL OF THE ORDER','/hall.html'],
    ['factions','THE 12 FACTIONS','/factions.html'],
    ['settings','SETTINGS','/settings.html'],
    ['charter','CHARTER','/charter.html'],
    ['approvals','APPROVALS','/approvals.html'],
    ['public','PUBLIC SITE','/']
  ];
  var LOCKED = ['MARKETPLACE'];

  var h = '<div class="brand">\u03A9 SYD OMEGA<small>9 1 7 1 7</small></div><nav class="nav">';
  for (var i = 0; i < LIVE.length; i++) {
    var it = LIVE[i], on = (it[0] === page);
    h += '<a' + (on ? ' class="on"' : '') + ' href="' + (on ? '#' : it[2]) + '">' + it[1] + '</a>';
  }
  h += '<div class="sec">PHASE II \u2014 ACTIVATING</div>';
  for (var j = 0; j < LOCKED.length; j++) { h += '<div class="lk">' + LOCKED[j] + ' <span class="ph">SOON</span></div>'; }
  h += '</nav><div class="out" id="logout">LOG OUT \u2192</div>';

  el.innerHTML = h;
})();
