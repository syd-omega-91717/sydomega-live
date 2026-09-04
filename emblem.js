/* SYD OMEGA 91717 - per-page living emblem engine v2.
   Injects a cinematic rotating canvas sigil + label into every app page header.
   Auto-loaded by bg.js. Pointer-reactive. Reduced-motion safe. Hidden < 560px. */
(function () {
  if (document.getElementById('omega-emblem-wrap')) return;
  if (window.innerWidth < 560) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var side = document.getElementById('omega-side');
  var key  = (side && side.getAttribute('data-page')) ||
             (location.pathname.split('/').pop() || '').replace('.html', '') ||
             'dashboard';

  /* key -> [motif, n, color, glyph, label] */
  var MAP = {
    dashboard:       ['orb',   3,  '#E2C86D', '\u03A9',  'COMMAND'],
    beacon:          ['rays',  12, '#00E5FF', '\u2726',  'THE BEACON'],
    notifications:   ['ring',  6,  '#00E5FF', '\u25C9',  'ALERTS'],
    search:          ['orbit', 2,  '#00E5FF', '\u25C9',  'THE LENS'],
    profile:         ['ring',  1,  '#C9A84C', '\u25C8',  'THE SELF'],
    passport:        ['poly',  5,  '#E2C86D', '\u273A',  'THE SEAL'],
    ascension:       ['arc',   9,  '#C9A84C', '\u25B2',  'THE ASCENT'],
    intelligence:    ['ring',  3,  '#E2C86D', '\u25CF',  'ANALYTICS'],
    portfolio:       ['orbit', 6,  '#00E5FF', '\u263C',  'PORTFOLIO'],
    income:          ['arc',   6,  '#C9A84C', '\u03A9',  'INCOME & ALLOCATION'],
    portal:          ['orb',   3,  '#C9A84C', '\u03A9',  'SOVEREIGN PORTAL'],
    gates:           ['ring',  12, '#00E5FF', '\u2302',  'THE TWELVE GATES'],
    kings:           ['ring',  28, '#E2C86D', '\u265B',  'THE 28 KINGS'],
    matrix:          ['poly',  3,  '#00E5FF', '\u25C7',  'THE 729'],
    triads:          ['poly',  3,  '#C9A84C', '\u25B3',  'THE TRIADS'],
    agents:          ['ring',  12, '#00E5FF', '\u25C9',  'THE TWELVE MINDS'],
    chatbot:         ['orbit', 3,  '#00E5FF', '\u2756',  'THE CONCIERGE'],
    honors:          ['ring',  8,  '#E2C86D', '\u272A',  'THE HONORS'],
    horoscope:       ['ring',  12, '#C9A84C', '\u2609',  'THE WHEEL'],
    pantheons:       ['orbit', 4,  '#E2C86D', '\u232C',  'CROSS-PANTHEON'],
    factions:        ['poly',  6,  '#C4453C', '\u25C6',  'THE 12 FACTIONS'],
    city:            ['orb',   9,  '#C9A84C', '\u03A9',  'OMEGA CITY'],
    elements:        ['rays',  5,  '#D9B86A', '\u2605',  'THE ELEMENTS'],
    academy:         ['arc',   9,  '#00E5FF', '\u2756',  'KNOWLEDGE ENGINE'],
    gaming:          ['poly',  8,  '#00E5FF', '\u2694',  'MASTERY ENGINE'],
    contributions:   ['ring',  9,  '#C9A84C', '\u25C8',  'CONTRIBUTION AXIS'],
    treasury:        ['orb',   1,  '#C9A84C', '\u03A9',  'THE TREASURY'],
    wallet:          ['orbit', 3,  '#00E5FF', '\u20BF',  'INNER VAULT'],
    membership:      ['ring',  9,  '#E2C86D', '\u272F',  'THE ORDER TIERS'],
    marketplace:     ['orbit', 6,  '#C9A84C', '\u2118',  'SOVEREIGN MARKET'],
    blockchain:      ['poly',  12, '#00E5FF', '\u26AF',  'BLOCKCHAIN LAYER'],
    consultancy:     ['ring',  6,  '#E2C86D', '\u262F',  'COUNSEL CHAMBER'],
    contracts:       ['arc',   4,  '#C9A84C', '\u270D',  'CONTRACTS'],
    publishing:      ['ring',  4,  '#E2C86D', '\u2394',  'PUBLISHING'],
    media:           ['orbit', 4,  '#00E5FF', '\u25BA',  'MEDIA VAULT'],
    cinema:          ['rays',  8,  '#C4453C', '\u25D9',  'THE CINEMA'],
    news:            ['ring',  6,  '#00E5FF', '\u25CF',  'INTELLIGENCE FEED'],
    social:          ['ring',  7,  '#C9A84C', '\u2743',  'SOCIAL HUB'],
    marketing:       ['orbit', 3,  '#E2C86D', '\u25C8',  'SIGNAL CORPS'],
    health:          ['ring',  9,  '#3fb27f', '\u2665',  'HEALTH & WELLNESS'],
    events:          ['orbit', 6,  '#00E5FF', '\u2741',  'EVENTS'],
    travel:          ['arc',   7,  '#9B6BF0', '\u2708',  'TRAVEL'],
    sovereigns:      ['arc',   9,  '#E2C86D', '\u265A',  'HALL OF SOVEREIGNS'],
    family:          ['orbit', 3,  '#C9A84C', '\u2665',  'LINEAGE'],
    settings:        ['ring',  4,  '#C4453C', '\u2699',  'SYSTEM SETTINGS'],
    automation:      ['rays',  9,  '#00E5FF', '\u21D2',  'AUTOMATION ENGINE'],
    heritage:        ['arc',   5,  '#C9A84C', '\u22D4',  'HERITAGE ARCHIVE'],
    sigil:           ['poly',  6,  '#C9A84C', '\u25C6',  'YOUR SIGIL'],
    evolution:       ['arc',   9,  '#00E5FF', '\u21D2',  'EVOLUTION FRAMEWORK'],
    interface_omni:  ['orb',   1,  '#C9A84C', '\u03A9',  'CONTROL DECK']
  };

  var cfg = MAP[key] || ['ring', 6, '#C9A84C', '\u03A9', key.toUpperCase()];
  var motif  = cfg[0], n = cfg[1], col = cfg[2], glyph = cfg[3], label = cfg[4];

  /* --- build wrapper --- */
  var wrap = document.createElement('div');
  wrap.id = 'omega-emblem-wrap';
  Object.assign(wrap.style, {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginLeft: 'auto', padding: '0 20px', userSelect: 'none', cursor: 'default',
    flexShrink: '0'
  });

  /* --- canvas --- */
  var SIZE = 64;
  var cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  Object.assign(cv.style, { width: SIZE + 'px', height: SIZE + 'px', display: 'block' });

  var lbl = document.createElement('span');
  lbl.textContent = label;
  Object.assign(lbl.style, {
    fontFamily: '"Cinzel Decorative", serif', fontSize: '9px',
    letterSpacing: '2px', color: col, opacity: '0.75',
    textTransform: 'uppercase', maxWidth: '120px',
    lineHeight: '1.3', display: 'none'
  });
  if (window.innerWidth >= 900) lbl.style.display = 'block';

  wrap.appendChild(cv);
  wrap.appendChild(lbl);

  /* --- inject into topbar --- */
  var tb = document.querySelector('.topbar');
  if (!tb) return;
  tb.appendChild(wrap);

  /* --- pointer parallax --- */
  var px = 0, py = 0, speed = 0.4;
  document.addEventListener('mousemove', function (e) {
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  wrap.addEventListener('mouseenter', function () { speed = 1.4; });
  wrap.addEventListener('mouseleave', function () { speed = 0.4; });

  /* --- draw loop --- */
  var ctx = cv.getContext('2d');
  var t = 0, cx = SIZE / 2, cy = SIZE / 2, R = SIZE / 2 - 4;

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    var ti = reduce ? 0 : t;
    var tx = reduce ? 0 : px * 3, ty2 = reduce ? 0 : py * 3;

    ctx.save();
    ctx.translate(cx + tx, cy + ty2);

    /* --- shared armillary frame ---------------------------------------
       Drawn under every motif so the mark reads as one instrument across all
       ~250 pages, while each page keeps its own motif inside it. Measured
       before this: the emblem was a faint arc that barely registered against
       the topbar at 64px. Three cheap layers fix that without touching any
       page's motif: a fixed outer bezel, twelve ticks on the zodiac (every
       third longer and brighter, so the twelve-fold structure reads at a
       glance), and one counter-rotating scan arc. Frozen when `reduce` is
       set, since ti is pinned to 0 above. */
    var BR = R * 0.96;
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(0, 0, BR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201,168,76,.22)'; ctx.lineWidth = 0.7; ctx.stroke();

    for (var bi = 0; bi < 12; bi++) {
      var ba = -ti * 0.35 + bi * Math.PI / 6;
      var major = bi % 3 === 0;
      var bin = BR - (major ? 5 : 2.5);
      ctx.beginPath();
      ctx.moveTo(Math.cos(ba) * bin, Math.sin(ba) * bin);
      ctx.lineTo(Math.cos(ba) * BR, Math.sin(ba) * BR);
      ctx.strokeStyle = major ? 'rgba(226,200,109,.5)' : 'rgba(201,168,76,.24)';
      ctx.lineWidth = major ? 1 : 0.6;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, BR - 3, ti * 0.6, ti * 0.6 + 1.1);
    ctx.strokeStyle = col; ctx.globalAlpha = 0.42; ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (motif === 'ring') {
      for (var i = 0; i < n; i++) {
        var a = (ti * 0.8 + i * (Math.PI * 2 / n));
        var r2 = R * (0.55 + 0.22 * Math.sin(ti * 1.3 + i));
        var dotX = Math.cos(a) * r2, dotY = Math.sin(a) * r2;
        var sz = 2.2 + Math.sin(ti * 1.7 + i) * 1.1;
        ctx.beginPath(); ctx.arc(dotX, dotY, sz, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.globalAlpha = 0.55 + 0.4 * Math.sin(ti + i);
        ctx.fill();
      }
    } else if (motif === 'poly') {
      var sides = Math.max(3, n);
      ctx.beginPath();
      for (var i = 0; i <= sides; i++) {
        var a = ti * 0.5 + i * (Math.PI * 2 / sides) - Math.PI / 2;
        var x = Math.cos(a) * R, y = Math.sin(a) * R;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (motif === 'orbit') {
      for (var i = 0; i < n; i++) {
        var a = ti * (0.4 + i * 0.15) + i * (Math.PI * 2 / n);
        var r2 = R * (0.3 + i * 0.22);
        if (r2 > R) continue;
        var x = Math.cos(a) * r2, y = Math.sin(a) * r2;
        ctx.beginPath(); ctx.arc(x, y, 2.5 - i * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.globalAlpha = 0.7 - i * 0.15; ctx.fill();
      }
    } else if (motif === 'rays') {
      var nr = Math.min(n, 16);
      for (var i = 0; i < nr; i++) {
        var a = ti * 0.6 + i * (Math.PI * 2 / nr);
        var len = R * (0.4 + 0.5 * Math.abs(Math.sin(ti * 0.9 + i)));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.strokeStyle = col; ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(ti + i));
        ctx.lineWidth = 1; ctx.stroke();
      }
    } else if (motif === 'arc') {
      var arcs = Math.min(n, 9);
      for (var i = 0; i < arcs; i++) {
        var r2 = R * ((i + 1) / (arcs + 1));
        var start = ti * (0.4 + i * 0.05);
        var span = Math.PI * (0.4 + 0.4 * Math.sin(ti * 0.7 + i));
        ctx.beginPath();
        ctx.arc(0, 0, r2, start, start + span);
        ctx.strokeStyle = col; ctx.globalAlpha = 0.4 + 0.3 * Math.sin(ti + i);
        ctx.lineWidth = 1.2; ctx.stroke();
      }
    } else {
      /* orb */
      var grad = ctx.createRadialGradient(tx * 0.3, ty2 * 0.3, 2, 0, 0, R * 0.9);
      grad.addColorStop(0, col);
      grad.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(0, 0, R * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.globalAlpha = 0.22 + 0.08 * Math.sin(ti * 1.2);
      ctx.fill();
    }

    /* centre glyph */
    ctx.globalAlpha = 0.85 + 0.12 * Math.sin(ti * 0.9);
    ctx.fillStyle = col;
    ctx.font = '18px "Cinzel Decorative", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, 0, 1);

    ctx.restore();
    t += 0.018 * speed;
    requestAnimationFrame(draw);
  }

  if (reduce) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = col; ctx.font = '22px "Cinzel Decorative", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(glyph, cx, cy);
  } else {
    draw();
  }
})();
