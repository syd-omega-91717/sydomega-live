/* ============================================================================
   SYD OMEGA 91717 — GUIDE
   The platform explained in short answers (guide.html). Public: an applicant
   waiting on approval is exactly who needs it, so bg.js lists guide beside
   terms and charter.

   Every figure is read, not typed: gates, tiers, the matrix size and the
   authority range come from omega-canon.json; the elements from
   omega-elements.json; the twelve agents from omega-agents.json; the section
   map from nav.js (OmegaAxis). A canon change reaches this page with no edit.
   Where a fetch fails, the answer drops the figure rather than inventing one.

   Answers are facts about what exists today. Dormant features (payments,
   tokens) are described as not live, matching platform_settings.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaGuide) return;

  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(href, text) {
    var a = mk('a', 'gd-go', text || 'OPEN');
    a.href = href;
    return a;
  }
  function getJSON(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  var TOPICS = [
    ['start', 'START', '#C9A84C'],
    ['member', 'MEMBERSHIP', '#5EC8C8'],
    ['progress', 'PROGRESS', '#3fb27f'],
    ['world', 'SIGNS & LORE', '#AB82F2'],
    ['money', 'MONEY & TOKENS', '#E8C766'],
    ['privacy', 'PRIVACY', '#E0736B'],
    ['settings', 'SETTINGS', '#8FB8DE']
  ];

  /* Each entry: topic, question, answer (string or function(data) -> node[]),
     optional [href, label]. Keep answers to a sentence or two. */
  function faqs(d) {
    var c = d.canon || {}, auth = c.authority || {}, st = c.structure || {};
    var gates = (auth.gate_names || []).map(function (n, i) {
      return n + ' ' + (auth.gates && auth.gates[i] != null ? auth.gates[i] : '');
    });
    var tiers = (c.tiers || []).map(function (t) { return t.name; });
    var axes = c.axes || {};
    return [
      ['start', 'What is SYD OMEGA 91717?',
        'A private, approval-only platform for personal growth: habits, learning, finance tracking, media and community, told through one world of 12 signs, 9 elements and 12 guide agents.',
        ['/dashboard.html', 'DASHBOARD']],
      ['start', 'How do I find my way around?',
        'The sidebar (the MORE menu on a phone) groups every page into sections, shown below. Press Ctrl+K (⌘K on a Mac) anywhere to jump to any page by name.'],
      ['start', 'Where can I ask something this page does not answer?',
        'Ask the Concierge, the platform\'s AI guide, or use the FEEDBACK button to write to the owner directly.',
        ['/chatbot.html', 'CONCIERGE']],

      ['member', 'How do I join?',
        'Create an account and request access. The owner reviews every request personally.',
        ['/account.html', 'REQUEST ACCESS']],
      ['member', 'Why does it say Pending?',
        'Your request is waiting for the owner\'s decision. There is nothing more to do: you are let in as soon as it is approved.'],
      ['member', 'What is a trial?',
        'The owner can grant a timed trial: full access for 9 minutes 17 seconds, counted from when you confirm it, after which you are signed out automatically.'],
      ['member', 'What is the Dedication target?',
        'A daily engagement goal of 9 hours 17 minutes 17 seconds, tracked by the DEDICATION TODAY timer. It is not the trial: the trial is 9 minutes 17 seconds.'],
      ['member', 'Do I need to pay anything?',
        'No. Payments are not live. Membership tiers list prices, but nothing can be bought until payments are switched on after legal review.'],

      ['progress', 'What are Knowledge, Mastery and Contribution?',
        'Your three axes' + (axes.A ? ' (A, B and C)' : '') + ', each from 0 to ' + ((axes.A && axes.A.apex) || 9) +
        '. They grow as you learn, practise and contribute.',
        ['/matrix.html', 'THE MATRIX']],
      ['progress', 'What is Authority?',
        'One number made from your three axes' + (auth.formula ? ': ' + auth.formula : '') + '.' +
        (auth.genesis != null && auth.apex != null ? ' It runs from ' + auth.genesis + ' to ' + auth.apex + '.' : '')],
      ['progress', 'What are the gates?',
        gates.length ? gates.length + ' Authority thresholds. Crossing one moves you up: ' + gates.join(' · ') + '.'
          : 'Authority thresholds; crossing one moves you up.',
        ['/gates.html', 'GATES']],
      ['progress', 'What is the Matrix?',
        st.total_nodes ? 'The map of all progress: ' + (st.formula || '') + ' = ' + Number(st.total_nodes).toLocaleString('en') + ' nodes.'
          : 'The map of all progress on the platform.',
        ['/matrix.html', 'THE MATRIX']],
      ['progress', 'What are tiers?',
        tiers.length ? tiers.length + ' membership levels, each unlocking more of the platform: ' + tiers.join(' · ') + '.'
          : 'Membership levels, each unlocking more of the platform.'],

      ['world', 'What do the coloured labels mean?', function () { return badgeLegend(); }],
      ['world', 'What are the signs, elements and gods?',
        'Every member is bound to a zodiac sign. The sign sets your element, your patron god and your guide agent (all twelve are shown below).',
        ['/cosmos.html', 'COSMOS']],
      ['world', 'What are the nine elements?', function () { return elementList(d.elements); }],
      ['world', 'Are the agents real AI bots?',
        'They are the platform\'s twelve voices, one per sign, each owning a domain such as security or finance. The Concierge is the AI you can talk to; the agents give it character. None acts on your account by itself.'],

      ['money', 'Are Ω tokens real?',
        'No token is issued, transferable or purchasable. The token economy is switched off pending licensed legal advice, so token figures on the platform are design numbers, not balances.'],
      ['money', 'Is anything charged or stored about my payments?',
        'No payment is taken and no card is stored: payments are not live.'],

      ['privacy', 'Who can see my data?',
        'Database rules keep your records to you. The owner can review accounts to run the platform. Privacy lists what is collected and lets you manage it.',
        ['/privacy.html', 'PRIVACY']],
      ['privacy', 'How do I control consent?',
        'On Privacy you grant or withdraw each kind of consent. Every change is recorded with its date.',
        ['/privacy.html', 'PRIVACY']],
      ['privacy', 'Can I leave or delete my account?',
        'Yes. Privacy and Settings let you deactivate, delete your account, or request erasure of your data.',
        ['/privacy.html', 'PRIVACY']],

      ['settings', 'How do I change the language?',
        'Seven languages: English, العربية, Français, Español, Nederlands, 中文 and हिन्दी. Pick one in Settings, or on the language bar at the foot of any page.',
        ['/settings.html', 'SETTINGS']],
      ['settings', 'The screen feels busy. Can I make it calmer?',
        'Turn on CALM in Settings. It hides the ticker, banners and floating buttons on every page; navigation and visuals stay.',
        ['/settings.html', 'SETTINGS']],
      ['settings', 'Why do some paragraphs show MORE?',
        'Long text is folded to two lines so a page reads at a glance. Tap MORE to read the rest.'],
      ['settings', 'Can I change the background colour?',
        'Yes, in Settings under Background. It applies across the platform on this device.',
        ['/settings.html', 'SETTINGS']]
    ];
  }

  function badgeLegend() {
    var rows = [
      ['PLATFORM MECHANIC', '#3fb27f', 'Computed from your real account. It affects your standing.'],
      ['SYMBOLIC LORE', '#AB82F2', 'Real, consistent content, but decorative. It does not gate or compute anything.'],
      ['CREATIVE FICTION', '#EB7B51', 'Storytelling. Not a statement about your account, the future, or fact.']
    ];
    return rows.map(function (r) {
      var row = mk('div', 'gd-badge-row');
      var b = mk('span', 'gd-badge', r[0]);
      b.style.setProperty('--c', r[1]);
      row.appendChild(b);
      row.appendChild(mk('span', null, r[2]));
      return row;
    });
  }

  function elementList(el) {
    var list = el && el.elements;
    if (!list || !list.length) return [mk('span', null, 'Nine elements in three tiers.')];
    var tiers = {};
    list.forEach(function (e) { (tiers[e.tier] = tiers[e.tier] || []).push(e.name); });
    return Object.keys(tiers).map(function (t) {
      var row = mk('div', 'gd-badge-row');
      row.appendChild(mk('b', null, t));
      row.appendChild(mk('span', null, tiers[t].join(' · ')));
      return row;
    });
  }

  function injectStyle() {
    if (document.getElementById('gd-style')) return;
    var st = document.createElement('style');
    st.id = 'gd-style';
    st.textContent = [
      '.gd{display:flex;flex-direction:column;gap:18px}',
      '.gd-search{width:100%;box-sizing:border-box;background:rgba(0,0,0,.35);border:1px solid rgba(201,168,76,.18);border-radius:14px;padding:15px 18px;color:var(--ink,#E8E4D8);font-family:var(--R,sans-serif);font-size:17px;outline:none}',
      '.gd-search:focus{border-color:rgba(201,168,76,.6);box-shadow:0 0 0 4px rgba(201,168,76,.12)}',
      '.gd-chips{display:flex;gap:8px;flex-wrap:wrap}',
      '.gd .gd-chip{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.02);color:var(--muted,#8A8880);font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;cursor:pointer}',
      '.gd .gd-chip i{width:8px;height:8px;border-radius:50%;background:var(--c)}',
      '.gd .gd-chip[aria-pressed="true"]{color:#0a0a0a;background:var(--c);border-color:var(--c)}',
      '.gd .gd-chip[aria-pressed="true"] i{background:#0a0a0a}',
      '.gd-list{display:flex;flex-direction:column;gap:8px}',
      '.gd details{border:1px solid rgba(255,255,255,.07);border-left:3px solid var(--c);border-radius:10px;background:rgba(255,255,255,.02)}',
      '.gd summary{cursor:pointer;list-style:none;padding:14px 16px;font-family:var(--R,sans-serif);font-size:16px;color:var(--ink,#E8E4D8);display:flex;justify-content:space-between;gap:12px;align-items:center}',
      '.gd summary::-webkit-details-marker{display:none}',
      '.gd summary::after{content:"+";font-family:var(--M,monospace);color:var(--c);font-size:18px;flex:0 0 auto}',
      '.gd details[open] summary::after{content:"\\2212"}',
      '.gd-ans{padding:0 16px 14px;font-family:var(--R,sans-serif);font-size:15px;line-height:1.55;color:var(--ink,#E8E4D8);opacity:.88;display:flex;flex-direction:column;gap:8px}',
      '.gd .gd-go{align-self:flex-start;font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--c);border:1px solid var(--c);border-radius:999px;padding:6px 12px;text-decoration:none}',
      '.gd-badge-row{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}',
      '.gd-badge-row b{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--gold,#C9A84C);min-width:120px}',
      '.gd-badge{font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;color:var(--c);border:1px solid var(--c);border-radius:999px;padding:2px 10px}',
      '.gd-h{font-family:var(--M,monospace);font-size:12px;letter-spacing:3px;color:var(--gold,#C9A84C);margin:14px 0 2px}',
      '.gd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}',
      '.gd .gd-card{display:flex;flex-direction:column;gap:4px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);color:var(--ink,#E8E4D8);text-decoration:none}',
      '.gd .gd-card:hover,.gd .gd-card:focus-visible{border-color:var(--c,#C9A84C)}',
      '.gd-card b{font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;color:var(--c,#C9A84C)}',
      '.gd-card span{font-size:13px;opacity:.8}',
      '.gd-empty{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--muted,#8A8880);padding:12px 0}',
      '.gd-empty a{color:var(--gold,#C9A84C)}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  function topicColour(t) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i][0] === t) return TOPICS[i][2];
    return '#C9A84C';
  }

  function build(root, data) {
    root.textContent = '';
    root.classList.add('gd');
    var list = faqs(data);
    var state = { q: '', t: 'all' };

    var search = mk('input', 'gd-search');
    search.type = 'search';
    search.placeholder = 'Search the guide';
    search.setAttribute('aria-label', 'Search the guide');
    root.appendChild(search);

    var chips = mk('div', 'gd-chips');
    chips.setAttribute('role', 'toolbar');
    chips.setAttribute('aria-label', 'Topics');
    [['all', 'ALL', '#C9A84C']].concat(TOPICS).forEach(function (t) {
      var b = mk('button', 'gd-chip');
      b.type = 'button';
      b.setAttribute('data-t', t[0]);
      b.setAttribute('aria-pressed', t[0] === 'all' ? 'true' : 'false');
      b.style.setProperty('--c', t[2]);
      b.appendChild(mk('i'));
      b.appendChild(document.createTextNode(t[1]));
      chips.appendChild(b);
    });
    root.appendChild(chips);

    var box = mk('div', 'gd-list');
    root.appendChild(box);

    function render() {
      box.textContent = '';
      var q = state.q.trim().toLowerCase();
      var shown = 0;
      list.forEach(function (f) {
        if (state.t !== 'all' && f[0] !== state.t) return;
        var ansText = typeof f[2] === 'string' ? f[2] : '';
        if (q && (f[1] + ' ' + ansText).toLowerCase().indexOf(q) < 0) return;
        var det = mk('details');
        det.style.setProperty('--c', topicColour(f[0]));
        det.appendChild(mk('summary', null, f[1]));
        var ans = mk('div', 'gd-ans');
        if (typeof f[2] === 'function') f[2]().forEach(function (n) { ans.appendChild(n); });
        else ans.appendChild(mk('span', null, f[2]));
        if (f[3]) ans.appendChild(link(f[3][0], f[3][1] + ' →'));
        det.appendChild(ans);
        if (q) det.open = true;
        box.appendChild(det);
        shown++;
      });
      if (!shown) {
        var e = mk('div', 'gd-empty', 'NOT IN THE GUIDE YET. ');
        var a = mk('a', null, 'ASK THE CONCIERGE');
        a.href = '/chatbot.html';
        e.appendChild(a);
        box.appendChild(e);
      }
    }
    search.addEventListener('input', function () { state.q = search.value; render(); });
    chips.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.gd-chip');
      if (!b) return;
      state.t = b.getAttribute('data-t');
      chips.querySelectorAll('.gd-chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      render();
    });
    render();

    /* The map: every section the sidebar holds, from nav.js itself. */
    var ax = window.OmegaAxis;
    if (ax && typeof ax.sections === 'function') {
      root.appendChild(mk('div', 'gd-h', 'THE SECTIONS'));
      var grid = mk('div', 'gd-grid');
      var pages = typeof ax.pages === 'function' ? ax.pages().filter(function (p) { return !p.owner; }) : [];
      ax.sections().forEach(function (s) {
        var n = pages.filter(function (p) { return p.section === s.key; }).length;
        var a = mk('a', 'gd-card');
        a.href = s.href;
        a.style.setProperty('--c', s.col);
        a.appendChild(mk('b', null, s.icon + ' ' + s.label));
        a.appendChild(mk('span', null, n ? n + ' pages' : ''));
        grid.appendChild(a);
      });
      root.appendChild(grid);
    }

    /* The twelve agents, from omega-agents.json. */
    var ag = data.agents && data.agents.agents;
    if (ag && ag.length) {
      root.appendChild(mk('div', 'gd-h', 'THE TWELVE AGENTS'));
      var g2 = mk('div', 'gd-grid');
      ag.forEach(function (x) {
        var a = mk('a', 'gd-card');
        a.href = x.href || '/agents.html';
        a.appendChild(mk('b', null, x.name.toUpperCase()));
        a.appendChild(mk('span', null, x.sign + ' · ' + x.element + ' · ' + x.god));
        a.appendChild(mk('span', null, x.role));
        g2.appendChild(a);
      });
      root.appendChild(g2);
    }
  }

  function waitForAxis(cb) {
    var t0 = Date.now();
    (function tick() {
      if (window.OmegaAxis || Date.now() - t0 > 4000) return cb();
      setTimeout(tick, 100);
    })();
  }

  function mount(root) {
    if (!root || root.__gd) return;
    root.__gd = true;
    injectStyle();
    Promise.all([getJSON('/omega-canon.json'), getJSON('/omega-elements.json'), getJSON('/omega-agents.json')])
      .then(function (r) {
        waitForAxis(function () { build(root, { canon: r[0], elements: r[1], agents: r[2] }); });
      });
  }

  function boot() { document.querySelectorAll('[data-omega-guide]').forEach(mount); }
  window.OmegaGuide = { mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
