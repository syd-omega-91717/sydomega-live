/* Ω STUDIOS WORLDS page logic (worlds.html). The canon arrives only from the approval-gated studio-canon function;
   it is not a static file. The twelve signs and gods come from window.OmegaCanon. Every status shown is the data's
   own status; this file decides nothing about canon. */
(function () {
  'use strict';
  var ST = ['FOUNDER_APPROVED', 'REPO_CANON', 'MERGED_DRAFT', 'RECONCILED_PROPOSED', 'PROPOSED', 'OPEN'];
  var LABEL = { FOUNDER_APPROVED: 'FOUNDER APPROVED', REPO_CANON: 'REPO CANON', MERGED_DRAFT: 'MERGED DRAFT', RECONCILED_PROPOSED: 'RECONCILED', PROPOSED: 'PROPOSED', OPEN: 'OPEN' };
  var TABS = [['kings', 'KINGS'], ['city', 'CITY'], ['pantheons', 'PANTHEONS'], ['sky', 'SKY'], ['planets', 'PLANETS']];
  var SEC = { kings: 'thrones', city: 'places', pantheons: 'pantheons' };
  var D = null, index = {}, state = { tab: 'kings', filter: 'ALL', sel: null, orbit: false };
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = { raf: 0, last: 0, bodies: [], t: 0 };

  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    for (k in (attrs || {})) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag), k;
    for (k in (attrs || {})) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function badge(st) { return h('span', { 'class': 'wd-badge wd-s-' + st, text: LABEL[st] || st }); }
  function canon() { return (window.OmegaCanon && window.OmegaCanon.ready) ? window.OmegaCanon : null; }
  function charName(id) { var c = D.characters[id]; return c ? c.name : id; }

  /* ---- index: every id in the data file, whatever section it is in */
  function buildIndex() {
    index = {};
    ['worlds', 'places', 'thrones', 'pantheons'].forEach(function (sec) { D[sec].forEach(function (e) { index[e.id] = { sec: sec, e: e }; }); });
    D.sky.events.forEach(function (e) { index[e.id] = { sec: 'events', e: e }; });
  }
  function tabOf(rec) { return { thrones: 'kings', places: 'city', pantheons: 'pantheons', events: 'sky', worlds: 'planets' }[rec.sec]; }

  /* ---- connections: derived from the data's own references, never typed twice */
  function connections(rec) {
    var out = [], e = rec.e;
    function add(id, why) { if (index[id]) out.push({ id: id, why: why }); }
    if (rec.sec === 'thrones') {
      if (e.seat) add(e.seat, 'seat');
      if (e.derive === 'worlds-with-track') D.worlds.filter(function (x) { return x.track; }).forEach(function (x) { add(x.id, 'world'); });
    } else if (rec.sec === 'places') {
      if (e.world) add(e.world, 'on world');
      D.thrones.forEach(function (t) { if (t.seat === e.id) add(t.id, 'throne here'); });
    } else if (rec.sec === 'worlds') {
      D.places.forEach(function (p) { if (p.world === e.id) add(p.id, 'place here'); });
      if (e.track) add('throne-twelve', 'seat of the Accord');
      if (e.parent) add(e.parent, 'orbits');
    } else if (rec.sec === 'pantheons') {
      if (e.id === 'twelve-light') D.worlds.filter(function (x) { return x.track; }).forEach(function (x) { add(x.id, 'world'); });
      if (e.derive === 'worlds-shadow') add('twelve-light', 'light counterpart');
    }
    return out;
  }

  /* ---- detail panel */
  function renderDetail() {
    var box = document.getElementById('wd-detail'), rec = state.sel && index[state.sel];
    if (!rec) { box.hidden = true; box.textContent = ''; return; }
    var e = rec.e;
    box.hidden = false; box.textContent = '';
    box.appendChild(h('h2', { text: e.name }));
    box.appendChild(h('div', {}, [badge(e.status)]));
    var meta = [];
    if (e.franchise) meta.push(e.franchise.replace(/-/g, ' ').toUpperCase());
    if (e.kind && e.kind !== 'open') meta.push(String(e.kind).toUpperCase());
    if (e.ruler) meta.push('RULER ' + e.ruler.toUpperCase());
    if (e.shadow) meta.push('SHADOW ' + e.shadow.toUpperCase());
    if (e.world) meta.push('WORLD ' + (index[e.world] ? index[e.world].e.name : e.world).toUpperCase() + (e.worldBasis ? ' (' + e.worldBasis.toUpperCase() + ')' : ''));
    if (e.worldBasis === undefined && e.world === null && rec.sec === 'places' && e.status !== 'OPEN') meta.push('WORLD NOT DECIDED');
    if (meta.length) box.appendChild(h('p', { 'class': 'wd-meta', text: meta.join(' · ') }));
    if (e.note) box.appendChild(h('p', { 'class': 'wd-note', text: e.note }));
    if (e.holders && e.holders.length) {
      box.appendChild(h('h3', { text: 'HOLDERS' }));
      box.appendChild(h('ul', {}, e.holders.map(function (x) {
        return h('li', {}, [h('span', { 'class': 'wd-meta', text: charName(x.character) + ' · ' + x.state.toUpperCase() + (x.note ? ' · ' + x.note : '') })]);
      })));
    }
    var cn = connections(rec);
    if (cn.length) {
      box.appendChild(h('h3', { text: 'CONNECTED TO' }));
      box.appendChild(h('ul', {}, cn.map(function (c) {
        var b = h('button', { type: 'button', 'class': 'wd-link', text: index[c.id].e.name + ' · ' + c.why });
        b.addEventListener('click', function () { go(c.id); });
        return h('li', {}, [b]);
      })));
    }
    if (e.sources && e.sources.length) {
      box.appendChild(h('h3', { text: 'SOURCES' }));
      box.appendChild(h('ul', {}, e.sources.map(function (x) { return h('li', {}, [h('span', { 'class': 'wd-src', text: x })]); })));
    } else if (e.status === 'OPEN') {
      box.appendChild(h('h3', { text: 'SOURCES' }));
      box.appendChild(h('p', { 'class': 'wd-meta', text: 'NONE · OPEN' }));
    }
    if (e.approvedBy) box.appendChild(h('p', { 'class': 'wd-meta', text: 'APPROVED IN ' + e.approvedBy }));
  }

  /* ---- cards */
  function card(rec) {
    var e = rec.e, cur = state.sel === e.id;
    var el = h('div', { 'class': 'card wd-card' + (e.status === 'OPEN' ? ' wd-open' : ''), id: 'wd-' + e.id, role: 'button', tabindex: '0', 'aria-label': e.name + ', ' + (LABEL[e.status] || e.status) }, [
      badge(e.status),
      h('div', { 'class': 'wd-name', text: e.name }),
      h('p', { 'class': 'wd-meta', text: [e.franchise ? e.franchise.replace(/-/g, ' ') : '', e.kind && e.kind !== 'open' ? e.kind : ''].filter(Boolean).join(' · ').toUpperCase() }),
      null
    ]);
    if (cur) el.setAttribute('aria-current', 'true');
    el.style.setProperty('--card-accent', { FOUNDER_APPROVED: '#5fd18a', REPO_CANON: '#e2c86d', MERGED_DRAFT: '#4fe3ff', RECONCILED_PROPOSED: '#4fe3ff', PROPOSED: '#b69cff', OPEN: '#ff9a9a' }[e.status]);
    el.addEventListener('click', function () { select(e.id); });
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(e.id); } });
    return el;
  }
  function visible(e) { return state.filter === 'ALL' || e.status === state.filter; }

  function renderGrid(list) {
    var g = h('div', { 'class': 'wd-grid' });
    var shown = list.filter(function (r) { return visible(r.e); });
    shown.forEach(function (r) { g.appendChild(card(r)); });
    if (!shown.length) g.appendChild(h('p', { 'class': 'wd-meta', text: 'NONE' }));
    return g;
  }
  function recs(sec) { return D[sec].map(function (e) { return { sec: sec, e: e }; }); }

  /* ---- tab bodies */
  function bodyKings() {
    var w = h('div', {});
    w.appendChild(renderGrid(recs('thrones')));
    return w;
  }
  function bodyCity() {
    var w = h('div', {});
    var a = h('a', { href: '/city.html', 'class': 'wd-link', text: 'MEMBER CITY' }); a.style.display = 'inline-block'; a.style.margin = '0 0 10px';
    w.appendChild(a);
    w.appendChild(renderGrid(recs('places')));
    return w;
  }
  function bodyPantheons() {
    var w = h('div', {});
    w.appendChild(renderGrid(recs('pantheons')));
    var C = canon();
    if (state.sel === 'twelve-light') {
      var list = h('ul', { 'class': 'wd-rings' });
      D.pantheons.filter(function (p) { return p.id === 'twelve-light'; })[0].members.forEach(function (m) {
        var t = C && C.track(m.track), wd = D.worlds.filter(function (x) { return x.track === m.track; })[0];
        list.appendChild(h('li', { text: (t ? t.sign.toUpperCase() + ' · ' + t.god + ' · ' + String(t.element).toUpperCase() : 'TRACK ' + m.track) + (wd ? ' · ' + wd.name + ' (' + wd.status.replace(/_/g, ' ') + ')' : '') }));
      });
      w.appendChild(h('div', { 'class': 'sechead', text: 'THE TWELVE LIGHT RULERS' }));
      w.appendChild(list);
    }
    return w;
  }

  function polar(cx, cy, r, deg) { var a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }

  function bodySky() {
    var w = h('div', { 'class': 'wd-stage' }), C = canon();
    var svg = s('svg', { viewBox: '0 0 640 640', 'class': 'wd-svg', role: 'group', 'aria-label': 'The twelve sky-signs and the worlds that belong to them' });
    svg.appendChild(s('circle', { cx: 320, cy: 320, r: 300, fill: 'none', stroke: 'rgba(201,168,76,.35)' }));
    svg.appendChild(s('circle', { cx: 320, cy: 320, r: 150, fill: 'none', stroke: 'rgba(201,168,76,.2)' }));
    svg.appendChild(s('text', { x: 320, y: 310, 'text-anchor': 'middle', text: 'SOLAR ACCORD' }));
    svg.appendChild(s('text', { x: 320, y: 330, 'text-anchor': 'middle', text: '12 WORLDS · 12,000 YEARS' }));
    D.worlds.filter(function (x) { return x.track; }).sort(function (a, b) { return a.track - b.track; }).forEach(function (wd) {
      var deg = (wd.track - 1) * 30, p = polar(320, 320, 225, deg), q = polar(320, 320, 285, deg), t = C && C.track(wd.track);
      var col = { REPO_CANON: '#e2c86d', PROPOSED: '#b69cff', FOUNDER_APPROVED: '#5fd18a', OPEN: '#ff9a9a' }[wd.status] || '#4fe3ff';
      var g = s('g', { 'class': 'wd-hit', id: 'wd-svg-' + wd.id, tabindex: '0', role: 'button', 'aria-label': (t ? t.sign + ', ' : '') + wd.ruler + ', ' + wd.name + ', ' + (LABEL[wd.status] || wd.status) });
      if (state.sel === wd.id) g.setAttribute('aria-current', 'true');
      g.appendChild(s('line', { x1: 320, y1: 320, x2: q[0], y2: q[1], stroke: 'rgba(255,255,255,.08)' }));
      g.appendChild(s('circle', { cx: p[0], cy: p[1], r: 30, fill: 'rgba(10,10,15,.9)', stroke: col, 'stroke-width': 2, 'stroke-dasharray': wd.status === 'PROPOSED' ? '5 4' : '' }));
      g.appendChild(s('circle', { cx: p[0], cy: p[1], r: 36, 'class': 'wd-halo' }));
      g.appendChild(s('text', { x: p[0], y: p[1] - 2, 'text-anchor': 'middle', text: t ? t.sign.slice(0, 3).toUpperCase() : String(wd.track) }));
      g.appendChild(s('text', { x: p[0], y: p[1] + 13, 'text-anchor': 'middle', text: wd.ruler.slice(0, 10) }));
      var lp = polar(320, 320, 275, deg);
      g.appendChild(s('text', { x: lp[0], y: lp[1], 'text-anchor': 'middle', 'class': 'wd-lab' + (state.sel === wd.id ? ' on' : ''), text: wd.name }));
      g.addEventListener('click', function () { select(wd.id, true); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(wd.id, true); } });
      svg.appendChild(g);
    });
    var side = h('div', {});
    side.appendChild(h('div', { 'class': 'sechead', text: 'THE NINE-RING WALL' }));
    var ul = h('ol', { 'class': 'wd-rings', 'aria-label': 'Nine rings, seven inscribed and two blank' });
    D.sky.rings.inscribed.forEach(function (n, i) { ul.appendChild(h('li', { text: 'RING ' + (i + 1) + ' · ' + n.toUpperCase() })); });
    for (var b = 0; b < D.sky.rings.blank; b++) ul.appendChild(h('li', { 'class': 'wd-blank', text: 'RING ' + (D.sky.rings.inscribed.length + b + 1) + ' · BLANK' }));
    side.appendChild(ul);
    side.appendChild(h('div', { 'class': 'sechead', text: 'EVENTS OF THE SKY' }));
    side.appendChild(renderGrid(D.sky.events.map(function (e) { return { sec: 'events', e: e }; })));
    w.appendChild(svg); w.appendChild(side);
    return w;
  }

  function bodyPlanets() {
    var w = h('div', {}), stage = h('div', { 'class': 'wd-stage' });
    var svg = s('svg', { viewBox: '0 0 640 640', 'class': 'wd-svg', role: 'group', 'aria-label': 'Orrery of the thirteen worlds. The same worlds are listed as cards below.' });
    var R = function (k) { return k === 0 ? 0 : 40 + (k - 1) * 28; };
    for (var k = 1; k <= 10; k++) svg.appendChild(s('circle', { cx: 320, cy: 320, r: R(k), fill: 'none', stroke: 'rgba(255,255,255,.08)' }));
    anim.bodies = [];
    var byId = {};
    D.worlds.forEach(function (wd, i) {
      var size = wd.kind === 'star' ? 16 : (wd.kind === 'moon' ? 5 : (wd.kind === 'dwarf' || wd.kind === 'asteroid') ? 6 : ({ jupiter: 13, saturn: 12, uranus: 10, neptune: 10 }[wd.id] || 9));
      var col = { REPO_CANON: '#e2c86d', PROPOSED: '#b69cff', FOUNDER_APPROVED: '#5fd18a' }[wd.status] || '#4fe3ff';
      var g = s('g', { 'class': 'wd-hit', id: 'wd-svg-' + wd.id, tabindex: '0', role: 'button', 'aria-label': wd.name + (wd.ruler ? ', ruled by ' + wd.ruler : ', no ruler') + ', ' + (LABEL[wd.status] || wd.status) });
      if (state.sel === wd.id) g.setAttribute('aria-current', 'true');
      g.appendChild(s('circle', { r: size + 7, 'class': 'wd-halo' }));
      g.appendChild(s('circle', { r: size, fill: wd.kind === 'star' ? 'rgba(255,190,70,.55)' : 'rgba(10,10,15,.95)', stroke: col, 'stroke-width': 2, 'stroke-dasharray': wd.status === 'PROPOSED' ? '4 3' : '' }));
      var lab = s('text', { x: size + 6, y: 4, 'class': 'wd-lab' + (state.sel === wd.id ? ' on' : ''), text: wd.name });
      g.appendChild(lab);
      g.addEventListener('click', function () { select(wd.id, true); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(wd.id, true); } });
      var b = { wd: wd, g: g, ang: (i * 137.5) % 360, r: R(wd.ring), size: size };
      byId[wd.id] = b; anim.bodies.push(b);
    });
    anim.bodies.forEach(function (b) { svg.appendChild(b.g); });
    anim.svg = svg; anim.byId = byId; placeBodies();
    var side = h('div', {});
    var btn = h('button', { type: 'button', 'class': 'wd-btn', 'aria-pressed': state.orbit ? 'true' : 'false', text: reduced ? 'ORBIT OFF' : 'ORBIT' });
    if (reduced) btn.disabled = true;
    btn.addEventListener('click', function () { state.orbit = !state.orbit; btn.setAttribute('aria-pressed', state.orbit ? 'true' : 'false'); if (state.orbit) loop(); else cancelAnimationFrame(anim.raf); });
    side.appendChild(btn);
    stage.appendChild(svg); stage.appendChild(side); w.appendChild(stage);
    w.appendChild(renderGrid(recs('worlds')));
    return w;
  }
  function placeBodies() {
    anim.bodies.forEach(function (b) {
      var x, y;
      if (b.wd.parent && anim.byId[b.wd.parent]) { var P = anim.byId[b.wd.parent], pa = polar(320, 320, P.r, P.ang), ma = polar(pa[0], pa[1], 22, b.ang * 3); x = ma[0]; y = ma[1]; /* a satellite rides its parent */ }
      else { var p = polar(320, 320, b.r, b.ang); x = p[0]; y = p[1]; }
      b.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
    });
  }
  function loop() {
    cancelAnimationFrame(anim.raf);
    function tick(t) {
      if (!state.orbit || state.tab !== 'planets' || document.hidden) { return; }
      if (t - anim.last > 40) { var dt = (t - anim.last) / 1000; anim.last = t; anim.bodies.forEach(function (b) { if (b.wd.ring > 0) b.ang = (b.ang + 6 * dt / Math.pow(b.wd.ring, 1.5)) % 360; }); placeBodies(); }
      anim.raf = requestAnimationFrame(tick);
    }
    anim.last = performance.now(); anim.raf = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && state.orbit && state.tab === 'planets') loop(); });

  /* ---- shell */
  function renderTabs() {
    var bar = document.getElementById('wd-tabs'); bar.textContent = '';
    TABS.forEach(function (t, i) {
      var b = h('button', { type: 'button', 'class': 'wd-tab', role: 'tab', id: 'wd-tab-' + t[0], 'aria-selected': state.tab === t[0] ? 'true' : 'false', 'aria-controls': 'wd-body', tabindex: state.tab === t[0] ? '0' : '-1', text: t[1] });
      b.addEventListener('click', function () { setTab(t[0]); });
      b.addEventListener('keydown', function (ev) {
        var d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return; ev.preventDefault();
        var n = TABS[(i + d + TABS.length) % TABS.length][0]; setTab(n); document.getElementById('wd-tab-' + n).focus();
      });
      bar.appendChild(b);
    });
  }
  function sectionRecs() {
    if (SEC[state.tab]) return recs(SEC[state.tab]);
    if (state.tab === 'sky') return D.sky.events.map(function (e) { return { sec: 'events', e: e }; });
    return recs('worlds');
  }
  function renderChips() {
    var bar = document.getElementById('wd-chips'); bar.textContent = '';
    var list = sectionRecs(), counts = {};
    list.forEach(function (r) { counts[r.e.status] = (counts[r.e.status] || 0) + 1; });
    [['ALL', 'ALL ' + list.length]].concat(ST.filter(function (x) { return counts[x]; }).map(function (x) { return [x, LABEL[x] + ' ' + counts[x]]; })).forEach(function (c) {
      var b = h('button', { type: 'button', 'class': 'wd-chip', 'aria-pressed': state.filter === c[0] ? 'true' : 'false', text: c[1] });
      b.addEventListener('click', function () { state.filter = c[0]; render(); });
      bar.appendChild(b);
    });
  }
  function renderBody() {
    var box = document.getElementById('wd-body'); box.textContent = '';
    box.setAttribute('aria-labelledby', 'wd-tab-' + state.tab);
    var view;
    switch (state.tab) {
      case 'city': view = bodyCity(); break;
      case 'pantheons': view = bodyPantheons(); break;
      case 'sky': view = bodySky(); break;
      case 'planets': view = bodyPlanets(); break;
      default: view = bodyKings();
    }
    box.appendChild(view);
    if (state.tab === 'planets' && state.orbit && !reduced) loop();
  }
  function renderQuestions() {
    var box = document.getElementById('wd-questions'); box.textContent = '';
    D.openQuestions.forEach(function (q) {
      var row = h('ul', {});
      q.subjects.forEach(function (id) {
        if (!index[id]) return;
        var b = h('button', { type: 'button', 'class': 'wd-link', text: index[id].e.name });
        b.addEventListener('click', function () { go(id); });
        row.appendChild(h('li', {}, [b]));
      });
      box.appendChild(h('div', { 'class': 'wd-q' }, [h('p', { text: q.question }), row]));
    });
  }
  function render() { renderTabs(); renderChips(); renderDetail(); renderBody(); renderQuestions(); }
  function setTab(t) { state.tab = t; state.filter = 'ALL'; state.sel = null; cancelAnimationFrame(anim.raf); writeHash(); render(); }
  function select(id, fromSvg) { state.sel = state.sel === id ? null : id; writeHash(); render(); var el = document.getElementById((fromSvg ? 'wd-svg-' : 'wd-') + id); if (el) el.focus(); }
  function go(id) { var rec = index[id]; if (!rec) return; state.tab = tabOf(rec); state.filter = 'ALL'; state.sel = id; cancelAnimationFrame(anim.raf); writeHash(); render(); var el = document.getElementById('wd-' + id); (el || document.getElementById('wd-detail')).scrollIntoView({ block: 'center' }); }
  function writeHash() { try { history.replaceState(null, '', '#' + state.tab + (state.sel ? '/' + state.sel : '')); } catch (e) { /* hash is a convenience only */ } }
  function readHash() {
    var p = (location.hash || '').replace('#', '').split('/');
    if (TABS.some(function (t) { return t[0] === p[0]; })) state.tab = p[0];
    if (p[1] && index[p[1]]) state.sel = p[1];
  }

  /* ---- load: only an approved session gets the canon; a refusal is shown, never swallowed into an empty page */
  function fail(msg) { var b = document.getElementById('wd-body'); b.textContent = ''; b.appendChild(h('p', { 'class': 'wd-err', role: 'alert', text: msg })); }
  /* Why the load failed, in one short line. RESTRICTED and APPROVAL REQUIRED are the two refusals; anything else names the HTTP status and the
     function's own error code (both are fixed server strings, shown with textContent) so UNAVAILABLE can be told apart: 404 not deployed, 5xx function, NO RESPONSE network or CORS. */
  function why(e) {
    if (e && e.code === 'owner_only') return 'RESTRICTED';
    if (e && (e.status === 401 || e.status === 403)) return 'APPROVAL REQUIRED';
    var part = e && e.status ? String(e.status) : (e && e.message === 'empty' ? 'EMPTY' : 'NO RESPONSE');
    var code = e && typeof e.code === 'string' && /^[a-z_]{1,40}$/.test(e.code) ? ' · ' + e.code : '';
    var why2 = e && typeof e.reason === 'string' && /^[A-Za-z0-9_]{1,24}$/.test(e.reason) ? ' · ' + e.reason : '';
    return 'UNAVAILABLE · ' + part + code + why2;
  }
  function load() {
    if (!window.OmegaSB) return Promise.reject(new Error('no client'));
    return window.OmegaSB.get().then(function (sb) { return sb.functions.invoke('studio-canon', { body: {} }); }).then(function (r) {
      if (r && r.error) {
        var e = new Error(r.error.message || 'error'), ctx = r.error.context;
        e.status = ctx && ctx.status;
        /* the function names why it refused; read it so an approved member is told RESTRICTED, not asked to get approved */
        return (ctx && ctx.json ? ctx.json().catch(function () { return null; }) : Promise.resolve(null)).then(function (b) { e.code = b && b.error; e.reason = b && b.reason; throw e; });
      }
      if (!r || !r.data || !r.data.canon) throw new Error('empty');
      return r.data.canon;
    });
  }
  load().then(function (data) {
    D = data; buildIndex(); readHash();
    document.getElementById('wd-foot').textContent = D.canonVersion + ' · ' + D.asOf;
    render();
    /* The twelve gods and signs come from the canon module. bg.js injects it after this script runs, so wait for
       it (up to ~6 s) and re-render when ready; without it the page still works and shows track numbers. */
    var tries = 0, wait = setInterval(function () {
      var C = window.OmegaCanon;
      if (C && C.ready) { clearInterval(wait); render(); }
      else if (C && C.onReady) { clearInterval(wait); C.onReady(function () { render(); }); }
      else if (++tries > 60) { clearInterval(wait); }
    }, 100);
  }).catch(function (e) { fail(why(e)); });
})();
