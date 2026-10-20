/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-arena-core.js  (gaming.html only)

   ARENA: mastery is earned by play, and this board shows how.

   The six arcade games (omega-arcade.js) already pay mastery through
   achieve() -> OmegaProgress.record() -> complete_task('arcade:<id>'), once
   per game, when a real goal is met. Until 2026-10-18 the 72 text
   "games" in this page's catalogue paid the same axis for a click on a card
   of a game the platform does not host; that wiring is gone (owner decision,
   FIXES_LOG). This board makes the real path the visible one:

     GOALS     each game's achieve() condition, stated as the code checks it
     EARNED    task_completions rows named 'arcade:<id>' (RLS: own rows) --
               never inferred from a local best
     BEST      the game's own bestLabel() from omega_arcade_best

   One tap opens the game (OmegaArcade.open). The row below links the other
   play surfaces with their real numbers: FORGE (omega_forge_scores), EXAMS
   (omega_exam_best, scored by omega-exam-engine.js), SIMULATE, CIPHER.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaArenaCore) return;

  /* Goal text mirrors each achieve() call site in omega-arcade.js. */
  var GOALS = {
    ascend: 'Reach the 2048 tile',
    serpent: 'Grow to length 20',
    oracle: 'Solve a word',
    zodiac: 'Match all twelve pairs',
    aegis: 'Clear the first wall',
    hades: 'Clear a field'
  };
  var PASS = 70;

  var root, state = { earned: null, sb: null };

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function read(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }

  function style() {
    if (document.getElementById('oar-style')) return;
    var s = document.createElement('style');
    s.id = 'oar-style';
    s.textContent = [
      '.oar{display:grid;gap:12px;margin:0 0 18px}',
      '.oar-top{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px}',
      '.oar-top b{font-family:var(--R,sans-serif);font-size:var(--fs-5,28px);line-height:1;color:var(--ink,#eee)}',
      '.oar-top span{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.16em;color:var(--muted,#9aa)}',
      '.oar-goals{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}',
      '.oar-goal{display:grid;gap:4px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);text-align:left;color:var(--ink,#eee);cursor:pointer;overflow:visible;min-height:44px}',
      '.oar-goal.won{border-color:rgba(63,178,127,.6);background:rgba(63,178,127,.08)}',
      '.oar-goal strong{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.14em}',
      '.oar-goal span{font-family:var(--R,sans-serif);font-size:var(--fs-2,14px)}',
      '.oar-goal small{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.08em;color:var(--muted,#9aa)}',
      '.oar-goal em{font-style:normal;font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.12em;color:var(--gold,#d4af37)}',
      '.oar-goal.won em{color:var(--green,#3fb27f)}',
      '.oar-more{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}',
      '.oar-more a{display:grid;gap:2px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.1);text-decoration:none;color:var(--ink,#eee)}',
      '.oar-more a span{font-family:var(--M,monospace);font-size:var(--fs-1,12px);letter-spacing:.16em;color:var(--muted,#9aa)}',
      '.oar-more a b{font-family:var(--R,sans-serif);font-size:var(--fs-4,20px)}',
      '@media (max-width:700px){.oar-more{grid-template-columns:repeat(2,minmax(0,1fr))}}'
    ].join('');
    document.head.appendChild(s);
  }

  function paint() {
    var A = window.OmegaArcade;
    root.textContent = '';
    var games = A && A.list ? A.list() : [];
    var earnedN = state.earned ? games.filter(function (g) { return state.earned['arcade:' + g.id]; }).length : null;
    var top = el('div', 'oar-top', null, root);
    el('b', null, earnedN == null ? '…' : earnedN + '/' + games.length, top);
    el('span', null, earnedN == null ? 'MASTERY · CHECKING' : 'MASTERY EARNED BY PLAY', top);

    var grid = el('div', 'oar-goals', null, root);
    games.forEach(function (g) {
      var won = !!(state.earned && state.earned['arcade:' + g.id]);
      var b = el('button', 'oar-goal' + (won ? ' won' : ''), null, grid);
      b.type = 'button';
      b.setAttribute('data-game', g.id);
      el('strong', null, g.name, b);
      el('span', null, GOALS[g.id] || '', b);
      el('small', null, g.bestLabel || 'NOT PLAYED', b);
      el('em', null, won ? '✓ MASTERY EARNED' : (state.earned ? 'PLAY TO EARN' : ''), b);
      b.setAttribute('aria-label', g.name + '. Goal: ' + (GOALS[g.id] || '') + '. ' + (won ? 'Mastery earned.' : 'Not earned yet.') + ' Play.');
      b.addEventListener('click', function () { if (A && A.open) A.open(g.id); });
    });

    var more = el('div', 'oar-more', null, root);
    function door(href, label, value) {
      var a = el('a', null, null, more);
      a.href = href;
      el('span', null, label, a);
      el('b', null, value, a);
    }
    var forge = read('omega_forge_scores') || {};
    var fk = Object.keys(forge).filter(function (k) { return forge[k] && forge[k].best; });
    door('/forge.html', 'FORGE', fk.length ? fk.reduce(function (s, k) { return s + (+forge[k].best || 0); }, 0) + ' pts' : 'start');
    var best = read('omega_exam_best') || {};
    var passed = Object.keys(best).filter(function (k) { return best[k] && best[k].pct >= PASS; }).length;
    door('/academy.html#test', 'EXAMS', passed + '/12');
    door('/arena.html', 'SIMULATE', 'lab');
    door('/cipher.html', 'CIPHER', 'encode');
  }

  async function loadEarned() {
    try {
      state.sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null);
      if (!state.sb) return;
      var s = (await state.sb.auth.getSession()).data.session;
      if (!s || !s.user) return;
      var r = await state.sb.from('task_completions').select('task_name').eq('user_id', s.user.id).like('task_name', 'arcade:%');
      if (r.error) return;
      state.earned = {};
      (r.data || []).forEach(function (t) { state.earned[String(t.task_name)] = true; });
    } catch (e) { /* leave earned unknown rather than claim either state */ }
  }

  async function boot() {
    root = document.querySelector('[data-omega-arena-core]');
    if (!root) return;
    style();
    root.classList.add('oar');
    var tries = 0;
    while (!window.OmegaArcade && tries++ < 40) await new Promise(function (r) { setTimeout(r, 150); });
    paint();
    await loadEarned();
    paint();
    /* A game that meets its goal writes a task_completions row via
       complete_task; re-read when one reports back, and on return to the tab. */
    document.addEventListener('omega:progress', function () { loadEarned().then(paint); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) paint(); });
  }

  window.OmegaArenaCore = { goals: GOALS };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
