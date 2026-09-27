/* ==========================================================================
   Ω SYD OMEGA 91717 — ONE REVIEW QUEUE (omega-review.js)

   Service S5 in FEATURE_IDEAS.md, after Anki's single "study now" and
   Duolingo's one practice button: every flashcard and every vocabulary word
   that is due today, interleaved into one session, instead of two pages run
   separately. Interleaving mixed material is also what the spacing research
   favours over blocked practice of one kind at a time.

   Opened by any [data-omega-review-open] element (the TODAY panel's REVIEW
   chip) or by arriving at a page carrying this module with #review.

   Scheduling is omega-srs.js -- the same functions flashcard.html and
   vocabulary.html call -- so an item graded here is scheduled exactly as it
   would be on its own page. Each grade re-reads the store, updates that one
   item by id and writes it back, so a page open in another tab is never
   overwritten with a stale copy. Words reviewed are added to
   omega_vocab_log, the log vocabulary.html's stats and streak read.

   Member text (card faces, words, definitions) is set with textContent only.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaReview) return;

  var CARDS = 'omega_fc_cards', DECKS = 'omega_fc_decks', WORDS = 'omega_vocab', VLOG = 'omega_vocab_log';
  var MAX = 40;

  function read(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* Due cards and due words, oldest due first within each, then alternated. */
  function build() {
    var S = window.OmegaSRS, today = iso(new Date());
    var decks = {}; (read(DECKS) || []).forEach(function (d) { if (d && d.id != null) decks[d.id] = d.name; });
    var cs = (read(CARDS) || []).filter(function (c) { return c && S.isDue(c, 'card', today); })
      .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); })
      .map(function (c) { return { kind: 'card', id: c.id, front: c.front, back: c.back, tag: decks[c.deckId] || 'CARD', item: c }; });
    var ws = (read(WORDS) || []).filter(function (w) { return w && S.isDue(w, 'word', today); })
      .sort(function (a, b) { return String(a.nextReview).localeCompare(String(b.nextReview)); })
      .map(function (w) { return { kind: 'word', id: w.id, front: w.term, back: w.def, extra: w.example, tag: 'WORD', item: w }; });
    var q = [];
    for (var i = 0; q.length < MAX && (i < cs.length || i < ws.length); i++) {
      if (i < cs.length) q.push(cs[i]);
      if (i < ws.length && q.length < MAX) q.push(ws[i]);
    }
    return { queue: q, cards: cs.length, words: ws.length };
  }

  function counts() { var b = build(); return { cards: b.cards, words: b.words, total: b.cards + b.words }; }

  /* Read-modify-write one item by id, so a stale copy never overwrites. */
  function commit(entry, q) {
    var key = entry.kind === 'card' ? CARDS : WORDS;
    var list = read(key); if (!Array.isArray(list)) return false;
    var i = -1;
    for (var j = 0; j < list.length; j++) if (list[j] && String(list[j].id) === String(entry.id)) { i = j; break; }
    if (i < 0) return false;
    window.OmegaSRS.review(list[i], q, entry.kind);
    if (!write(key, list)) return false;
    if (entry.kind === 'word') {
      var log = read(VLOG); log = Array.isArray(log) ? log : [];
      var t = iso(new Date()), r = null;
      for (var k = 0; k < log.length; k++) if (log[k] && log[k].date === t) { r = log[k]; break; }
      if (r) r.count = (+r.count || 0) + 1; else log.push({ date: t, count: 1 });
      write(VLOG, log);
    }
    return true;
  }

  function css() {
    if (document.getElementById('omega-review-css')) return;
    var s = document.createElement('style'); s.id = 'omega-review-css';
    s.textContent =
      '#omega-review{position:fixed;inset:0;z-index:9600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(3,6,10,.86);backdrop-filter:blur(8px)}' +
      '.orv{width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:22px;border:1px solid rgba(201,168,76,.35);border-radius:16px;background:rgba(8,12,18,.97);box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
      '.orv-top{display:flex;align-items:center;gap:12px;font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--muted,#9A968A)}' +
      '.orv-top b{color:var(--gold,#C9A84C);font-weight:400}.orv-x{margin-left:auto}' +
      '.orv-bar{height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin:12px 0 18px;overflow:hidden}.orv-bar i{display:block;height:100%;background:var(--gold,#C9A84C)}' +
      '.orv-tag{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--cyan,#4FC3D8)}' +
      '.orv-front{font-family:var(--R,sans-serif);font-size:22px;color:var(--ink,#E8E2D0);margin:10px 0 16px;white-space:pre-wrap;overflow-wrap:anywhere}' +
      '.orv-back{font-family:var(--R,sans-serif);font-size:17px;color:var(--ink,#E8E2D0);border-top:1px solid rgba(201,168,76,.2);padding-top:14px;white-space:pre-wrap;overflow-wrap:anywhere}' +
      '.orv-ex{font-style:italic;color:var(--muted,#9A968A);margin-top:8px}' +
      '.orv-btns{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:18px}' +
      '.orv button{font-family:var(--M,monospace);font-size:12px;letter-spacing:1px;padding:10px 6px;border-radius:8px;cursor:pointer;border:1px solid rgba(201,168,76,.4);color:var(--gold,#C9A84C);background:none}' +
      /* flex column + !important: platform button rules lay a child inline. */
      '.orv .orv-btns button{display:flex!important;flex-direction:column;align-items:center;gap:3px}.orv-btns button small{opacity:.75;font-size:12px}' +
      '.orv-btns button[data-q="1"]{border-color:rgba(207,103,96,.6);color:var(--crim,#CF6760)}' +
      '.orv-show{width:100%;margin-top:6px}' +
      '.orv-done{font-family:var(--R,sans-serif);font-size:18px;color:var(--ink,#E8E2D0);margin:8px 0 16px}';
    document.head.appendChild(s);
  }

  var state = null, lastFocus = null;

  function close() {
    var o = document.getElementById('omega-review'); if (o) o.remove();
    document.removeEventListener('keydown', onKey, true);
    if (state && state.done && window.OmegaToday && window.OmegaToday.render) window.OmegaToday.render();
    state = null;
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }

  function onKey(e) {
    if (!state) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === ' ' && !state.shown) { e.preventDefault(); state.shown = true; paint(); return; }
    if (state.shown) {
      var b = window.OmegaSRS.BUTTONS.filter(function (x) { return x.key === e.key; })[0];
      if (b) { e.preventDefault(); grade(b.q); }
    }
  }

  function grade(q) {
    var entry = state.queue[state.i];
    if (commit(entry, q)) { state.done++; state[entry.kind === 'card' ? 'doneCards' : 'doneWords']++; }
    else state.failed++;
    state.i++; state.shown = false; paint();
  }

  function paint() {
    var box = document.querySelector('#omega-review .orv'); if (!box) return;
    box.textContent = '';
    var n = state.queue.length;
    var top = el('div', 'orv-top');
    top.appendChild(el('b', null, 'REVIEW'));
    top.appendChild(el('span', null, Math.min(state.i + 1, n) + ' / ' + n));
    var x = el('button', 'orv-x', 'CLOSE'); x.type = 'button'; x.addEventListener('click', close); top.appendChild(x);
    box.appendChild(top);
    var bar = el('div', 'orv-bar'), fill = el('i'); fill.style.width = (n ? (state.i / n) * 100 : 100) + '%'; bar.appendChild(fill); box.appendChild(bar);

    if (state.i >= n) {
      box.setAttribute('data-omega-review-state', 'done');
      box.appendChild(el('div', 'orv-done', n ? state.done + ' reviewed — ' + state.doneCards + ' card' + (state.doneCards === 1 ? '' : 's') + ', ' + state.doneWords + ' word' + (state.doneWords === 1 ? '' : 's') + '.' : 'Nothing is due. Cards and words you study come back here on their day.'));
      if (state.failed) box.appendChild(el('div', 'orv-ex', state.failed + ' could not be saved — the item was removed on its page meanwhile.'));
      var rest = counts();
      if (rest.total) box.appendChild(el('div', 'orv-ex', rest.total + ' more due — the queue takes ' + MAX + ' at a time.'));
      var d = el('button', 'orv-show', 'DONE'); d.type = 'button'; d.addEventListener('click', close); box.appendChild(d);
      d.focus();
      return;
    }
    var e = state.queue[state.i];
    box.setAttribute('data-omega-review-state', state.shown ? 'back' : 'front');
    box.setAttribute('data-omega-review-kind', e.kind);
    box.appendChild(el('div', 'orv-tag', String(e.tag).toUpperCase()));
    box.appendChild(el('div', 'orv-front', e.front == null ? '' : String(e.front)));
    if (!state.shown) {
      var sh = el('button', 'orv-show', 'SHOW ANSWER · SPACE'); sh.type = 'button';
      sh.addEventListener('click', function () { state.shown = true; paint(); });
      box.appendChild(sh); sh.focus();
      return;
    }
    var back = el('div', 'orv-back', e.back == null ? '' : String(e.back)); box.appendChild(back);
    if (e.extra) box.appendChild(el('div', 'orv-ex', '“' + e.extra + '”'));
    var row = el('div', 'orv-btns');
    window.OmegaSRS.BUTTONS.forEach(function (b) {
      var btn = el('button'); btn.type = 'button'; btn.setAttribute('data-q', String(b.q));
      btn.appendChild(document.createTextNode(b.label));
      btn.appendChild(el('small', null, window.OmegaSRS.hint(e.item, b.q, e.kind)));
      btn.title = b.label + ' (key ' + b.key + ')';
      btn.addEventListener('click', function () { grade(b.q); });
      row.appendChild(btn);
    });
    box.appendChild(row);
    row.children[2].focus();
  }

  function open() {
    if (!window.OmegaSRS) return;
    if (document.getElementById('omega-review')) return;
    css();
    lastFocus = document.activeElement;
    var b = build();
    state = { queue: b.queue, i: 0, shown: false, done: 0, doneCards: 0, doneWords: 0, failed: 0 };
    var o = el('div'); o.id = 'omega-review';
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Review queue');
    o.addEventListener('click', function (ev) { if (ev.target === o) close(); });
    o.appendChild(el('div', 'orv'));
    document.body.appendChild(o);
    document.addEventListener('keydown', onKey, true);
    paint();
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('[data-omega-review-open]');
    if (!t) return;
    e.preventDefault(); open();
  });

  /* #review opens the queue once the approval guard has revealed the page,
     never over a signed-out or pending visitor on their way to a redirect. */
  function boot() {
    if (location.hash !== '#review') return;
    var tries = 0;
    (function wait() {
      if (document.body && document.body.classList.contains('omega-approved') && window.OmegaSRS) { open(); return; }
      if (++tries < 40) setTimeout(wait, 250);
    })();
  }

  window.OmegaReview = { open: open, counts: counts, build: build };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
