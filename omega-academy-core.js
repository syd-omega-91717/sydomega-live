/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-academy-core.js  (academy.html only)

   ACADEMY: study, test and courses on one surface instead of six pages.
   Nothing here re-implements a learning mechanism; it mounts the ones that
   already exist, so a card, an exam or a course behaves exactly as on its
   own page:
     REVIEW   omega-review.js — the one queue over every due flashcard,
              vocabulary word and exam card, scheduled by omega-srs.js.
     TEST     omega-exam-engine.js mounted inline — the same 12-sector bank
              (omega-exam-bank.json), best scores and complete_task credit.
     COURSES  academy_courses (published) + the member's own
              academy_enrollments (RLS: own rows). The lessons and the
              server-graded exam stay on courses.html.
     SHELF    the books in progress on reading.html (omega_reading) and the
              want-to-read list on library.html (omega_library_shelf).

   The stat strip counts only what those owners hold: due items from
   OmegaReview.counts(), sectors passed from OmegaExam.stats(), enrollments
   from Postgres, books from the reading store. An empty source says so; no
   figure is estimated (CLAUDE.md 8.1 class 9). Nothing here writes to
   Supabase -- every write belongs to the mounted module that owns it.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaAcademyCore) return;

  var LENSES = [
    { id: 'review',  label: 'REVIEW',  glyph: '⟲' },
    { id: 'test',    label: 'TEST',    glyph: '✎' },
    { id: 'courses', label: 'COURSES', glyph: '▤' },
    { id: 'shelf',   label: 'SHELF',   glyph: '❑' }
  ];
  var KEY = 'omega_academy_lens';
  var root, els = {}, state = { lens: 'review', sb: null, uid: null, courses: null, enrolled: null, exam: null };

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function read(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function link(href, text, parent, cls) { var a = el('a', cls || 'oac-link', text, parent); a.href = href; return a; }
  function iso(d) { return d.toISOString().slice(0, 10); }

  function style() {
    if (document.getElementById('oac-style')) return;
    var s = document.createElement('style');
    s.id = 'oac-style';
    s.textContent = [
      '.oac{display:grid;gap:14px;margin:18px 0 26px}',
      '.oac-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
      '.oac-stat{display:grid;gap:4px;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);cursor:pointer;text-align:left;color:var(--ink,#eee);overflow:visible}',
      '.oac-stat[aria-pressed="true"]{border-color:var(--gold,#d4af37);background:rgba(212,175,55,.12)}',
      '.oac-stat span{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.16em;color:var(--muted,#9aa)}',
      '.oac-stat b{font-family:var(--R,sans-serif);font-size:var(--fs-5,28px);line-height:1;color:var(--ink,#eee)}',
      '.oac-stat small{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.06em;color:var(--muted,#9aa)}',
      '.oac-panel{padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025);min-height:120px}',
      '.oac-panel[hidden]{display:none}',
      '.oac-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
      '.oac-go{min-height:44px;padding:10px 22px;border-radius:12px;border:1px solid var(--gold,#d4af37);background:rgba(212,175,55,.16);color:var(--ink,#eee);font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.16em;cursor:pointer;overflow:visible}',
      '.oac-go:disabled{opacity:.45;cursor:not-allowed}',
      '.oac-chip{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.1em;padding:5px 10px;border-radius:99px;border:1px solid rgba(255,255,255,.14);color:var(--muted,#9aa)}',
      '.oac-chip b{color:var(--ink,#eee);margin-right:4px}',
      '.oac-link{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.12em;color:var(--muted,#9aa);text-decoration:none;border-bottom:1px dotted currentColor}',
      '.oac-fc{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:4px;align-items:end;height:84px;margin-top:14px}',
      '.oac-fc i{display:block;border-radius:3px 3px 0 0;background:rgba(212,175,55,.55);min-height:2px}',
      '.oac-fc i.today{background:var(--gold,#d4af37)}',
      '.oac-fcx{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:4px;font-family:var(--M,monospace);font-size:var(--fs-1,12px);color:var(--muted,#9aa);text-align:center;margin-top:4px}',
      '.oac-list{display:grid;gap:8px;margin-top:6px}',
      '.oac-item{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);color:var(--ink,#eee);text-decoration:none}',
      '.oac-item small{grid-column:1/-1;font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.08em;color:var(--muted,#9aa)}',
      '.oac-bar{grid-column:1/-1;height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}',
      '.oac-bar i{display:block;height:100%;background:var(--gold,#d4af37)}',
      '.oac-empty{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.1em;color:var(--muted,#9aa)}',
      '@media (max-width:700px){.oac-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.oac-stat b{font-size:var(--fs-4,20px)}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- skeleton ---------- */
  function build() {
    root.textContent = '';
    root.classList.add('oac');
    var stats = el('div', 'oac-stats', null, root);
    stats.setAttribute('role', 'tablist');
    stats.setAttribute('aria-label', 'Academy');
    els.stat = {}; els.panel = {};
    LENSES.forEach(function (l) {
      var b = el('button', 'oac-stat', null, stats);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-lens', l.id);
      b.setAttribute('aria-controls', 'oac-' + l.id);
      el('span', null, l.glyph + ' ' + l.label, b);
      var n = el('b', null, '…', b);
      var sub = el('small', null, '', b);
      b.addEventListener('click', function () { setLens(l.id); });
      els.stat[l.id] = { btn: b, n: n, sub: sub };
    });
    LENSES.forEach(function (l) {
      var p = el('section', 'oac-panel', null, root);
      p.id = 'oac-' + l.id;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-label', l.label);
      els.panel[l.id] = p;
    });
  }

  function setLens(id) {
    state.lens = id;
    try { localStorage.setItem(KEY, id); } catch (e) { /* private mode */ }
    LENSES.forEach(function (l) {
      var on = l.id === id;
      els.stat[l.id].btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      els.stat[l.id].btn.setAttribute('aria-selected', on ? 'true' : 'false');
      els.panel[l.id].hidden = !on;
    });
    if (id === 'test') mountTest();
  }

  function stat(id, n, sub) { els.stat[id].n.textContent = n; els.stat[id].sub.textContent = sub; }

  /* ---------- REVIEW ---------- */
  function dueForecast() {
    /* Items due on each of the next 14 days, read from the same three stores
       and the same due fields omega-srs.js schedules. Overdue counts today. */
    var days = [], t = new Date(), idx = {};
    for (var i = 0; i < 14; i++) { var d = new Date(t); d.setDate(t.getDate() + i); var k = iso(d); idx[k] = i; days.push({ day: k, n: 0 }); }
    var today = days[0].day;
    function add(due) {
      if (!due) { days[0].n++; return; }
      if (due <= today) days[0].n++;
      else if (idx[due] != null) days[idx[due]].n++;
    }
    (read('omega_fc_cards') || []).forEach(function (c) { if (c && c.due) add(c.due); });
    (read('omega_vocab') || []).forEach(function (w) { if (w && w.nextReview) add(w.nextReview); });
    (read('omega_exam') || []).forEach(function (x) { if (x && x.id != null) add(x.nextReview); });
    return days;
  }

  function paintReview() {
    var p = els.panel.review;
    p.textContent = '';
    var c = window.OmegaReview ? window.OmegaReview.counts() : null;
    if (!c) { stat('review', '—', 'queue unavailable'); el('div', 'oac-empty', 'REVIEW QUEUE DID NOT LOAD', p); return; }
    stat('review', String(c.total), c.total ? 'due now' : 'nothing due');
    var row = el('div', 'oac-row', null, p);
    var go = el('button', 'oac-go', c.total ? 'START REVIEW · ' + c.total : 'NOTHING DUE', row);
    go.type = 'button';
    go.disabled = !c.total;
    go.setAttribute('data-omega-review-open', '');
    [['cards', c.cards], ['words', c.words], ['exam cards', c.exams]].forEach(function (x) {
      var ch = el('span', 'oac-chip', null, row);
      el('b', null, String(x[1] || 0), ch);
      ch.appendChild(document.createTextNode(x[0]));
    });
    var days = dueForecast(), max = Math.max.apply(null, days.map(function (d) { return d.n; }).concat([1]));
    var fc = el('div', 'oac-fc', null, p);
    fc.setAttribute('role', 'img');
    fc.setAttribute('aria-label', 'Due over the next 14 days: ' + days.map(function (d) { return d.n; }).join(', '));
    var fx = el('div', 'oac-fcx', null, p);
    days.forEach(function (d, i) {
      var bar = el('i', i === 0 ? 'today' : null, null, fc);
      bar.style.height = Math.round((d.n / max) * 100) + '%';
      bar.title = d.day + ': ' + d.n;
      el('span', null, i === 0 ? 'NOW' : String(+d.day.slice(8)), fx);
    });
    var add = el('div', 'oac-row', null, p);
    add.style.marginTop = '12px';
    link('/flashcard.html', 'ADD CARDS ↗', add);
    link('/vocabulary.html', 'ADD WORDS ↗', add);
    link('/exam.html', 'EXAM CARDS ↗', add);
  }

  /* ---------- TEST ---------- */
  function paintTestStat() {
    var s = window.OmegaExam ? window.OmegaExam.stats() : null;
    if (!s) { stat('test', '—', 'exam engine unavailable'); return; }
    /* Sectors at or above the pass mark -- not the catalogue's "EXAMS PASSED",
       which counts completed catalogue cards (task_completions) below. */
    stat('test', s.passed + '/12', s.attempted ? 'sectors passed · avg ' + s.avg + '%' : 'no sector attempted');
  }
  function mountTest() {
    if (state.exam || !window.OmegaExam) {
      if (!window.OmegaExam) { els.panel.test.textContent = ''; el('div', 'oac-empty', 'EXAM ENGINE DID NOT LOAD', els.panel.test); }
      return;
    }
    state.exam = window.OmegaExam.mount(els.panel.test);
    els.panel.test.addEventListener('omega-exam:update', paintTestStat);
  }

  /* ---------- COURSES ---------- */
  function paintCourses() {
    var p = els.panel.courses;
    p.textContent = '';
    if (state.courses == null) { stat('courses', '…', 'loading'); el('div', 'oac-empty', 'LOADING COURSES…', p); return; }
    if (state.courses === false) { stat('courses', '—', 'unavailable'); el('div', 'oac-empty', 'COURSES UNAVAILABLE · ' + state.coursesErr, p); return; }
    var mine = {};
    (state.enrolled || []).forEach(function (e) { mine[e.course_id] = e; });
    var n = Object.keys(mine).length, done = (state.enrolled || []).filter(function (e) { return e.completed; }).length;
    stat('courses', n + '/' + state.courses.length, n ? done + ' completed' : 'none enrolled');
    if (!state.courses.length) { el('div', 'oac-empty', 'NO PUBLISHED COURSES YET', p); return; }
    var list = el('div', 'oac-list', null, p);
    state.courses.forEach(function (c) {
      var e = mine[c.id], pct = e ? Math.max(0, Math.min(100, Math.round(+e.progress || 0))) : null;
      var a = link('/courses.html', null, list, 'oac-item');
      el('span', null, c.title, a);
      el('span', 'oac-chip', e ? (e.completed ? 'DONE' : pct + '%') : 'START', a);
      var bits = [c.difficulty, c.duration_minutes ? c.duration_minutes + ' min' : null, c.xp_reward ? c.xp_reward + ' XP' : null].filter(Boolean);
      el('small', null, bits.join(' · ').toUpperCase(), a);
      if (e) { var bar = el('div', 'oac-bar', null, a); el('i', null, null, bar).style.width = (e.completed ? 100 : pct) + '%'; }
    });
  }

  async function loadCourses() {
    if (!state.sb) { state.courses = false; state.coursesErr = 'NO DATABASE CLIENT'; paintCourses(); return; }
    var r = await Promise.all([
      state.sb.from('academy_courses').select('id,title,slug,difficulty,duration_minutes,xp_reward').eq('published', true).order('created_at', { ascending: true }),
      state.uid ? state.sb.from('academy_enrollments').select('course_id,progress,completed').eq('profile_id', state.uid) : Promise.resolve({ data: [], error: null })
    ]);
    if (r[0].error) { state.courses = false; state.coursesErr = r[0].error.code || r[0].error.message; paintCourses(); return; }
    state.courses = r[0].data || [];
    state.enrolled = r[1].error ? [] : (r[1].data || []);
    paintCourses();
  }

  /* ---------- SHELF ---------- */
  function paintShelf() {
    var p = els.panel.shelf;
    p.textContent = '';
    var books = (read('omega_reading') || []).filter(function (b) { return b && b.title; });
    var want = (read('omega_library_shelf') || []).filter(function (b) { return b && b.title && (b.status || 'want') === 'want'; });
    /* reading.html's statuses: reading | queued | completed. */
    var reading = books.filter(function (b) { return b.status === 'reading'; });
    var finished = books.filter(function (b) { return b.status === 'completed'; }).length;
    var queued = books.filter(function (b) { return b.status === 'queued'; }).length + want.length;
    stat('shelf', String(reading.length), books.length || want.length ? 'reading · ' + finished + ' finished · ' + queued + ' queued' : 'no books yet');
    if (!books.length && !want.length) {
      el('div', 'oac-empty', 'NO BOOKS YET', p);
    } else {
      var list = el('div', 'oac-list', null, p);
      reading.slice(0, 6).forEach(function (b) {
        var pages = +b.pages || 0, at = +b.progress || 0, pct = pages ? Math.round(at / pages * 100) : null;
        var a = link('/reading.html', null, list, 'oac-item');
        el('span', null, b.title, a);
        el('span', 'oac-chip', pct == null ? 'READING' : pct + '%', a);
        el('small', null, [b.author, pages ? at + ' / ' + pages + ' pages' : null].filter(Boolean).join(' · ').toUpperCase(), a);
        if (pct != null) { var bar = el('div', 'oac-bar', null, a); el('i', null, null, bar).style.width = Math.min(100, pct) + '%'; }
      });
      want.slice(0, 4).forEach(function (b) {
        var a = link('/library.html', null, list, 'oac-item');
        el('span', null, b.title, a);
        el('span', 'oac-chip', 'WANT', a);
        if (b.author) el('small', null, String(b.author).toUpperCase(), a);
      });
    }
    var row = el('div', 'oac-row', null, p);
    row.style.marginTop = '12px';
    link('/reading.html', 'READING ↗', row);
    link('/library.html', 'LIBRARY ↗', row);
  }

  /* ---------- boot ---------- */
  function refreshLocal() { paintReview(); paintTestStat(); paintShelf(); }

  async function boot() {
    root = document.querySelector('[data-omega-academy-core]');
    if (!root) return;
    style();
    build();
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
    var hash = (location.hash || '').replace('#', '');
    var first = LENSES.some(function (l) { return l.id === hash; }) ? hash : (LENSES.some(function (l) { return l.id === saved; }) ? saved : 'review');
    refreshLocal();
    paintCourses();
    setLens(first);
    /* The review queue writes the stores; repaint counts when it closes. */
    document.addEventListener('omega-review:closed', refreshLocal);
    window.addEventListener('storage', refreshLocal);
    try { state.sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { state.sb = null; }
    if (state.sb) {
      try { var s = (await state.sb.auth.getSession()).data.session; state.uid = s && s.user ? s.user.id : null; } catch (e) { state.uid = null; }
    }
    loadCourses();
  }

  window.OmegaAcademyCore = { lens: function () { return state.lens; }, setLens: function (id) { if (els.panel && els.panel[id]) setLens(id); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
