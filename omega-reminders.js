/* ==========================================================================
   Ω SYD OMEGA 91717 — RITUAL REMINDERS (omega-reminders.js)

   Service S4 in FEATURE_IDEAS.md. Loaded by bg.js on every page; does
   nothing until the member turns reminders on (opt-in, off by default).

   Modelled on how the established apps do it, grounded here:
   - Duolingo splits pushes into two slots and caps them at two a day: a
     ROUTINE nudge in the member's habit window, and a SAVE nudge only when a
     streak is genuinely about to end. Every push needs a state trigger --
     nothing fires if every ritual is already done.
   - The habit window is REVEALED, not asked: "practised at 6pm yesterday,
     nudge at 5:30pm today". Here it is the median minute at which the member
     has completed rituals (last 14), minus 30 minutes. Until 3 completions
     are observed it says so and uses the member's chosen time instead
     (CLAUDE.md §8.1 class 9: no invented number).
   - Streaks/Todoist let the member fix the time instead: mode 'fixed'.
   - Quiet hours 22:30-07:30. No nudge ever lands in them.

   What it reads: OmegaToday.status() and .habitStreak() (omega-today.js,
   loaded on demand), i.e. each owning page's own store -- never a copy.

   Delivery, honestly scoped: a system notification through the service
   worker (sw.js handles the click) when the member granted permission, else
   an in-page card when the tab is visible. Either way a tab or installed
   window must be open; nothing here can wake a closed app. For that, the
   settings card offers a recurring calendar event with an alarm (.ics),
   which the phone's own calendar delivers. Server push (Web Push + VAPID +
   a scheduled Edge Function) is planned and needs owner setup --
   FEATURE_IDEAS.md S4.

   Stores (all omega_*, so omega-member-state.js mirrors them per member):
     omega_reminder_prefs  {on, mode:'smart'|'fixed', time:'HH:MM', save}
     omega_ritual_times    [{d:'YYYY-MM-DD', id, m:minuteOfDay}] last 14
     omega_reminder_sent   {d, routine, save} -- once per slot per day,
                           across tabs and (via the mirror) devices
   Member text is never rendered; every string here is a fixed label or a
   count, set through textContent.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaReminders) return;

  var PK = 'omega_reminder_prefs', TK = 'omega_ritual_times', SK = 'omega_reminder_sent';
  var KEEP = 14, MIN_SAMPLES = 3, LEAD = 30;
  var SAVE_AT = 21 * 60, QUIET_START = 22 * 60 + 30, QUIET_END = 7 * 60 + 30;
  var TICK_MS = 30000;

  function read(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(m) { m = ((Math.round(m) % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function parseHM(s) { var r = /^(\d{1,2}):(\d{2})$/.exec(String(s || '')); if (!r) return null; var h = +r[1], m = +r[2]; return h < 24 && m < 60 ? h * 60 + m : null; }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  /* Local calendar day: reminders are about the member's clock. */
  function localDay() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function prefs() {
    var p = read(PK) || {};
    return { on: p.on === true, mode: p.mode === 'fixed' ? 'fixed' : 'smart',
             time: parseHM(p.time) == null ? '19:00' : p.time, save: p.save !== false };
  }
  function setPrefs(patch) { var p = prefs(); for (var k in patch) p[k] = patch[k]; write(PK, p); return p; }

  function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }

  /* The routine slot for today: {at, learned, samples}. */
  function windowPlan() {
    var p = prefs(), t = read(TK); t = Array.isArray(t) ? t : [];
    var fixed = parseHM(p.time);
    if (p.mode === 'smart' && t.length >= MIN_SAMPLES) {
      var at = median(t.map(function (x) { return +x.m || 0; })) - LEAD;
      return { at: Math.max(QUIET_END, Math.min(at, SAVE_AT - 1)), learned: true, samples: t.length };
    }
    return { at: fixed, learned: false, samples: t.length };
  }

  /* ── observing completions ─────────────────────────────────────────
     A ritual is timed only when this tab SAW it go from open to done, so a
     store restored from the server on a new device (already done at load)
     never records the restore time as the member's habit time. */
  var seenOpen = {};
  function observe(items) {
    var day = localDay(), m = nowMin(), t = read(TK), changed = false;
    t = Array.isArray(t) ? t : [];
    items.forEach(function (it) {
      if (!it.state || it.id === 'workout') return;   // a 7-day window is not a daily act
      if (!it.state.done) { seenOpen[it.id] = day; return; }
      if (seenOpen[it.id] !== day) return;
      delete seenOpen[it.id];
      if (t.some(function (x) { return x.d === day && x.id === it.id; })) return;
      t.push({ d: day, id: it.id, m: m }); changed = true;
    });
    if (changed) write(TK, t.slice(-KEEP));
  }

  /* ── delivery ───────────────────────────────────────────────────── */
  function permission() { return ('Notification' in window) ? Notification.permission : 'unsupported'; }

  function card(title, body, url) {
    var old = document.getElementById('omega-reminder-card'); if (old) old.remove();
    var c = document.createElement('div');
    c.id = 'omega-reminder-card'; c.setAttribute('role', 'status');
    var h = document.createElement('div'); h.className = 'orm-t'; h.textContent = title;
    var b = document.createElement('div'); b.className = 'orm-b'; b.textContent = body;
    var row = document.createElement('div'); row.className = 'orm-a';
    var go = document.createElement('a'); go.href = url; go.textContent = 'OPEN';
    var x = document.createElement('button'); x.type = 'button'; x.textContent = 'DISMISS';
    x.addEventListener('click', function () { c.remove(); });
    row.appendChild(go); row.appendChild(x);
    c.appendChild(h); c.appendChild(b); c.appendChild(row);
    /* Top-right, not bottom: the floor is shared by five fixed widgets
       (share, feedback, dedication, the mobile dock, the consent bar) and a
       bottom-anchored card measured under the mobile dock and across SHARE. */
    css(); document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.remove(); }, 60000);
  }

  function show(kind, title, body, url) {
    if (permission() === 'granted' && navigator.serviceWorker) {
      return navigator.serviceWorker.getRegistration().then(function (reg) {
        var opt = { body: body, tag: 'omega-' + kind, icon: '/icon-192.png', badge: '/icon-192.png', data: { url: url } };
        if (reg && reg.showNotification) return reg.showNotification(title, opt).then(function () { return 'system'; });
        new Notification(title, opt); return 'system';
      }).catch(function () { card(title, body, url); return 'card'; });
    }
    card(title, body, url); return Promise.resolve('card');
  }

  /* Claims the slot BEFORE showing, so two tabs ticking together send one. */
  function claim(kind) {
    var day = localDay(), s = read(SK);
    if (!s || s.d !== day) s = { d: day };
    if (s[kind]) return false;
    s[kind] = Date.now(); write(SK, s); return true;
  }

  function approved() { return !!(document.body && document.body.classList.contains('omega-approved')); }
  function canDeliver() { return permission() === 'granted' || document.visibilityState === 'visible'; }

  function evaluate() {
    var T = window.OmegaToday; if (!T || !T.status) return null;
    var items = T.status();
    observe(items);
    var used = items.filter(function (i) { return i.state; });
    var open = used.filter(function (i) { return !i.state.done; });
    var st = T.habitStreak ? T.habitStreak() : null;
    return { items: items, used: used, open: open, streak: st };
  }

  function tick() {
    var p = prefs(); if (!p.on || !approved()) return;
    var ev = evaluate(); if (!ev) return;
    var m = nowMin();
    if (m < QUIET_END || m >= QUIET_START || !canDeliver()) return;
    var plan = windowPlan();
    /* SAVE: only a real streak, only while today is not yet complete. */
    if (p.save && m >= SAVE_AT && ev.streak && ev.streak.days >= 1 && ev.streak.today === false && claim('save')) {
      /* Honest urgency: when every open habit has a streak freeze in hand,
         missing today is forgiven, so say that instead of "ends at midnight". */
      if (ev.streak.covered) show('save', 'Your ' + ev.streak.days + '-day habit streak is protected tonight',
           'A streak freeze will cover today if you miss it — or check in and keep the freeze.', '/habits.html');
      else show('save', 'Your ' + ev.streak.days + '-day habit streak ends at midnight',
           'One check-in keeps it. Open Habits.', '/habits.html');
      return;
    }
    /* ROUTINE: from the window until quiet hours, only if something is
       actually open. A member first seen at 21:10 still gets it. */
    if (m >= plan.at && ev.open.length && claim('routine')) {
      var names = ev.open.slice(0, 3).map(function (i) { return i.label.replace(/ · 7D$/, '').toLowerCase(); }).join(', ');
      show('routine', ev.open.length + ' of ' + ev.used.length + ' ritual' + (ev.used.length === 1 ? '' : 's') + ' open', 'Next: ' + names + '. Today on Command.', '/command.html');
    }
  }

  /* ── calendar (.ics): the one path that reaches a closed app ────── */
  function icsText(at) {
    var d = new Date(), stamp = d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var day = String(d.getFullYear()) + pad(d.getMonth() + 1) + pad(d.getDate());
    var hm = hhmm(at).replace(':', '') + '00';
    var end = hhmm(at + 15).replace(':', '') + '00';
    var url = location.origin + '/command.html';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SYD OMEGA 91717//Rituals//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:omega-rituals-' + stamp + '@sydomega', 'DTSTAMP:' + stamp,
      'DTSTART:' + day + 'T' + hm, 'DTEND:' + day + 'T' + end, 'RRULE:FREQ=DAILY',
      'SUMMARY:Ω Rituals', 'DESCRIPTION:Today\'s rituals: ' + url, 'URL:' + url,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Ω Rituals', 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  }
  function downloadIcs() {
    var plan = windowPlan();
    var blob = new Blob([icsText(plan.at)], { type: 'text/calendar' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'omega-rituals.ics';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ── settings card: <div data-omega-reminders></div> ─────────────── */
  function css() {
    if (document.getElementById('omega-reminders-css')) return;
    var s = document.createElement('style'); s.id = 'omega-reminders-css';
    s.textContent =
      '#omega-reminder-card{position:fixed;right:16px;top:calc(env(safe-area-inset-top,0px) + 64px);z-index:9400;max-width:min(340px,calc(100vw - 32px));' +
        'padding:14px 16px;background:rgba(6,10,14,.94);border:1px solid rgba(201,168,76,.45);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5);backdrop-filter:blur(10px)}' +
      '.orm-t{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--gold,#C9A84C);text-transform:uppercase}' +
      '.orm-b{font-family:var(--R,sans-serif);font-size:15px;color:var(--ink,#E8E2D0);margin:6px 0 10px}' +
      '.orm-a{display:flex;gap:10px}.orm-a a,.orm-a button{font-family:var(--M,monospace);font-size:12px;letter-spacing:1px;padding:6px 12px;border-radius:6px;cursor:pointer;text-decoration:none;' +
        'border:1px solid rgba(201,168,76,.45);color:var(--gold,#C9A84C);background:none}' +
      '.orm{margin:0 0 18px;padding:18px;border:1px solid rgba(201,168,76,.22);border-radius:14px;background:rgba(255,255,255,.02)}' +
      '.orm-h{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
      '.orm-k{font-family:var(--M,monospace);font-size:12px;letter-spacing:3px;color:var(--gold,#C9A84C)}' +
      '.orm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:14px}' +
      '.orm-f{display:flex;flex-direction:column;gap:6px;font-family:var(--M,monospace);font-size:12px;letter-spacing:1px;color:var(--muted,#9A968A)}' +
      '.orm-f input[type=time],.orm-f select{font:inherit;color:var(--ink,#E8E2D0);background:rgba(0,0,0,.35);border:1px solid rgba(201,168,76,.25);border-radius:6px;padding:8px}' +
      '.orm-s{font-family:var(--R,sans-serif);font-size:15px;color:var(--ink,#E8E2D0);margin-top:14px}' +
      '.orm-n{font-family:var(--M,monospace);font-size:12px;color:var(--muted,#9A968A);margin-top:6px;line-height:1.6}' +
      '.orm-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}' +
      '.orm-btns button{font-family:var(--M,monospace);font-size:12px;letter-spacing:1px;padding:8px 14px;border-radius:8px;cursor:pointer;border:1px solid rgba(201,168,76,.4);color:var(--gold,#C9A84C);background:none}' +
      '.orm-btns button[aria-pressed=true]{background:rgba(201,168,76,.16)}' +
      '.orm-btns button:disabled{opacity:.5;cursor:default}';
    document.head.appendChild(s);
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function renderSettings(host) {
    css();
    var p = prefs(), plan = windowPlan(), perm = permission();
    host.textContent = '';
    var box = el('div', 'orm'); box.id = 'reminders';
    var head = el('div', 'orm-h');
    head.appendChild(el('div', 'orm-k', 'RITUAL REMINDERS'));
    var tg = el('button', null, p.on ? 'ON' : 'OFF'); tg.type = 'button';
    tg.setAttribute('aria-pressed', String(p.on)); tg.setAttribute('data-omega-reminders-toggle', '');
    tg.setAttribute('aria-label', 'Ritual reminders ' + (p.on ? 'on' : 'off'));
    tg.addEventListener('click', function () { setPrefs({ on: !prefs().on }); renderSettings(host); ensureToday(); });
    var hb = el('div', 'orm-btns'); hb.style.marginTop = '0'; hb.appendChild(tg); head.appendChild(hb);
    box.appendChild(head);

    var grid = el('div', 'orm-grid');
    var f1 = el('label', 'orm-f', 'TIMING');
    var sel = document.createElement('select');
    [['smart', 'Learn my rhythm'], ['fixed', 'Fixed time']].forEach(function (o) {
      var op = el('option', null, o[1]); op.value = o[0]; if (p.mode === o[0]) op.selected = true; sel.appendChild(op);
    });
    sel.addEventListener('change', function () { setPrefs({ mode: sel.value }); renderSettings(host); });
    f1.appendChild(sel); grid.appendChild(f1);
    var f2 = el('label', 'orm-f', p.mode === 'smart' ? 'UNTIL LEARNED, USE' : 'REMIND ME AT');
    var ti = document.createElement('input'); ti.type = 'time'; ti.value = p.time;
    ti.addEventListener('change', function () { if (parseHM(ti.value) != null) { setPrefs({ time: ti.value }); renderSettings(host); } });
    f2.appendChild(ti); grid.appendChild(f2);
    var f3 = el('label', 'orm-f', 'STREAK SAVE · ' + hhmm(SAVE_AT));
    var sv = document.createElement('select');
    [['1', 'Warn me if a streak is at risk'], ['0', 'Never']].forEach(function (o) {
      var op = el('option', null, o[1]); op.value = o[0]; if ((p.save ? '1' : '0') === o[0]) op.selected = true; sv.appendChild(op);
    });
    sv.addEventListener('change', function () { setPrefs({ save: sv.value === '1' }); });
    f3.appendChild(sv); grid.appendChild(f3);
    box.appendChild(grid);

    var status = el('div', 'orm-s');
    status.setAttribute('data-omega-reminders-at', hhmm(plan.at));
    status.textContent = !p.on ? 'Off. Nothing will be sent.'
      : 'Daily nudge at ' + hhmm(plan.at) + (plan.learned ? ' — learned from your last ' + plan.samples + ' check-ins' : '')
        + ', only if a ritual is still open. At most two a day; quiet 22:30–07:30.';
    box.appendChild(status);
    if (p.mode === 'smart' && !plan.learned) {
      box.appendChild(el('div', 'orm-n', 'Learning your rhythm: ' + plan.samples + ' of ' + MIN_SAMPLES + ' check-ins seen. Until then, ' + p.time + '.'));
    }
    box.appendChild(el('div', 'orm-n', perm === 'granted' ? 'Device alerts allowed.'
      : perm === 'denied' ? 'Device alerts are blocked in this browser\'s site settings — nudges appear inside Ω instead.'
      : perm === 'unsupported' ? 'This browser has no device alerts — nudges appear inside Ω.'
      : 'Device alerts not yet allowed — nudges appear inside Ω until you allow them.'));
    box.appendChild(el('div', 'orm-n', 'Alerts arrive while Ω is open in a tab or installed window. For a reminder when it is closed, add the calendar event — your phone\'s calendar delivers it.'));

    var btns = el('div', 'orm-btns');
    if (perm === 'default') {
      var al = el('button', null, 'ALLOW DEVICE ALERTS'); al.type = 'button';
      al.addEventListener('click', function () {
        Notification.requestPermission().then(function () { renderSettings(host); });
      });
      btns.appendChild(al);
    }
    var te = el('button', null, 'SEND A TEST'); te.type = 'button';
    te.addEventListener('click', function () {
      ensureToday(function () {
        var ev = evaluate();
        var n = ev ? ev.open.length : 0, u = ev ? ev.used.length : 0;
        show('test', 'Test · ' + n + ' of ' + u + ' rituals open', 'This is how a nudge will look.', '/command.html');
      });
    });
    btns.appendChild(te);
    var ic = el('button', null, 'ADD TO CALENDAR · ' + hhmm(plan.at)); ic.type = 'button';
    ic.setAttribute('data-omega-reminders-ics', '');
    ic.addEventListener('click', downloadIcs);
    btns.appendChild(ic);
    box.appendChild(btns);
    host.appendChild(box);
  }

  /* omega-today.js owns the probes; load it where the page did not. */
  function ensureToday(cb) {
    if (window.OmegaToday) { if (cb) cb(); return; }
    var s = document.querySelector('script[src="/omega-today.js"]');
    if (!s) { s = document.createElement('script'); s.src = '/omega-today.js'; s.defer = true; document.head.appendChild(s); }
    s.addEventListener('load', function () { if (cb) cb(); });
  }

  function mountAll() {
    document.querySelectorAll('[data-omega-reminders]').forEach(function (h) { try { renderSettings(h); } catch (e) { console.warn('[reminders]', e); } });
  }

  function boot() {
    mountAll();
    /* First check after the once-per-browser genesis intro (~3.9s, bg.js)
       has cleared and omega-member-state.js has had a moment to restore the
       stores -- a nudge painted under the splash was measured unclickable. */
    setTimeout(function () { if (prefs().on) ensureToday(tick); }, 4500);
    setInterval(function () { if (prefs().on) ensureToday(tick); }, TICK_MS);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && prefs().on) ensureToday(tick); });
  }

  window.OmegaReminders = { prefs: prefs, plan: windowPlan, tick: tick, ics: icsText, render: mountAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
