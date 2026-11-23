/* ==========================================================================
   Ω SYD OMEGA 91717 — MICRO-LESSONS (omega-microlesson.js)

   Blueprint point 828, "opt-in micro-lessons: flashcard reviews offered in short idle moments, never pushed".
   Loaded by bg.js on every page and INERT until the member turns it on in Notifications (off by default, like omega-reminders.js,
   whose conventions this follows: omega_* stores the member-state mirror syncs, a top-right in-page card because the floor is shared
   by five fixed widgets, text only via textContent).

   WHAT "NEVER PUSHED" MEANS HERE, AS CODE
     - No system notification, no sound, no focus change, no page navigation. A small card appears; the member decides.
     - Only after about 90 seconds with no input at all, on a visible tab.
     - Never while something is being typed (an input, textarea, select or editable element has focus) or any modal dialog is open.
     - Never in quiet hours (22:30-07:30, the same window omega-reminders.js keeps), never on a public page, never before the approval
       guard has confirmed the member.
     - At most twice a day, at least three hours apart. "NOT NOW" ends the offers for the day.
     - Never when nothing is due. The count is OmegaReview.counts().total, the figure the review session itself uses; nothing is estimated
       and no duration is promised.

   The review UI is omega-review.js (the one review queue) and its scheduler omega-srs.js. Only academy.html loads them, so they are
   added on demand, and only for a member who opted in and has been idle.

   Stores:  omega_micro_prefs {on}        off unless exactly true
            omega_micro_sent  {d, n, t}   offers made today (local day), and when the last one was
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaMicroLesson) return;

  var PK = 'omega_micro_prefs', SK = 'omega_micro_sent';
  var IDLE_MS = 90000, TICK_MS = 5000, MAX_PER_DAY = 2, GAP_MS = 3 * 3600000, SHOW_MS = 45000;
  var QUIET_START = 22 * 60 + 30, QUIET_END = 7 * 60 + 30;
  var PUBLIC = /^\/(?:|index|account|enter|reset|terms|pending)(?:\.html)?$/;

  function read(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function localDay() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function quiet() { var m = nowMin(); return m >= QUIET_START || m < QUIET_END; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function prefs() { var p = read(PK) || {}; return { on: p.on === true }; }
  function setOn(on) { write(PK, { on: !!on }); }
  function sent() { var s = read(SK) || {}; return s.d === localDay() ? { d: s.d, n: +s.n || 0, t: +s.t || 0 } : { d: localDay(), n: 0, t: 0 }; }

  /* ── what the review queue says is due (loads its two modules on demand) ── */
  function load(src, test, cb) {
    if (test()) { cb(); return; }
    var s = document.querySelector('script[src="' + src + '"]');
    if (!s) { s = document.createElement('script'); s.src = src; s.defer = true; document.head.appendChild(s); }
    s.addEventListener('load', function () { cb(); });
  }
  function withReview(cb) {
    load('/omega-srs.js', function () { return !!window.OmegaSRS; }, function () {
      load('/omega-review.js', function () { return !!window.OmegaReview; }, function () { if (window.OmegaReview && window.OmegaReview.counts) cb(); });
    });
  }

  /* ── the card ─────────────────────────────────────────────────────── */
  function css() {
    if (document.getElementById('omega-micro-css')) return;
    var s = document.createElement('style'); s.id = 'omega-micro-css';
    s.textContent =
      '#omega-micro-card{position:fixed;right:16px;top:calc(env(safe-area-inset-top,0px) + 64px);z-index:9400;max-width:min(340px,calc(100vw - 32px));' +
        'padding:14px 16px;background:rgba(6,10,14,.94);border:1px solid rgba(201,168,76,.45);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5);backdrop-filter:blur(10px)}' +
      '.omc-t{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--gold,#C9A84C);text-transform:uppercase}' +
      '.omc-b{font-family:var(--R,sans-serif);font-size:var(--fs-3,16px);color:var(--ink,#E8E2D0);margin:6px 0 10px;line-height:1.45}' +
      '.omc-a{display:flex;gap:10px}.omc-a button{font-family:var(--M,monospace);font-size:12px;letter-spacing:1px;padding:8px 14px;min-height:44px;border-radius:6px;cursor:pointer;' +
        'border:1px solid rgba(201,168,76,.45);color:var(--gold,#C9A84C);background:none}' +
      '.omc-a button:first-child{background:rgba(201,168,76,.16)}' +
      '.omc{margin:0 0 18px;padding:18px;border:1px solid rgba(201,168,76,.22);border-radius:14px;background:rgba(255,255,255,.02)}' +
      '.omc-h{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
      '.omc-k{font-family:var(--M,monospace);font-size:12px;letter-spacing:3px;color:var(--gold,#C9A84C)}' +
      '.omc-n{font-family:var(--M,monospace);font-size:12px;color:var(--muted,#9A968A);margin-top:8px;line-height:1.6}' +
      '.omc-h button{font-family:var(--M,monospace);font-size:12px;letter-spacing:1px;padding:8px 14px;min-height:44px;border-radius:8px;cursor:pointer;border:1px solid rgba(201,168,76,.4);' +
        'color:var(--gold,#C9A84C);background:none}.omc-h button[aria-pressed=true]{background:rgba(201,168,76,.16)}';
    document.head.appendChild(s);
  }

  function dismissCard() { var c = document.getElementById('omega-micro-card'); if (c) c.remove(); }

  function showCard(total) {
    css(); dismissCard();
    var c = el('div'); c.id = 'omega-micro-card'; c.setAttribute('role', 'status'); c.setAttribute('aria-live', 'polite');
    c.appendChild(el('div', 'omc-t', 'Review due'));
    c.appendChild(el('div', 'omc-b', total + (total === 1 ? ' card or word is due.' : ' cards and words are due.') + ' A short session keeps them from piling up.'));
    var row = el('div', 'omc-a');
    var go = el('button', null, 'REVIEW'); go.type = 'button';
    go.addEventListener('click', function () { dismissCard(); if (window.OmegaReview && window.OmegaReview.open) window.OmegaReview.open(); });
    var no = el('button', null, 'NOT NOW'); no.type = 'button';
    no.addEventListener('click', function () { var s = sent(); write(SK, { d: s.d, n: MAX_PER_DAY, t: Date.now() }); dismissCard(); });
    row.appendChild(go); row.appendChild(no); c.appendChild(row);
    document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.remove(); }, SHOW_MS);
  }

  /* ── when it may speak ───────────────────────────────────────────── */
  function shown(e) {
    var r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
    var c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden';
  }
  function busy() {
    var a = document.activeElement, tag = a && a.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (a && a.isContentEditable)) return true;
    /* Only a dialog the member can SEE counts: dashboard.html alone carries three hidden aria-modal dialogs, and counting those made the
       module permanently "busy" there (found by a control scenario that should have shown a card and did not). */
    var ds = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
    for (var i = 0; i < ds.length; i++) if (shown(ds[i])) return true;
    /* The guided tour (omega-tour.js, Shepherd) is a modal overlay but not an aria-modal dialog element. */
    var tour = document.querySelectorAll('.shepherd-element, .shepherd-modal-is-visible');
    for (var j = 0; j < tour.length; j++) if (shown(tour[j])) return true;
    return !!(document.getElementById('omega-micro-card') || document.getElementById('omega-reminder-card'));
  }
  function eligible() {
    if (!prefs().on) return false;
    if (document.visibilityState !== 'visible') return false;
    if (PUBLIC.test(location.pathname)) return false;
    if (!document.body || !document.body.classList.contains('omega-approval-confirmed')) return false;
    if (quiet() || busy()) return false;
    var s = sent();
    return s.n < MAX_PER_DAY && (Date.now() - s.t) >= GAP_MS;
  }

  var last = Date.now(), checking = false;
  function touch() { last = Date.now(); }
  function tick() {
    if (checking || Date.now() - last < IDLE_MS || !eligible()) return;
    checking = true;
    withReview(function () {
      checking = false;
      if (!eligible()) return;                               // state may have changed while the modules loaded
      var total = window.OmegaReview.counts().total;
      if (!(total > 0)) return;                              // nothing due: say nothing, spend no offer
      var s = sent(); write(SK, { d: s.d, n: s.n + 1, t: Date.now() });
      showCard(total);
    });
  }

  /* ── the settings card: <div data-omega-microlesson></div> ────────── */
  function renderSettings(host) {
    while (host.firstChild) host.removeChild(host.firstChild);
    css();
    var p = prefs(), wrap = el('div', 'omc'), h = el('div', 'omc-h');
    h.appendChild(el('div', 'omc-k', 'MICRO-LESSONS'));
    var tg = el('button', null, p.on ? 'ON' : 'OFF'); tg.type = 'button';
    tg.setAttribute('aria-pressed', String(p.on)); tg.setAttribute('data-omega-microlesson-toggle', '');
    tg.addEventListener('click', function () { setOn(!prefs().on); renderSettings(host); });
    h.appendChild(tg); wrap.appendChild(h);
    wrap.appendChild(el('div', 'omc-n', 'When on, after about 90 seconds without any input, a small card offers a short review of the cards and words that are due.'));
    wrap.appendChild(el('div', 'omc-n', 'It never pushes: no notification, no sound, nothing while you type or while a dialog is open, nothing from 22:30 to 07:30, at most twice a day, and nothing at all when nothing is due. Off by default, and this setting is yours alone.'));
    var due = el('div', 'omc-n', p.on ? 'Counting what is due...' : ''); wrap.appendChild(due);
    host.appendChild(wrap);
    if (p.on) withReview(function () { due.textContent = 'Due right now: ' + window.OmegaReview.counts().total + '.'; });
  }
  function mountAll() { document.querySelectorAll('[data-omega-microlesson]').forEach(function (h) { try { renderSettings(h); } catch (e) { console.warn('[microlesson]', e); } }); }

  ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart', 'scroll'].forEach(function (ev) { window.addEventListener(ev, touch, { passive: true, capture: true }); });
  setInterval(tick, TICK_MS);
  window.OmegaMicroLesson = { prefs: prefs, setOn: setOn, sent: sent };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll); else mountAll();
})();
