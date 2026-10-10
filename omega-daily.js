/* ============================================================================
   Ω DAILY THREE — one reason to come back every day
   ----------------------------------------------------------------------------
   Three short rituals, the same for every member on a given day:
     1. ORACLE WORD  — the arcade's daily five-letter word (omega-arcade.js)
     2. DAILY QUIZ   — three questions drawn from omega-exam-bank.json
     3. FILM OF THE DAY — one of the twelve franchise films (assets/movies/)
   Each finished ritual records progress once through OmegaProgress.record()
   (task `daily:<day>:<ritual>`, deduped server-side by complete_task), and the
   streak is counted from the member's own task_completions rows — the record,
   not a number this module invents (CLAUDE.md 8.1 class 9). A browser-local
   day history is used only while the server is unreachable, and is labelled so.

   Not omega-today.js: that module is the habits/cards/readiness view on
   command.html. Separate module, separate guard attribute (8.1 class 5).

   Mount:  <div data-omega-daily></div>   (dashboard.html)
   API:    window.OmegaDaily = { state(), streak(), render() }
   All DOM is built with createElement/textContent; classes are `odl-`.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaDaily) return;

  var STATE_KEY = 'omega_daily';
  var HIST_KEY = 'omega_daily_hist';
  var FILMS = ['ARES · WAR SOVEREIGN', 'APHRODITE · LOVE SOVEREIGN', 'HERMES · MESSENGER SOVEREIGN',
    'ARTEMIS · HUNT SOVEREIGN', 'APOLLO · LIGHT SOVEREIGN', 'ATHENA · WISDOM SOVEREIGN',
    'HERA · QUEEN SOVEREIGN', 'DEMETER · EARTH SOVEREIGN', 'ZEUS · THUNDER SOVEREIGN',
    'HESTIA · HEARTH SOVEREIGN', 'HEPHAESTUS · FORGE SOVEREIGN', 'POSEIDON · OCEAN SOVEREIGN'];
  var FILM_WATCHED_S = 8;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------ day + seed */
  /* Same local-calendar key as omega-arcade.js dayKey(), so "today's word"
     and "today's ritual" are the same day. */
  function dayKey(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
  }
  function daysBack(n) { var d = new Date(); d.setDate(d.getDate() - n); return dayKey(d); }
  function seed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(s) {
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ----------------------------------------------------------------- store */
  function readJSON(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  var today = dayKey();
  var S = readJSON(STATE_KEY);
  if (!S || S.day !== today) S = { day: today, word: null, quiz: null, film: false };
  function save() {
    writeJSON(STATE_KEY, S);
    if (S.word || S.quiz || S.film) {
      var h = readJSON(HIST_KEY) || [];
      if (h.indexOf(today) === -1) { h.push(today); writeJSON(HIST_KEY, h.slice(-400)); }
    }
  }
  function doneCount() { return (S.word ? 1 : 0) + (S.quiz ? 1 : 0) + (S.film ? 1 : 0); }

  /* -------------------------------------------------------------- progress */
  function ensureProgress(cb) {
    if (window.OmegaProgress) return cb();
    if (!document.querySelector('script[data-omega-progress]')) {
      var s = document.createElement('script');
      s.src = '/omega-progress.js'; s.defer = true; s.setAttribute('data-omega-progress', '1');
      (document.head || document.documentElement).appendChild(s);
    }
    var n = 0;
    (function wait() { if (window.OmegaProgress) return cb(); if (++n < 60) setTimeout(wait, 250); })();
  }
  function record(ritual, axis, title) {
    ensureProgress(function () {
      window.OmegaProgress.record({ kind: 'ritual', task: 'daily:' + today + ':' + ritual, axis: axis, title: title, weight: 0.03 })
        .then(function () {
          if (doneCount() === 3) {
            return window.OmegaProgress.record({ kind: 'ritual', task: 'daily:' + today, axis: 'a', title: 'Daily Three complete', weight: 0.05 });
          }
        }).then(loadStreak, loadStreak);
    });
  }

  /* ---------------------------------------------------------------- streak */
  var streak = { days: null, source: 'none' };
  function countRun(days) {
    var set = {}; days.forEach(function (d) { set[d] = true; });
    var start = set[today] ? 0 : (set[daysBack(1)] ? 1 : -1);
    if (start < 0) return 0;
    var n = 0; while (set[daysBack(start + n)]) n++;
    return n;
  }
  function localStreak() { streak = { days: countRun(readJSON(HIST_KEY) || []), source: 'local' }; paintStreak(); }
  function loadStreak() {
    if (!window.OmegaSB || !window.OmegaSB.get) return localStreak();
    Promise.resolve(window.OmegaSB.get()).then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var sess = r && r.data && r.data.session;
        if (!sess) return localStreak();
        return sb.from('task_completions').select('task_name')
          .eq('user_id', sess.user.id).like('task_name', 'daily:%')
          .order('completed_at', { ascending: false }).limit(1200)
          .then(function (res) {
            if (res.error || !Array.isArray(res.data)) return localStreak();
            var days = res.data.map(function (row) { return String(row.task_name || '').split(':')[1] || ''; })
              .filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); });
            /* A ritual finished a moment ago may not be readable yet; today
               counts once this browser saw one completed. */
            if (doneCount() > 0) days.push(today);
            streak = { days: countRun(days), source: 'server' };
            paintStreak();
          });
      });
    }).catch(localStreak);
  }

  /* ------------------------------------------------------------------- css */
  function css() {
    if (document.getElementById('odl-css')) return;
    var s = document.createElement('style');
    s.id = 'odl-css';
    s.textContent =
      '.odl{margin:0 0 18px;padding:16px clamp(14px,2.4vw,22px);border-radius:16px;border:1px solid rgba(201,168,76,.22);' +
      'background:linear-gradient(160deg,rgba(201,168,76,.07),rgba(0,229,255,.03) 60%,rgba(4,6,10,.6));position:relative;overflow:hidden}' +
      '.odl-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}' +
      '.odl-title{font-family:var(--D);font-size:clamp(15px,2vw,19px);color:var(--gold);letter-spacing:1px}' +
      '.odl-sub{font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--muted);margin-top:3px}' +
      '.odl-meta{display:flex;align-items:center;gap:14px}' +
      '.odl-streak{font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--ink)}' +
      '.odl-streak b{font-family:var(--D);font-size:20px;color:var(--gold);margin-right:6px;font-weight:400}' +
      '.odl-pips{display:flex;gap:6px}.odl-pip{width:12px;height:12px;border-radius:50%;border:1px solid rgba(201,168,76,.5)}' +
      '.odl-pip.on{background:var(--gold);box-shadow:0 0 10px rgba(201,168,76,.6)}' +
      '.odl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}' +
      '.odl-card{border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(4,6,10,.55);padding:14px;display:flex;flex-direction:column;gap:10px;min-height:190px}' +
      '.odl-card.done{border-color:rgba(63,178,127,.45)}' +
      '.odl-k{font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--odl-c,var(--gold))}' +
      '.odl-h{font-family:var(--R);font-size:17px;font-weight:600;color:var(--ink);line-height:1.3}' +
      '.odl-p{font-family:var(--R);font-size:14px;color:var(--muted);line-height:1.45}' +
      '.odl-btn{align-self:flex-start;margin-top:auto;min-height:44px;padding:0 18px;border-radius:22px;cursor:pointer;font-family:var(--M);font-size:12px;letter-spacing:1.5px;' +
      'border:1px solid var(--odl-c,var(--gold));background:transparent;color:var(--odl-c,var(--gold))}' +
      '.odl a.odl-btn{display:inline-flex;align-items:center;text-decoration:none;border-radius:22px}' +
      '.odl-btn:hover{background:rgba(255,255,255,.05)}.odl-btn:focus-visible,.odl-opt:focus-visible,.odl-poster:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}' +
      '.odl-ok{font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:var(--green)}' +
      '.odl-opts{display:grid;gap:8px}' +
      '.odl-opt{min-height:44px;text-align:left;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--ink);font-family:var(--R);font-size:15px;cursor:pointer}' +
      '.odl-opt[disabled]{cursor:default}.odl-opt.right{border-color:var(--green);background:rgba(63,178,127,.14)}.odl-opt.wrong{border-color:var(--crim);background:rgba(220,60,60,.12)}' +
      '.odl-poster{position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;border:0;padding:0;cursor:pointer;background:#000}' +
      '.odl-poster img,.odl-card video{width:100%;height:100%;object-fit:cover;display:block;border-radius:10px}' +
      '.odl-card video{aspect-ratio:16/9;background:#000}' +
      '.odl-play{position:absolute;inset:auto auto 10px 10px;font-family:var(--M);font-size:12px;letter-spacing:1.5px;color:#fff;background:rgba(0,0,0,.6);padding:6px 12px;border-radius:16px}' +
      '.odl-done-all{margin-top:12px;font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--green);text-align:center}' +
      '.odl.burst::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 40%,rgba(201,168,76,.35),transparent 60%);animation:odl-burst 1.6s ease-out forwards}' +
      '@keyframes odl-burst{from{opacity:1}to{opacity:0}}' +
      '@media (prefers-reduced-motion:reduce){.odl.burst::after{animation:none;opacity:0}}';
    (document.head || document.documentElement).appendChild(s);
  }

  /* --------------------------------------------------------------- helpers */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(label, fn) { var b = el('button', 'odl-btn', label); b.type = 'button'; b.addEventListener('click', fn); return b; }
  var root = null, streakEl = null, pipsEl = null;

  function paintStreak() {
    if (!streakEl) return;
    streakEl.textContent = '';
    if (streak.days == null) { streakEl.textContent = 'STREAK …'; return; }
    var b = el('b', null, String(streak.days));
    streakEl.appendChild(b);
    streakEl.appendChild(document.createTextNode('DAY STREAK'));
    streakEl.title = streak.source === 'server' ? 'Counted from your recorded rituals'
      : 'Counted in this browser (your account could not be reached)';
  }
  function paintPips() {
    if (!pipsEl) return;
    var n = doneCount();
    Array.prototype.forEach.call(pipsEl.children, function (p, i) { p.classList.toggle('on', i < n); });
    pipsEl.setAttribute('aria-label', n + ' of 3 rituals done today');
  }
  function finished(card) {
    card.classList.add('done');
    paintPips();
    save();
    if (doneCount() === 3 && root) {
      root.classList.remove('burst'); void root.offsetWidth; root.classList.add('burst');
      var allEl = root.querySelector('.odl-done-all');
      if (allEl) allEl.hidden = false;
    }
  }

  /* --------------------------------------------------------- 1. the word */
  function loadArcade(cb) {
    if (window.OmegaArcade) return cb();
    if (!document.querySelector('script[src="/omega-arcade.js"]')) {
      var s = document.createElement('script');
      s.src = '/omega-arcade.js'; s.defer = true;
      (document.head || document.documentElement).appendChild(s);
    }
    var n = 0;
    (function wait() { if (window.OmegaArcade) return cb(); if (++n < 80) setTimeout(wait, 150); })();
  }
  function wordCard() {
    var c = el('div', 'odl-card'); c.style.setProperty('--odl-c', 'var(--cyan)');
    function paint() {
      c.textContent = '';
      c.appendChild(el('div', 'odl-k', '1 · ORACLE WORD'));
      if (S.word) {
        c.appendChild(el('div', 'odl-h', S.word.won ? 'Solved in ' + S.word.guesses + '/6' : 'The Oracle won today'));
        c.appendChild(el('div', 'odl-ok', '✓ DONE TODAY'));
        c.appendChild(btn('PRACTICE', function () { loadArcade(function () { window.OmegaArcade.open('oracle'); }); }));
        c.classList.add('done');
      } else {
        c.appendChild(el('div', 'odl-h', 'Five letters. Six tries.'));
        c.appendChild(el('div', 'odl-p', 'The same word for every member today.'));
        c.appendChild(btn('PLAY TODAY’S WORD', function () { loadArcade(function () { window.OmegaArcade.open('oracle'); }); }));
      }
    }
    document.addEventListener('omega-arcade:daily', function (e) {
      var d = e.detail || {};
      if (d.day !== today || S.word) return;
      S.word = { won: !!d.won, guesses: d.guesses || 0 };
      paint(); finished(c);
      record('word', 'b', d.won ? 'Oracle word solved in ' + d.guesses : 'Played the Oracle word');
    });
    paint();
    return c;
  }

  /* ---------------------------------------------------------- 2. the quiz */
  var bankP = null;
  function bank() {
    if (!bankP) bankP = fetch('/omega-exam-bank.json', { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('bank ' + r.status); return r.json(); });
    return bankP;
  }
  function pickQuestions(b) {
    var all = [];
    (b.sectors || []).forEach(function (s) { (s.questions || []).forEach(function (q) { all.push({ s: s, q: q }); }); });
    var r = rng(seed('daily-quiz-' + today)), out = [], used = {}, sectors = {};
    for (var tries = 0; out.length < 3 && tries < 500; tries++) {
      var i = Math.floor(r() * all.length);
      if (used[i] || sectors[all[i].s.id]) continue;   /* three different sectors */
      used[i] = true; sectors[all[i].s.id] = true; out.push(all[i]);
    }
    return out;
  }
  function quizCard() {
    var c = el('div', 'odl-card'); c.style.setProperty('--odl-c', 'var(--gold)');
    function intro() {
      c.textContent = '';
      c.appendChild(el('div', 'odl-k', '2 · DAILY QUIZ'));
      if (S.quiz) {
        c.appendChild(el('div', 'odl-h', S.quiz.score + ' of 3 correct'));
        c.appendChild(el('div', 'odl-ok', '✓ DONE TODAY'));
        var more = el('a', 'odl-btn', 'FULL EXAMS'); more.href = '/exam.html';
        c.appendChild(more);
        c.classList.add('done');
        return;
      }
      c.appendChild(el('div', 'odl-h', 'Three questions, three sectors.'));
      c.appendChild(el('div', 'odl-p', 'About a minute. Every answer explained.'));
      c.appendChild(btn('START', function () {
        bank().then(function (b) { run(pickQuestions(b), 0, 0); }, function () {
          c.appendChild(el('div', 'odl-p', 'The question bank could not be loaded. Try again shortly.'));
        });
      }));
    }
    function run(qs, i, score) {
      if (i >= qs.length) {
        S.quiz = { score: score };
        intro(); finished(c);
        record('quiz', 'a', 'Daily quiz ' + score + '/3');
        return;
      }
      var it = qs[i], q = it.q;
      c.textContent = '';
      c.appendChild(el('div', 'odl-k', '2 · DAILY QUIZ · ' + (i + 1) + '/3 · ' + String(it.s.name || '').toUpperCase()));
      c.appendChild(el('div', 'odl-h', q.q));
      var opts = el('div', 'odl-opts');
      var buttons = (q.options || []).map(function (o, k) {
        var b = el('button', 'odl-opt', o); b.type = 'button';
        b.addEventListener('click', function () {
          var right = k === q.answer;
          buttons.forEach(function (x, j) { x.disabled = true; if (j === q.answer) x.classList.add('right'); });
          if (!right) b.classList.add('wrong');
          if (q.why) c.appendChild(el('div', 'odl-p', (right ? 'Correct. ' : 'Not quite. ') + q.why));
          var nx = btn(i + 1 < qs.length ? 'NEXT' : 'FINISH', function () { run(qs, i + 1, score + (right ? 1 : 0)); });
          c.appendChild(nx); nx.focus();
        });
        opts.appendChild(b);
        return b;
      });
      c.appendChild(opts);
      if (buttons[0]) buttons[0].focus();
    }
    intro();
    return c;
  }

  /* ---------------------------------------------------------- 3. the film */
  function filmCard() {
    var c = el('div', 'odl-card'); c.style.setProperty('--odl-c', 'var(--purple,#9b7bff)');
    var idx = seed('daily-film-' + today) % FILMS.length, nn = (idx < 9 ? '0' : '') + (idx + 1);
    var dir = '/assets/movies/';
    c.appendChild(el('div', 'odl-k', '3 · FILM OF THE DAY'));
    c.appendChild(el('div', 'odl-h', FILMS[idx]));
    var poster = el('button', 'odl-poster'); poster.type = 'button';
    poster.setAttribute('aria-label', 'Play ' + FILMS[idx]);
    var img = el('img'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.setAttribute('data-no-alive', '');   /* a play target, not ambient art */
    img.src = dir + 'franchise-' + nn + '.jpg';
    poster.appendChild(img);
    poster.appendChild(el('span', 'odl-play', S.film ? '▶\uFE0E WATCH AGAIN' : '▶\uFE0E PLAY · 12 S'));
    c.appendChild(poster);
    if (S.film) { c.appendChild(el('div', 'odl-ok', '✓ WATCHED TODAY')); c.classList.add('done'); }
    poster.addEventListener('click', function () {
      var v = el('video');
      v.controls = true; v.playsInline = true; v.preload = 'auto';
      v.poster = dir + 'franchise-' + nn + '.jpg';
      v.src = dir + 'franchise-' + nn + '.mp4';
      v.setAttribute('aria-label', FILMS[idx]);
      poster.replaceWith(v);
      var credited = false;
      function credit() {
        if (credited || S.film) return;
        credited = true; S.film = true;
        c.appendChild(el('div', 'odl-ok', '✓ WATCHED TODAY'));
        finished(c);
        record('film', 'c', 'Watched ' + FILMS[idx]);
      }
      v.addEventListener('timeupdate', function () { if (v.currentTime >= FILM_WATCHED_S) credit(); });
      v.addEventListener('ended', credit);
      if (!(reduced && reduced.matches)) {
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* needs a tap; controls are shown */ });
      }
      v.focus();
    });
    return c;
  }

  /* ---------------------------------------------------------------- render */
  function render(host) {
    host = host || document.querySelector('[data-omega-daily]');
    if (!host) return;
    css();
    host.textContent = '';
    root = el('section', 'odl');
    root.setAttribute('aria-label', 'Daily Three');
    var top = el('div', 'odl-top'), l = el('div');
    l.appendChild(el('div', 'odl-title', 'Ω DAILY THREE'));
    var d = new Date();
    l.appendChild(el('div', 'odl-sub', d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase() + ' · NEW EVERY DAY'));
    var meta = el('div', 'odl-meta');
    streakEl = el('div', 'odl-streak');
    pipsEl = el('div', 'odl-pips'); pipsEl.setAttribute('role', 'img');
    for (var i = 0; i < 3; i++) pipsEl.appendChild(el('span', 'odl-pip'));
    meta.appendChild(streakEl); meta.appendChild(pipsEl);
    top.appendChild(l); top.appendChild(meta);
    root.appendChild(top);
    var grid = el('div', 'odl-grid');
    grid.appendChild(wordCard()); grid.appendChild(quizCard()); grid.appendChild(filmCard());
    root.appendChild(grid);
    var all = el('div', 'odl-done-all', '✦ ALL THREE DONE · SEE YOU TOMORROW');
    all.hidden = doneCount() < 3;
    root.appendChild(all);
    host.appendChild(root);
    paintPips(); paintStreak(); loadStreak();
  }

  window.OmegaDaily = {
    state: function () { return JSON.parse(JSON.stringify(S)); },
    streak: function () { return { days: streak.days, source: streak.source }; },
    render: render
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { render(); });
  else render();
})();
