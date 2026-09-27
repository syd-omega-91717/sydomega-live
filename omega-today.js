/* omega-today.js -- TODAY: one view of what is due and done across the platform.

   The Daily Command Brief (command.html) already runs the planning ritual:
   three priorities, time blocks, an evening review. What it could not show is
   the rest of the member's day -- habits due, cards to review, water, sleep,
   mood -- because each lives on its own page in its own store. This module is
   the "unified daily view" leading planners build their morning around: it
   reads each module's OWN saved data, never a copy, and turns it into one
   tile per ritual.

   Rules it keeps (CLAUDE.md 8.1):
   - class 9, no fabricated data: a module the member has never used shows a
     START tile linking to it, not a zero dressed as a result. Every number is
     counted from saved entries.
   - class 8, one owner per fact: due/done logic mirrors the owning page
     (habits.html shouldDoToday/isCompletedToday/weekKey; flashcard.html and
     vocabulary.html due dates) instead of inventing a second rule.
   - no member text is rendered -- only counts and fixed labels -- so there is
     nothing to escape.

   Mount: <div data-omega-today></div>. Re-reads on focus/visibility and on
   `storage`, and twice after load, because omega-member-state.js may restore
   the stores from Postgres a moment after first paint. */
(function () {
  'use strict';
  if (window.OmegaToday) return;

  function read(key) {
    try { var v = localStorage.getItem(key); return v == null ? null : JSON.parse(v); }
    catch (e) { return null; }
  }
  function raw(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function day(ts) { return typeof ts === 'string' ? ts.slice(0, 10) : (typeof ts === 'number' ? iso(new Date(ts)) : ''); }

  /* Same date convention as the owning pages (UTC ISO day), so "today" here is
     the day those pages record against. */
  var TODAY = iso(new Date());
  var YESTERDAY = iso(new Date(Date.now() - 864e5));

  /* habits.html:249 and :306-318, mirrored. */
  function weekKey(d) { var t = new Date(d); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - t.getDay()); return 'week-' + iso(t); }
  function habitDueToday(h) {
    var dow = new Date().getDay();
    if (h.freq === 'weekdays') return dow >= 1 && dow <= 5;
    if (h.freq === 'weekends') return dow === 0 || dow === 6;
    if (h.freq === 'weekly') return dow === 0;
    return true;
  }

  /* Each probe returns null when the member has never used the module (START
     tile), else {value, of?, unit?, done}. */
  var PROBES = [
    { id: 'habits', glyph: '◈', label: 'HABITS', href: '/habits.html', probe: function () {
      var hs = read('omega_habits_v2'); if (!Array.isArray(hs) || !hs.length) return null;
      var logs = read('omega_habit_logs_v2') || {};
      var due = hs.filter(habitDueToday), done = 0;
      due.forEach(function (h) {
        var k = h.freq === 'weekly' ? weekKey(new Date()) : TODAY;
        if (logs[k] && logs[k][h.id]) done++;
      });
      return { value: done, of: due.length, done: due.length > 0 && done === due.length };
    } },
    { id: 'cards', glyph: '▣', label: 'CARDS DUE', href: '/flashcard.html', probe: function () {
      var cs = read('omega_fc_cards'); if (!Array.isArray(cs) || !cs.length) return null;
      var due = cs.filter(function (c) { return c && c.due && c.due <= TODAY; }).length;
      return { value: due, done: due === 0, invert: true };
    } },
    { id: 'words', glyph: '❦', label: 'WORDS DUE', href: '/vocabulary.html', probe: function () {
      var ws = read('omega_vocab'); if (!Array.isArray(ws) || !ws.length) return null;
      var due = ws.filter(function (w) { return w && w.nextReview && w.nextReview <= TODAY; }).length;
      return { value: due, done: due === 0, invert: true };
    } },
    { id: 'water', glyph: '≈', label: 'WATER', href: '/water.html', probe: function () {
      var log = read('omega_water_log'); if (!Array.isArray(log) || !log.length) return null;
      var goal = parseInt(raw('omega_water_goal') || '2500', 10) || 2500;
      var ml = log.filter(function (l) { return l && day(l.ts) === TODAY; })
                  .reduce(function (s, l) { return s + (+l.ml || 0); }, 0);
      return { value: Math.round(ml / 100) / 10, of: Math.round(goal / 100) / 10, unit: 'L', done: ml >= goal };
    } },
    { id: 'sleep', glyph: '☾', label: 'SLEEP', href: '/sleep.html', probe: function () {
      var log = read('omega_sleep_log'); if (!Array.isArray(log) || !log.length) return null;
      var last = log.filter(function (e) { return e && (e.date === TODAY || e.date === YESTERDAY); })
                    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })[0];
      return last ? { value: +(+last.hours || 0).toFixed(1), unit: 'H', done: true } : { value: 0, unit: 'H', done: false, missing: true };
    } },
    { id: 'mood', glyph: '◐', label: 'MOOD', href: '/mood.html', probe: function () {
      var log = read('omega_mood_log'); if (!Array.isArray(log) || !log.length) return null;
      var n = log.filter(function (l) { return l && day(l.ts) === TODAY; }).length;
      return { check: true, done: n > 0 };
    } },
    { id: 'gratitude', glyph: '✧', label: 'GRATITUDE', href: '/gratitude.html', probe: function () {
      var log = read('omega_gratitude_log'); if (!Array.isArray(log) || !log.length) return null;
      var n = log.filter(function (e) { return e && e.date === TODAY; }).length;
      return { check: true, done: n > 0 };
    } },
    { id: 'meditate', glyph: '◎', label: 'STILLNESS', href: '/meditate.html', probe: function () {
      var log = read('omega_meditate_log'); if (!Array.isArray(log) || !log.length) return null;
      var secs = log.filter(function (e) { return e && day(e.date) === TODAY; })
                    .reduce(function (s, e) { return s + (+e.duration || 0); }, 0);
      return { value: Math.round(secs / 60), unit: 'MIN', done: secs > 0 };
    } },
    { id: 'workout', glyph: '⚔︎', label: 'TRAINING · 7D', href: '/workout.html', probe: function () {
      var log = read('omega_workout_log'); if (!Array.isArray(log) || !log.length) return null;
      var since = iso(new Date(Date.now() - 6 * 864e5));
      var n = log.filter(function (e) { return e && day(e.ts) >= since; }).length;
      return { value: n, done: n > 0 };
    } }
  ];

  function css() {
    if (document.getElementById('omega-today-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-today-css';
    s.textContent =
      '.otd{margin:0 0 18px}' +
      '.otd-head{display:flex;align-items:center;gap:14px;margin-bottom:10px}' +
      '.otd-ring{--p:0;width:54px;height:54px;border-radius:50%;flex:0 0 auto;display:grid;place-items:center;' +
        'background:conic-gradient(var(--gold,#C9A84C) calc(var(--p)*1turn),rgba(201,168,76,.12) 0);' +
        '}' +
      '.otd-ring b{width:42px;height:42px;border-radius:50%;background:var(--void,#08080F);display:grid;place-items:center;' +
        'font-family:var(--M,monospace);font-size:13px;color:var(--ink,#E5ECF0)}' +
      '.otd-title{font-family:var(--M,monospace);font-size:12px;letter-spacing:3px;color:var(--gold,#C9A84C)}' +
      '.otd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px}' +
      '.otd-t{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:1px solid rgba(201,168,76,.18);' +
        'border-radius:4px;background:rgba(255,255,255,.02);color:var(--ink,#E5ECF0);text-decoration:none;min-height:74px;' +
        'transition:border-color .2s,background .2s}' +
      '.otd-t:hover,.otd-t:focus-visible{border-color:rgba(201,168,76,.5);background:rgba(201,168,76,.05)}' +
      '.otd-g{font-size:16px;line-height:1;color:var(--gold,#C9A84C)}' +
      '.otd-v{font-family:var(--D,serif);font-size:20px;line-height:1.1}' +
      '.otd-v small{font-family:var(--M,monospace);font-size:12px;color:var(--muted,#8796A1);margin-left:3px}' +
      '.otd-l{font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;color:var(--muted,#8796A1)}' +
      '.otd-t.is-done{border-color:rgba(63,178,127,.45)}' +
      '.otd-t.is-done .otd-g{color:var(--green,#3fb27f)}' +
      '.otd-t.is-start{border-style:dashed;opacity:.8}' +
      '.otd-t.is-start .otd-v{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--gold,#C9A84C)}';
    (document.head || document.documentElement).appendChild(s);
  }

  function tile(p, r) {
    var a = document.createElement('a');
    a.className = 'otd-t';
    a.href = p.href;
    a.setAttribute('data-omega-today-tile', p.id);
    var g = document.createElement('span'); g.className = 'otd-g'; g.setAttribute('aria-hidden', 'true');
    var v = document.createElement('span'); v.className = 'otd-v';
    var l = document.createElement('span'); l.className = 'otd-l'; l.textContent = p.label;
    if (!r) {
      a.classList.add('is-start');
      g.textContent = p.glyph; v.textContent = 'START';
      a.setAttribute('aria-label', p.label + ': not started, open to begin');
    } else {
      if (r.done) a.classList.add('is-done');
      g.textContent = r.done ? '✓' : p.glyph;
      if (r.check) {
        v.textContent = r.done ? 'LOGGED' : '—';
      } else if (r.missing) {
        v.textContent = '—';
      } else {
        v.textContent = String(r.value);
        if (r.of != null || r.unit) {
          var sm = document.createElement('small');
          sm.textContent = (r.of != null ? '/ ' + r.of : '') + (r.unit ? (r.of != null ? ' ' : '') + r.unit : '');
          v.appendChild(sm);
        }
      }
      a.setAttribute('aria-label', p.label + ': ' + (r.done ? 'done' : 'open') + (r.check ? '' : ', ' + v.textContent));
    }
    a.appendChild(g); a.appendChild(v); a.appendChild(l);
    return a;
  }

  function render(host) {
    var results = PROBES.map(function (p) { var r = null; try { r = p.probe(); } catch (e) { r = null; } return { p: p, r: r }; });
    /* Started modules first (the member's actual day), then START tiles. */
    results.sort(function (a, b) { return (a.r ? 0 : 1) - (b.r ? 0 : 1); });
    var started = results.filter(function (x) { return x.r; });
    var done = started.filter(function (x) { return x.r.done; }).length;

    host.textContent = '';
    host.classList.add('otd');
    var head = document.createElement('div'); head.className = 'otd-head';
    var ring = document.createElement('div'); ring.className = 'otd-ring';
    ring.style.setProperty('--p', started.length ? (done / started.length).toFixed(3) : '0');
    ring.setAttribute('role', 'img');
    ring.setAttribute('aria-label', done + ' of ' + started.length + ' rituals done today');
    var rb = document.createElement('b'); rb.textContent = started.length ? done + '/' + started.length : '—';
    ring.appendChild(rb);
    var t = document.createElement('div'); t.className = 'otd-title'; t.textContent = 'TODAY';
    head.appendChild(ring); head.appendChild(t);
    var grid = document.createElement('div'); grid.className = 'otd-grid';
    results.forEach(function (x) { grid.appendChild(tile(x.p, x.r)); });
    host.appendChild(head); host.appendChild(grid);
    host.setAttribute('data-omega-today-done', String(done));
    host.setAttribute('data-omega-today-started', String(started.length));
  }

  function renderAll() {
    var hosts = document.querySelectorAll('[data-omega-today]');
    for (var i = 0; i < hosts.length; i++) render(hosts[i]);
  }

  function boot() {
    css();
    renderAll();
    /* member_state may restore the stores from Postgres after first paint. */
    setTimeout(renderAll, 1500);
    setTimeout(renderAll, 5000);
    window.addEventListener('storage', renderAll);
    window.addEventListener('focus', renderAll);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) renderAll(); });
  }

  window.OmegaToday = { render: renderAll, probes: PROBES.map(function (p) { return p.id; }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
