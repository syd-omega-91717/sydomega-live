/* omega-exam-engine.js — real multiple-choice exams (window.OmegaExam).
 *
 * Bank: /omega-exam-bank.json — 12 sectors x 20 questions, each
 *   {id, q, options[4], answer:0-3, why, level}.
 * mount(el): sector grid -> exam (10 random questions, shuffled options, one at
 *   a time, optional 45s timer ring, keys 1-4 / A-D + Enter) -> result (score
 *   ring, mistakes review, Retry / Other sector).
 *
 * Storage (localStorage, every access wrapped — it can throw or come back empty):
 *   omega_exam_best  {sectorId: {pct, score, n, runs, answered, at}}
 *   omega_exam_timer "1" when the 45s timer is on
 * A pass (>= 70%) calls window.OmegaProgress.record(); that module dedups
 * server-side and checks .error itself, so no success toast is shown here.
 * All bank text goes in through textContent, never innerHTML.
 */
(function () {
  'use strict';
  if (window.OmegaExam) return;

  var BANK_URL = '/omega-exam-bank.json';
  var BEST_KEY = 'omega_exam_best';
  var TIMER_KEY = 'omega_exam_timer';
  var PER_RUN = 10;
  var PASS_PCT = 70;
  var SECONDS = 45;
  var KEYS = ['A', 'B', 'C', 'D'];

  var bankPromise = null;
  var keyHandler = null;

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }

  function readBest() {
    var raw = lsGet(BEST_KEY);
    if (!raw) return {};
    try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
  }
  function writeBest(o) { lsSet(BEST_KEY, JSON.stringify(o)); }

  function stats() {
    var best = readBest(), passed = 0, sum = 0, cnt = 0, answered = 0;
    Object.keys(best).forEach(function (k) {
      var b = best[k] || {};
      if (typeof b.pct === 'number') { sum += b.pct; cnt++; if (b.pct >= PASS_PCT) passed++; }
      answered += (b.answered | 0);
    });
    return { passed: passed, avg: cnt ? Math.round(sum / cnt) : 0, attempted: cnt, answered: answered };
  }

  function loadBank() {
    if (!bankPromise) {
      bankPromise = fetch(BANK_URL, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('bank ' + r.status);
        return r.json();
      }).then(function (b) {
        if (!b || !Array.isArray(b.sectors)) throw new Error('bank shape');
        return b;
      }).catch(function (e) { bankPromise = null; throw e; });
    }
    return bankPromise;
  }

  function ensureProgress() {
    if (window.OmegaProgress || document.querySelector('script[data-omega-progress]')) return;
    var s = document.createElement('script');
    s.src = '/omega-progress.js';
    s.defer = true;
    s.setAttribute('data-omega-progress', '1');
    (document.head || document.documentElement).appendChild(s);
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(cls, text, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  /* ── styles ─────────────────────────────────────────────── */
  function injectCss() {
    if (document.getElementById('oxe-css')) return;
    var css = [
      '.oxe-root{--oxe-c:var(--gold,#C9A84C);font-family:var(--R,system-ui,sans-serif);color:var(--ink,#e9e6dc);max-width:880px;margin:0 auto;min-width:0}',
      '.oxe-root *{box-sizing:border-box}',
      '.oxe-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;flex-wrap:wrap}',
      '.oxe-lbl{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;color:var(--muted,#8a8676);text-transform:uppercase}',
      '.oxe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr));gap:12px}',
      '.oxe-tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:132px;padding:16px 10px;border:1px solid color-mix(in srgb,var(--oxe-c) 35%,transparent);background:linear-gradient(160deg,color-mix(in srgb,var(--oxe-c) 12%,transparent),rgba(8,10,14,.6));border-radius:14px;color:var(--ink,#e9e6dc);cursor:pointer;font:inherit;text-align:center;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}',
      '.oxe-tile:hover,.oxe-tile:focus-visible{border-color:var(--oxe-c);box-shadow:0 0 0 1px var(--oxe-c),0 10px 30px -12px var(--oxe-c);transform:translateY(-2px);outline:none}',
      '.oxe-glyph{font-family:var(--D,serif);font-size:40px;line-height:1;color:var(--oxe-c);text-shadow:0 0 18px color-mix(in srgb,var(--oxe-c) 55%,transparent)}',
      '.oxe-name{font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;line-height:1.3}',
      '.oxe-badge{position:absolute;top:8px;right:8px;font-family:var(--M,monospace);font-size:12px;padding:2px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.15);color:var(--muted,#8a8676)}',
      '.oxe-badge.pass{color:#06120c;background:var(--green,#3fb27f);border-color:var(--green,#3fb27f)}',
      '.oxe-badge.low{color:var(--ink,#e9e6dc);border-color:var(--crim,#CF6760)}',
      '.oxe-toggle{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:var(--muted,#8a8676);font-family:var(--M,monospace);font-size:12px;letter-spacing:1.5px;cursor:pointer}',
      '.oxe-toggle[aria-pressed="true"]{color:var(--cyan,#00E5FF);border-color:var(--cyan,#00E5FF)}',
      '.oxe-dot{width:8px;height:8px;border-radius:50%;background:currentColor}',
      '.oxe-head{display:flex;align-items:center;gap:12px;margin-bottom:10px}',
      '.oxe-head .oxe-glyph{font-size:28px}',
      '.oxe-head .oxe-name{flex:1;min-width:0}',
      '.oxe-x{min-width:44px;min-height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:transparent;color:var(--muted,#8a8676);font-size:18px;cursor:pointer}',
      '.oxe-x:hover,.oxe-x:focus-visible{color:var(--ink,#e9e6dc);border-color:var(--oxe-c)}',
      '.oxe-ring{width:44px;height:44px;flex:none}',
      '.oxe-prog{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;margin-bottom:18px}',
      '.oxe-prog>i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--oxe-c),var(--cyan,#00E5FF));transition:width .35s ease}',
      '.oxe-q{font-family:var(--R,system-ui,sans-serif);font-size:clamp(18px,4.4vw,24px);font-weight:600;line-height:1.35;margin:0 0 18px;overflow-wrap:anywhere}',
      '.oxe-opts{display:grid;gap:10px}',
      '.oxe-opt{display:flex;align-items:center;justify-content:flex-start;gap:12px;width:100%;min-height:52px;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(10,12,18,.55);color:var(--ink,#e9e6dc);font:inherit;font-size:16px;text-align:left;cursor:pointer;overflow-wrap:anywhere;transition:border-color .15s ease,background .15s ease}',
      '.oxe-opt:hover:not(:disabled),.oxe-opt:focus-visible{border-color:var(--oxe-c);outline:none}',
      '.oxe-opt:disabled{cursor:default}',
      '.oxe-k{flex:none;display:inline-grid;place-items:center;width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.2);font-family:var(--M,monospace);font-size:12px;color:var(--muted,#8a8676)}',
      '.oxe-opt.ok{border-color:var(--green,#3fb27f);background:color-mix(in srgb,var(--green,#3fb27f) 18%,transparent)}',
      '.oxe-opt.ok .oxe-k{background:var(--green,#3fb27f);color:#06120c;border-color:transparent}',
      '.oxe-opt.no{border-color:var(--crim,#CF6760);background:color-mix(in srgb,var(--crim,#CF6760) 18%,transparent)}',
      '.oxe-opt.no .oxe-k{background:var(--crim,#CF6760);color:#14060a;border-color:transparent}',
      '.oxe-opt.dim{opacity:.55}',
      '.oxe-fb{margin-top:14px;padding:12px 14px;border-radius:12px;border-left:3px solid var(--green,#3fb27f);background:rgba(255,255,255,.04);font-size:15px;line-height:1.45;overflow-wrap:anywhere}',
      '.oxe-fb.no{border-left-color:var(--crim,#CF6760)}',
      '.oxe-fb b{font-family:var(--M,monospace);font-size:12px;letter-spacing:2px;margin-right:8px}',
      '.oxe-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px}',
      '.oxe-root .oxe-btn{min-height:44px;min-width:44px;padding:0 20px;border-radius:999px;border:1px solid var(--oxe-c);background:transparent;color:var(--ink,#e9e6dc);font-family:var(--M,monospace);font-size:13px;letter-spacing:2px;cursor:pointer}',
      '.oxe-root .oxe-btn.oxe-primary{background:var(--oxe-c);color:#0a0a0f;font-weight:700}',
      '.oxe-root .oxe-btn:focus-visible{outline:2px solid var(--cyan,#00E5FF);outline-offset:2px}',
      '.oxe-res{text-align:center}',
      '.oxe-score{width:180px;height:180px;display:block;margin:6px auto 10px}',
      '.oxe-verdict{font-family:var(--D,serif);font-size:22px;letter-spacing:3px;color:var(--oxe-c)}',
      '.oxe-review{list-style:none;padding:0;margin:20px 0 0;text-align:left;display:grid;gap:10px}',
      '.oxe-review li{padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(10,12,18,.5);overflow-wrap:anywhere}',
      '.oxe-rq{font-weight:600;margin-bottom:6px}',
      '.oxe-ra{font-size:14px;line-height:1.5}',
      '.oxe-ra .no{color:var(--crim,#CF6760)}.oxe-ra .ok{color:var(--green,#3fb27f)}',
      '.oxe-rw{font-size:13px;color:var(--muted,#8a8676);margin-top:4px}',
      '.oxe-msg{padding:24px;text-align:center;color:var(--muted,#8a8676);font-family:var(--M,monospace);font-size:12px;letter-spacing:2px}',
      '.oxe-enter{animation:oxe-in .32s ease both}',
      '@keyframes oxe-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      '@media (prefers-reduced-motion:reduce){.oxe-enter{animation:none}.oxe-tile,.oxe-prog>i,.oxe-opt{transition:none}.oxe-tile:hover{transform:none}}'
    ].join('\n');
    var s = document.createElement('style');
    s.id = 'oxe-css';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ── canvas rings (fixed CSS size, never measured from layout) ── */
  function sizeCanvas(c, px) {
    var dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    c.width = Math.round(px * dpr); c.height = Math.round(px * dpr);
    c.style.width = px + 'px'; c.style.height = px + 'px';
    var g = c.getContext('2d');
    if (g) g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  }
  function cssVar(name, fb) {
    try { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch (e) { return fb; }
  }
  function drawRing(g, px, frac, color, lw, label, font) {
    if (!g) return;
    var r = px / 2 - lw / 2 - 1;
    g.clearRect(0, 0, px, px);
    g.lineWidth = lw; g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.1)';
    g.beginPath(); g.arc(px / 2, px / 2, r, 0, Math.PI * 2); g.stroke();
    if (frac > 0) {
      g.strokeStyle = color;
      g.beginPath(); g.arc(px / 2, px / 2, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac)); g.stroke();
    }
    if (label != null) {
      g.fillStyle = cssVar('--ink', '#e9e6dc');
      g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label, px / 2, px / 2 + 1);
    }
  }

  /* ── controller ─────────────────────────────────────────── */
  function mount(host) {
    if (!host) return null;
    injectCss();
    ensureProgress();
    var root = el('div', 'oxe-root');
    host.textContent = '';
    host.appendChild(root);

    var bank = null, run = null, timerRaf = 0;

    function stopTimer() { if (timerRaf) cancelAnimationFrame(timerRaf); timerRaf = 0; }
    function timerOn() { return lsGet(TIMER_KEY) === '1'; }
    function emit() {
      try { root.dispatchEvent(new CustomEvent('omega-exam:update', { bubbles: true, detail: stats() })); } catch (e) { /* old browser */ }
    }
    function view(node) {
      stopTimer();
      root.textContent = '';
      if (!reduced()) node.classList.add('oxe-enter');
      root.appendChild(node);
    }

    /* grid */
    function renderGrid() {
      run = null;
      root.style.setProperty('--oxe-c', 'var(--gold,#C9A84C)');
      var wrap = el('div');
      var bar = el('div', 'oxe-bar');
      bar.appendChild(el('span', 'oxe-lbl', 'Choose a sector'));
      var tg = btn('oxe-toggle', null, function () {
        var on = !timerOn();
        lsSet(TIMER_KEY, on ? '1' : '0');
        tg.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      tg.setAttribute('aria-pressed', timerOn() ? 'true' : 'false');
      tg.setAttribute('aria-label', '45 second timer per question');
      tg.appendChild(el('span', 'oxe-dot'));
      tg.appendChild(document.createTextNode(SECONDS + 's TIMER'));
      bar.appendChild(tg);
      wrap.appendChild(bar);

      var grid = el('div', 'oxe-grid');
      var best = readBest();
      bank.sectors.forEach(function (s) {
        var t = btn('oxe-tile', null, function () { start(s); });
        t.style.setProperty('--oxe-c', s.color || 'var(--gold)');
        t.setAttribute('data-sector', s.id);
        var b = best[s.id];
        t.setAttribute('aria-label', s.name + (b ? ', best ' + b.pct + '%' : ', not attempted'));
        var g = el('span', 'oxe-glyph', s.glyph); g.setAttribute('aria-hidden', 'true');
        t.appendChild(g);
        t.appendChild(el('span', 'oxe-name', s.name));
        var badge = el('span', 'oxe-badge' + (b ? (b.pct >= PASS_PCT ? ' pass' : ' low') : ''), b ? b.pct + '%' : '—');
        badge.setAttribute('aria-hidden', 'true');
        t.appendChild(badge);
        grid.appendChild(t);
      });
      wrap.appendChild(grid);
      view(wrap);
    }

    /* exam */
    function start(sector) {
      var qs = shuffle(sector.questions).slice(0, Math.min(PER_RUN, sector.questions.length));
      run = {
        sector: sector, i: 0, score: 0, answers: [], timed: timerOn(),
        items: qs.map(function (q) {
          return { q: q, opts: shuffle(q.options.map(function (t, k) { return { text: t, correct: k === q.answer }; })) };
        })
      };
      root.style.setProperty('--oxe-c', sector.color || 'var(--gold)');
      renderQuestion();
    }

    function renderQuestion() {
      var it = run.items[run.i], n = run.items.length, s = run.sector;
      var wrap = el('div');
      var head = el('div', 'oxe-head');
      var x = btn('oxe-x', '✕', function () { renderGrid(); });
      x.setAttribute('aria-label', 'Leave exam');
      head.appendChild(x);
      var gl = el('span', 'oxe-glyph', s.glyph); gl.setAttribute('aria-hidden', 'true');
      head.appendChild(gl);
      head.appendChild(el('span', 'oxe-name', s.name));
      var count = el('span', 'oxe-lbl', (run.i + 1) + '/' + n);
      count.setAttribute('aria-live', 'polite');
      head.appendChild(count);
      var ring = null, rg = null;
      if (run.timed) {
        ring = el('canvas', 'oxe-ring');
        ring.setAttribute('role', 'img');
        ring.setAttribute('aria-label', SECONDS + ' second timer');
        rg = sizeCanvas(ring, 44);
        head.appendChild(ring);
      }
      wrap.appendChild(head);

      var prog = el('div', 'oxe-prog'); var fill = el('i'); prog.appendChild(fill);
      prog.setAttribute('role', 'progressbar');
      prog.setAttribute('aria-valuemin', '0'); prog.setAttribute('aria-valuemax', String(n));
      prog.setAttribute('aria-valuenow', String(run.i));
      wrap.appendChild(prog);

      wrap.appendChild(el('p', 'oxe-q', it.q.q));
      var opts = el('div', 'oxe-opts');
      opts.setAttribute('role', 'group');
      opts.setAttribute('aria-label', 'Answers');
      var buttons = it.opts.map(function (o, k) {
        var b = btn('oxe-opt', null, function () { answer(k); });
        b.appendChild(el('span', 'oxe-k', KEYS[k]));
        b.appendChild(el('span', null, o.text));
        opts.appendChild(b);
        return b;
      });
      wrap.appendChild(opts);
      var fb = el('div', 'oxe-fb'); fb.hidden = true; fb.setAttribute('aria-live', 'polite');
      wrap.appendChild(fb);
      var actions = el('div', 'oxe-actions');
      var next = btn('btn btn-fill oxe-btn oxe-primary', run.i + 1 < n ? 'NEXT →' : 'RESULT →', function () { advance(); });
      next.hidden = true;
      actions.appendChild(next);
      wrap.appendChild(actions);
      view(wrap);
      requestAnimationFrame(function () { fill.style.width = (run.i / n * 100) + '%'; });

      var done = false;
      function answer(k) {
        if (done) return;
        done = true; stopTimer();
        var pick = k == null ? null : it.opts[k];
        var ok = !!(pick && pick.correct);
        if (ok) run.score++;
        run.answers.push({ q: it.q, picked: pick ? pick.text : null, ok: ok });
        buttons.forEach(function (b, j) {
          b.disabled = true;
          if (it.opts[j].correct) b.classList.add('ok');
          else if (j === k) b.classList.add('no');
          else b.classList.add('dim');
        });
        fb.className = 'oxe-fb' + (ok ? '' : ' no');
        fb.textContent = '';
        fb.appendChild(el('b', null, ok ? '✓ CORRECT' : (k == null ? '✗ TIME' : '✗ WRONG')));
        fb.appendChild(document.createTextNode(it.q.why || ''));
        fb.hidden = false;
        fill.style.width = ((run.i + 1) / n * 100) + '%';
        prog.setAttribute('aria-valuenow', String(run.i + 1));
        next.hidden = false;
        try { next.focus({ preventScroll: true }); } catch (e) { next.focus(); }
      }
      run.answer = answer;
      run.canAdvance = function () { return done; };

      if (run.timed && rg) {
        var red = cssVar('--crim', '#CF6760'), cy = cssVar('--cyan', '#00E5FF');
        var t0 = performance.now(), last = -1;
        var tick = function (now) {
          var left = Math.max(0, SECONDS - (now - t0) / 1000);
          var sec = Math.ceil(left);
          if (!reduced() || sec !== last) {
            drawRing(rg, 44, left / SECONDS, left <= 10 ? red : cy, 4, String(sec), '600 13px ' + cssVar('--M', 'monospace'));
            last = sec;
          }
          if (left <= 0) { timerRaf = 0; answer(null); return; }
          timerRaf = requestAnimationFrame(tick);
        };
        timerRaf = requestAnimationFrame(tick);
      }
    }

    function advance() {
      if (!run || !run.canAdvance()) return;
      run.i++;
      if (run.i < run.items.length) renderQuestion(); else finish();
    }

    /* result */
    function finish() {
      var s = run.sector, n = run.items.length, score = run.score;
      var pct = Math.round(score / n * 100), pass = pct >= PASS_PCT;
      var best = readBest(), prev = best[s.id] || {};
      best[s.id] = {
        pct: Math.max(pct, typeof prev.pct === 'number' ? prev.pct : 0),
        score: (typeof prev.pct === 'number' && prev.pct > pct) ? prev.score : score,
        n: n,
        runs: (prev.runs | 0) + 1,
        answered: (prev.answered | 0) + n,
        at: new Date().toISOString()
      };
      writeBest(best);
      emit();

      if (pass) {
        var rec = function () {
          if (window.OmegaProgress && typeof window.OmegaProgress.record === 'function') {
            window.OmegaProgress.record({ kind: 'knowledge', task: 'exam:' + s.id, axis: 'a', title: 'Passed ' + s.name + ' exam', weight: 0.12 });
            return true;
          }
          return false;
        };
        if (!rec()) {
          ensureProgress();
          var tries = 0, iv = setInterval(function () { if (rec() || ++tries > 40) clearInterval(iv); }, 250);
        }
      }

      var wrap = el('div', 'oxe-res');
      var c = el('canvas', 'oxe-score');
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', 'Score ' + pct + ' percent, ' + score + ' of ' + n);
      var g = sizeCanvas(c, 180);
      wrap.appendChild(c);
      var v = el('div', 'oxe-verdict', pass ? 'PASSED' : 'RETRY');
      wrap.appendChild(v);
      var line = el('div', 'oxe-lbl', score + '/' + n + ' · ' + s.name + ' · best ' + best[s.id].pct + '%');
      line.setAttribute('data-oxe-score', String(score));
      line.setAttribute('data-oxe-pct', String(pct));
      wrap.appendChild(line);

      var actions = el('div', 'oxe-actions');
      actions.style.justifyContent = 'center';
      actions.appendChild(btn('btn btn-fill oxe-btn oxe-primary', 'RETRY', function () { start(s); }));
      actions.appendChild(btn('btn oxe-btn', 'OTHER SECTOR', function () { renderGrid(); }));
      wrap.appendChild(actions);

      var miss = run.answers.filter(function (a) { return !a.ok; });
      if (miss.length) {
        wrap.appendChild(el('div', 'oxe-lbl', 'Review · ' + miss.length)).style.marginTop = '22px';
        var ul = el('ul', 'oxe-review');
        miss.forEach(function (a) {
          var li = el('li');
          li.appendChild(el('div', 'oxe-rq', a.q.q));
          var ra = el('div', 'oxe-ra');
          ra.appendChild(el('span', 'no', '✗ ' + (a.picked == null ? 'No answer' : a.picked)));
          ra.appendChild(document.createTextNode('  '));
          ra.appendChild(el('span', 'ok', '✓ ' + a.q.options[a.q.answer]));
          li.appendChild(ra);
          li.appendChild(el('div', 'oxe-rw', a.q.why || ''));
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
      }
      run = null;
      view(wrap);

      var color = pass ? cssVar('--green', '#3fb27f') : cssVar('--crim', '#CF6760');
      var font = '700 40px ' + cssVar('--R', 'system-ui,sans-serif');
      if (reduced()) { drawRing(g, 180, pct / 100, color, 12, pct + '%', font); return; }
      var t0 = performance.now(), dur = 900;
      (function frame(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        drawRing(g, 180, pct / 100 * e, color, 12, Math.round(pct * e) + '%', font);
        if (k < 1 && c.isConnected) requestAnimationFrame(frame);
      })(t0);
    }

    /* keyboard: active only while this root is in the document */
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = function (e) {
      if (!root.isConnected || !run || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (root.offsetParent === null && getComputedStyle(root).position !== 'fixed') return; // hidden tab
      var k = e.key;
      var idx = '1234'.indexOf(k);
      if (idx < 0) idx = 'abcd'.indexOf(String(k).toLowerCase());
      if (idx >= 0 && k.length === 1) {
        if (!run.canAdvance() && run.answer) { e.preventDefault(); run.answer(idx); }
        return;
      }
      if (k === 'Enter' && run.canAdvance()) {
        if (t && t.tagName === 'BUTTON' && !t.classList.contains('oxe-primary')) return;
        e.preventDefault(); advance();
      }
    };
    document.addEventListener('keydown', keyHandler);

    var msg = el('div', 'oxe-msg', 'LOADING…');
    root.appendChild(msg);
    loadBank().then(function (b) { bank = b; renderGrid(); }).catch(function () {
      root.textContent = '';
      var m = el('div', 'oxe-msg', 'EXAM BANK UNAVAILABLE');
      var r = btn('btn oxe-btn', 'RETRY', function () { mount(host); });
      var a = el('div', 'oxe-actions'); a.style.justifyContent = 'center'; a.appendChild(r);
      root.appendChild(m); root.appendChild(a);
    });

    return { root: root, home: function () { if (bank) renderGrid(); } };
  }

  window.OmegaExam = { mount: mount, stats: stats, loadBank: loadBank, PASS_PCT: PASS_PCT, PER_RUN: PER_RUN };
})();
