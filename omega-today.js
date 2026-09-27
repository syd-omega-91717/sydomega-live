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
   - the only member text rendered is carry-over priorities, and it goes
     through textContent, never parsed as HTML; everything else is a count or a
     fixed label.

   Three views, one set of readers (so no second copy of any rule):
     <div data-omega-today>      what is due and done today (command.html)
     <div data-omega-readiness>  a score from seven NAMED contributors, each
                                 shown, computed only from logged entries --
                                 withheld until 3 have data (command.html)
     <div data-omega-week>       the week so far, measured, with last-week
                                 direction only when both weeks have data,
                                 and unfinished priorities to carry over
                                 (weekly.html)

   Re-reads on focus/visibility and on
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

  /* `.ord a.ord-row` carries !important on purpose: a platform-wide
     `a[href]{display:inline-flex}` rule (GAP_ANALYSIS.md) outranks a plain
     class and collapsed each contributor's bar to 0px wide -- measured. */
  function css() {
    if (document.getElementById('omega-today-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-today-css';
    s.textContent =
      '.otd{margin:0 0 18px}' +
      '.otd-head{display:flex;align-items:center;gap:14px;margin-bottom:10px}' +
      '.otd a.otd-rev{margin-left:auto;margin-right:-6px;background:rgba(201,168,76,.14)}.otd a.otd-rev+a.otd-rem{margin-left:0}' +
      '.otd a.otd-rem{margin-left:auto;font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--gold,#C9A84C);text-decoration:none;border:1px solid rgba(201,168,76,.35);border-radius:999px;padding:5px 12px}' +
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
      '.otd-t.is-start .otd-v{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--gold,#C9A84C)}' +
      '.ord{margin:0 0 18px}.ord-head{display:flex;align-items:center;gap:14px;margin-bottom:10px}' +
      '.ord-num{font-family:var(--D,serif);font-size:40px;line-height:1;min-width:64px;text-align:center;color:var(--ink,#E5ECF0)}' +
      '.ord-cap{display:flex;flex-direction:column;gap:4px}' +
      '.ord-sub{font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;color:var(--muted,#8796A1)}' +
      '.ord-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px 14px}' +
      '.ord a.ord-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:6px 0;text-decoration:none;color:var(--ink,#E5ECF0)}' +
      '.ord-v{font-family:var(--M,monospace);font-size:12px;color:var(--ink,#E5ECF0)}' +
      '.ord-bar{grid-column:1/-1;height:4px;border-radius:2px;background:rgba(201,168,76,.12);overflow:hidden}' +
      '.ord-bar i{display:block;height:100%;border-radius:2px}' +
      '.owk{margin:0 0 20px}.owk .otd-title{margin-bottom:10px}' +
      '.owk-n{font-family:var(--M,monospace);font-size:12px;color:var(--muted,#8796A1)}' +
      '.owk-dir{font-size:12px;margin-left:4px}' +
      '.owk-carry{margin-top:12px;padding:10px 12px;border-left:2px solid var(--gold,#C9A84C);background:rgba(201,168,76,.04)}' +
      '.owk-item{font-family:var(--R,sans-serif);font-size:14px;color:var(--ink,#E5ECF0);padding:3px 0}';
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
    /* The way into S4's reminder settings, from where the rituals are. */
    var rp = read('omega_reminder_prefs'), on = !!(rp && rp.on);
    var rl = document.createElement('a'); rl.className = 'otd-rem'; rl.href = '/notifications.html#reminders';
    rl.setAttribute('data-omega-today-reminders', on ? 'on' : 'off');
    rl.textContent = on ? '◷ REMINDERS ON' : '◷ SET A REMINDER';
    head.appendChild(rl);
    /* S5: one queue for every due card and word (omega-review.js). */
    var due = 0;
    results.forEach(function (x) { if ((x.p.id === 'cards' || x.p.id === 'words') && x.r && +x.r.value > 0) due += +x.r.value; });
    if (due > 0) {
      var rv = document.createElement('a'); rv.className = 'otd-rem otd-rev'; rv.href = '#review';
      rv.setAttribute('data-omega-review-open', ''); rv.setAttribute('data-omega-today-due', String(due));
      rv.textContent = '▶ REVIEW ' + due;
      head.insertBefore(rv, rl);
    }
    var grid = document.createElement('div'); grid.className = 'otd-grid';
    results.forEach(function (x) { grid.appendChild(tile(x.p, x.r)); });
    host.appendChild(head); host.appendChild(grid);
    host.setAttribute('data-omega-today-done', String(done));
    host.setAttribute('data-omega-today-started', String(started.length));
  }

  function each(sel, fn) { var hs = document.querySelectorAll(sel); for (var i = 0; i < hs.length; i++) { try { fn(hs[i]); } catch (e) { /* one view failing must not blank the others */ } } }
  function renderAll() {
    each('[data-omega-today]', render);
    each('[data-omega-readiness]', function (h) { renderReadiness(h); });
    each('[data-omega-week]', function (h) { renderWeek(h); });
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


  /* ── shared range helpers ─────────────────────────────────────────────── */
  function isoDaysBack(n) { return iso(new Date(Date.now() - n * 864e5)); }
  function habitDueOn(h, d) {
    var dow = new Date(d + 'T12:00:00Z').getUTCDay();
    if (h.freq === 'weekdays') return dow >= 1 && dow <= 5;
    if (h.freq === 'weekends') return dow === 0 || dow === 6;
    if (h.freq === 'weekly') return dow === 0;
    return true;
  }
  /* Habit completion over an inclusive ISO-day range, using habits.html's own
     keys: a day's log for daily habits, weekKey() for weekly ones. */
  function habitRate(from, to) {
    var hs = read('omega_habits_v2'); if (!Array.isArray(hs) || !hs.length) return null;
    var logs = read('omega_habit_logs_v2') || {}, due = 0, done = 0;
    for (var t = new Date(from + 'T12:00:00Z'); iso(t) <= to; t = new Date(t.getTime() + 864e5)) {
      var d = iso(t);
      hs.forEach(function (h) {
        if (!habitDueOn(h, d)) return;
        due++;
        var k = h.freq === 'weekly' ? weekKey(new Date(d + 'T12:00:00')) : d;
        if (logs[k] && logs[k][h.id]) done++;
      });
    }
    return due ? { done: done, due: due, pct: Math.round(done / due * 100) } : null;
  }
  function inRange(list, get, from, to) {
    return (Array.isArray(list) ? list : []).filter(function (e) { var d = e && get(e); return d && d >= from && d <= to; });
  }
  function avg(arr, get) {
    var v = arr.map(get).filter(function (x) { return typeof x === 'number' && isFinite(x); });
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null;
  }

  /* ── READINESS ─────────────────────────────────────────────────────────
     Oura's pattern: one number, but every contributor named and shown, so the
     member can see WHY. Each contributor is scored 0-100 from a logged entry
     and is simply absent when there is no entry; the score is their mean, and
     it is withheld below MIN_CONTRIB (CLAUDE.md 8.1 class 9 -- a number the
     data cannot support is not shown). Bands follow Oura's convention:
     85+ primed, 70-84 ready, under 70 recover. */
  var MIN_CONTRIB = 3;
  function contributors() {
    var out = [];
    var since24 = new Date(Date.now() - 864e5).toISOString();
    var sleep = read('omega_sleep_log');
    if (Array.isArray(sleep)) {
      var last = sleep.filter(function (e) { return e && (e.date === TODAY || e.date === YESTERDAY); })
                      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })[0];
      if (last && +last.hours > 0) {
        var h = +last.hours;
        out.push({ id: 'sleep', label: 'SLEEP DURATION', href: '/sleep.html', value: h.toFixed(1) + ' h',
          score: h >= 7 && h <= 9 ? 100 : (h < 7 ? Math.max(0, 100 - (7 - h) * 25) : Math.max(0, 100 - (h - 9) * 15)) });
        if (+last.quality >= 1) out.push({ id: 'quality', label: 'SLEEP QUALITY', href: '/sleep.html', value: (+last.quality) + ' / 5', score: Math.min(100, (+last.quality) * 20) });
      }
    }
    var mood = read('omega_mood_log');
    if (Array.isArray(mood)) {
      var m = mood.filter(function (e) { return e && typeof e.ts === 'string' && e.ts >= since24; })
                  .sort(function (a, b) { return b.ts.localeCompare(a.ts); })[0];
      if (m) {
        if (+m.valence >= 1) out.push({ id: 'mood', label: 'MOOD', href: '/mood.html', value: (+m.valence) + ' / 10', score: Math.min(100, (+m.valence) * 10) });
        if (+m.energy >= 1) out.push({ id: 'energy', label: 'ENERGY', href: '/mood.html', value: (+m.energy) + ' / 10', score: Math.min(100, (+m.energy) * 10) });
        if (+m.stress >= 1) out.push({ id: 'stress', label: 'CALM (LOW STRESS)', href: '/mood.html', value: 'stress ' + (+m.stress) + ' / 10', score: Math.max(0, Math.min(100, (11 - (+m.stress)) * 10)) });
      }
    }
    var wk = read('omega_workout_log');
    if (Array.isArray(wk) && wk.length) {
      var n = inRange(wk, function (e) { return day(e.ts); }, isoDaysBack(6), TODAY).length;
      /* Balance, not volume: rest days recover, a streak of seven does not. */
      out.push({ id: 'training', label: 'TRAINING BALANCE · 7D', href: '/workout.html', value: n + ' session' + (n === 1 ? '' : 's'),
        score: n === 0 ? 70 : (n <= 4 ? 100 : (n === 5 ? 85 : (n === 6 ? 70 : 55))) });
    }
    var hr = habitRate(isoDaysBack(6), TODAY);
    if (hr) out.push({ id: 'habits', label: 'HABIT CONSISTENCY · 7D', href: '/habits.html', value: hr.done + ' / ' + hr.due, score: hr.pct });
    return out;
  }
  function band(score) { return score >= 85 ? 'PRIMED' : (score >= 70 ? 'READY' : 'RECOVER'); }
  function tone(score) { return score >= 85 ? 'var(--green,#3fb27f)' : (score >= 70 ? 'var(--gold,#C9A84C)' : 'var(--crim,#CF6760)'); }

  function renderReadiness(host) {
    var cs = contributors();
    host.textContent = '';
    host.classList.add('ord');
    var head = document.createElement('div'); head.className = 'ord-head';
    var num = document.createElement('div'); num.className = 'ord-num';
    var cap = document.createElement('div'); cap.className = 'ord-cap';
    var title = document.createElement('div'); title.className = 'otd-title'; title.textContent = 'READINESS';
    var sub = document.createElement('div'); sub.className = 'ord-sub';
    if (cs.length < MIN_CONTRIB) {
      num.textContent = '—';
      sub.textContent = cs.length + ' of ' + MIN_CONTRIB + ' signals · log sleep, mood or training';
      host.setAttribute('data-omega-readiness-score', '');
    } else {
      var score = Math.round(cs.reduce(function (a, c) { return a + c.score; }, 0) / cs.length);
      num.textContent = String(score);
      num.style.color = tone(score);
      sub.textContent = band(score) + ' · ' + cs.length + ' signals';
      host.setAttribute('data-omega-readiness-score', String(score));
    }
    cap.appendChild(title); cap.appendChild(sub);
    head.appendChild(num); head.appendChild(cap);
    host.appendChild(head);
    var list = document.createElement('div'); list.className = 'ord-list';
    cs.forEach(function (c) {
      var a = document.createElement('a'); a.className = 'ord-row'; a.href = c.href;
      a.setAttribute('data-omega-readiness-contrib', c.id);
      var l = document.createElement('span'); l.className = 'otd-l'; l.textContent = c.label;
      var v = document.createElement('span'); v.className = 'ord-v'; v.textContent = c.value;
      var bar = document.createElement('span'); bar.className = 'ord-bar';
      var fill = document.createElement('i'); fill.style.width = Math.round(c.score) + '%'; fill.style.background = tone(c.score);
      bar.appendChild(fill);
      a.setAttribute('aria-label', c.label + ': ' + c.value + ', ' + Math.round(c.score) + ' of 100');
      a.appendChild(l); a.appendChild(v); a.appendChild(bar);
      list.appendChild(a);
    });
    host.appendChild(list);
  }

  /* ── THIS WEEK, MEASURED ───────────────────────────────────────────────
     The weekly review's missing half: what actually happened, counted from
     the stores, beside the member's own reflection. Monday-start, matching
     weekly.html getWeekKey(). A direction against last week is drawn only
     when BOTH weeks have data (a direction needs two readings). */
  function weekBounds(offsetWeeks) {
    var d = new Date(); var dow = d.getDay();
    var mon = new Date(d); mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) - 7 * (offsetWeeks || 0));
    var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    var to = offsetWeeks ? iso(sun) : TODAY;
    return { from: iso(mon), to: to };
  }
  function weekMetrics(b) {
    var m = {};
    var hr = habitRate(b.from, b.to); if (hr) m.habits = { v: hr.pct, fmt: hr.pct + '%', n: hr.due, unit: 'due', e: hr.done };
    var wk = read('omega_workout_log');
    if (Array.isArray(wk) && wk.length) { var w = inRange(wk, function (e) { return day(e.ts); }, b.from, b.to).length; m.training = { v: w, fmt: String(w), n: w, unit: w === 1 ? 'session' : 'sessions', e: w }; }
    var sl = inRange(read('omega_sleep_log'), function (e) { return e.date; }, b.from, b.to);
    var sa = avg(sl, function (e) { return +e.hours; }); if (sa != null) m.sleep = { v: sa, fmt: sa.toFixed(1) + ' h', n: sl.length, unit: sl.length === 1 ? 'night' : 'nights', e: sl.length };
    var mo = inRange(read('omega_mood_log'), function (e) { return day(e.ts); }, b.from, b.to);
    var ma = avg(mo, function (e) { return +e.valence; }); if (ma != null) m.mood = { v: ma, fmt: ma.toFixed(1) + ' / 10', n: mo.length, unit: mo.length === 1 ? 'check-in' : 'check-ins', e: mo.length };
    var wl = read('omega_water_log');
    if (Array.isArray(wl) && wl.length) {
      var goal = parseInt(raw('omega_water_goal') || '2500', 10) || 2500, byDay = {};
      inRange(wl, function (e) { return day(e.ts); }, b.from, b.to).forEach(function (e) { var k = day(e.ts); byDay[k] = (byDay[k] || 0) + (+e.ml || 0); });
      var hit = Object.keys(byDay).filter(function (k) { return byDay[k] >= goal; }).length;
      m.water = { v: hit, fmt: hit + ' day' + (hit === 1 ? '' : 's'), n: Object.keys(byDay).length, unit: 'days logged', e: Object.keys(byDay).length };
    }
    var md = read('omega_meditate_log');
    if (Array.isArray(md) && md.length) {
      var mins = Math.round(inRange(md, function (e) { return day(e.date); }, b.from, b.to).reduce(function (a, e) { return a + (+e.duration || 0); }, 0) / 60);
      m.stillness = { v: mins, fmt: mins + ' min', n: mins, unit: '', e: mins };
    }
    var br = inRange(read('omega_command_briefs'), function (e) { return e.date; }, b.from, b.to);
    var set = 0, done = 0;
    br.forEach(function (x) { (x.priorities || []).forEach(function (p) { if (p && String(p.text || '').trim()) { set++; if (p.done) done++; } }); });
    if (set) m.priorities = { v: Math.round(done / set * 100), fmt: done + ' / ' + set, n: set, unit: 'set', e: set };
    return m;
  }
  var WEEK_ROWS = [
    ['habits', 'HABITS KEPT', '/habits.html', true], ['priorities', 'PRIORITIES DONE', '/command.html', true],
    ['training', 'TRAINING', '/workout.html', true], ['sleep', 'SLEEP · AVG', '/sleep.html', true],
    ['mood', 'MOOD · AVG', '/mood.html', true], ['water', 'WATER GOAL MET', '/water.html', true],
    ['stillness', 'STILLNESS', '/meditate.html', true]
  ];
  function carryOver() {
    var br = read('omega_command_briefs'); if (!Array.isArray(br)) return [];
    var b = weekBounds(0), out = [];
    br.filter(function (x) { return x && x.date >= b.from && x.date < TODAY; })
      .sort(function (a, c) { return String(c.date).localeCompare(String(a.date)); })
      .forEach(function (x) { (x.priorities || []).forEach(function (p) {
        var t = p && String(p.text || '').trim();
        if (t && !p.done && out.indexOf(t) < 0 && out.length < 3) out.push(t);
      }); });
    return out;
  }
  function renderWeek(host) {
    var cur = weekMetrics(weekBounds(0)), prev = weekMetrics(weekBounds(1));
    host.textContent = '';
    host.classList.add('owk');
    var t = document.createElement('div'); t.className = 'otd-title'; t.textContent = 'THIS WEEK, MEASURED';
    host.appendChild(t);
    var grid = document.createElement('div'); grid.className = 'otd-grid';
    var shown = 0;
    WEEK_ROWS.forEach(function (r) {
      var c = cur[r[0]]; if (!c) return;
      shown++;
      var a = document.createElement('a'); a.className = 'otd-t'; a.href = r[2];
      a.setAttribute('data-omega-week-metric', r[0]);
      var v = document.createElement('span'); v.className = 'otd-v'; v.textContent = c.fmt;
      var p = prev[r[0]];
      /* `e` = entries the member actually logged in that week. A week with
         none (e.g. 0 of 21 habits ticked because the habits did not exist
         yet) is not a reading, so it cannot anchor a direction. */
      if (p && c.e && p.e && p.v !== c.v) {
        var up = c.v > p.v;
        var ar = document.createElement('small'); ar.className = 'owk-dir';
        ar.textContent = up ? ' ▲' : ' ▼';
        ar.style.color = up ? 'var(--green,#3fb27f)' : 'var(--crim,#CF6760)';
        ar.setAttribute('aria-label', (up ? 'up' : 'down') + ' from last week (' + p.fmt + ')');
        v.appendChild(ar);
        a.setAttribute('data-omega-week-dir', up ? 'up' : 'down');
      }
      var l = document.createElement('span'); l.className = 'otd-l'; l.textContent = r[1];
      var n = document.createElement('span'); n.className = 'owk-n'; n.textContent = c.unit ? c.n + ' ' + c.unit : '';
      a.appendChild(v); a.appendChild(l); if (c.unit) a.appendChild(n);
      grid.appendChild(a);
    });
    if (!shown) {
      var e = document.createElement('div'); e.className = 'ord-sub';
      e.textContent = 'Nothing logged this week yet — the review fills in as you track.';
      host.appendChild(e);
    } else host.appendChild(grid);
    var co = carryOver();
    if (co.length) {
      var box = document.createElement('div'); box.className = 'owk-carry';
      var h = document.createElement('div'); h.className = 'otd-l'; h.textContent = 'CARRY OVER · UNFINISHED PRIORITIES';
      box.appendChild(h);
      co.forEach(function (txt) { var li = document.createElement('div'); li.className = 'owk-item'; li.textContent = txt; box.appendChild(li); });
      host.appendChild(box);
    }
    host.setAttribute('data-omega-week-shown', String(shown));
  }

  /* For omega-reminders.js: each ritual's live state, re-dated first so a tab
     left open past midnight probes the new day rather than the one it loaded
     on. `state` is null for a module the member never used -- a reminder must
     never nag about one. */
  function status() {
    TODAY = iso(new Date()); YESTERDAY = iso(new Date(Date.now() - 864e5));
    return PROBES.map(function (p) {
      var st = null; try { st = p.probe(); } catch (e) {}
      return { id: p.id, label: p.label, href: p.href, state: st };
    });
  }
  /* Consecutive days before today on which every due habit was logged. A day
     with nothing due neither breaks nor extends it. `today` says whether
     today is already complete -- the streak is at risk only when it is not. */
  function habitStreak() {
    var hs = read('omega_habits_v2'); if (!Array.isArray(hs) || !hs.length) return null;
    var logs = read('omega_habit_logs_v2') || {};
    function complete(d) {
      var due = hs.filter(function (h) { return habitDueOn(h, d); });
      if (!due.length) return null;
      /* A day omega-streak-freeze.js froze for a habit counts as kept, as it
         does on habits.html -- otherwise this streak and the page's disagree. */
      var F = window.OmegaStreakFreeze;
      return due.every(function (h) {
        var k = h.freq === 'weekly' ? weekKey(new Date(d + 'T12:00:00')) : d;
        return !!(logs[k] && logs[k][h.id]) || !!(F && F.isFrozen && F.isFrozen(h.id, k));
      });
    }
    var n = 0, t = Date.now();
    for (var i = 1; i <= 366; i++) {
      var c = complete(iso(new Date(t - i * 864e5)));
      if (c === false) break;
      if (c === true) n++;
    }
    /* covered: every habit still open today has a freeze in hand, so missing
       today would be forgiven tomorrow -- the streak is not actually at risk. */
    var F2 = window.OmegaStreakFreeze, tk = iso(new Date(t));
    var open = hs.filter(function (h) { return habitDueOn(h, tk); }).filter(function (h) {
      var k = h.freq === 'weekly' ? weekKey(new Date(tk + 'T12:00:00')) : tk;
      return !(logs[k] && logs[k][h.id]);
    });
    var covered = !!(F2 && F2.available && open.length && open.every(function (h) { return F2.available(h.id) > 0; }));
    return { days: n, today: complete(tk), covered: covered };
  }

  window.OmegaToday = { render: renderAll, probes: PROBES.map(function (p) { return p.id; }), readiness: contributors, week: function () { return weekMetrics(weekBounds(0)); }, status: status, habitStreak: habitStreak };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
