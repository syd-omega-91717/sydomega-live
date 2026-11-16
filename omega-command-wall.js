/* ==========================================================================
   Ω SYD OMEGA 91717 — COMMAND WALL (omega-command-wall.js)

   The four-panel wall at the top of the dashboard's PLATFORM tab, after the owner's reference board
   (assets/concept/board-03.jpg). It is a wall of what is TRUE, so it is deliberately not a copy of the board.

   WHAT THE BOARD DRAWS THAT THIS DOES NOT, AND WHY (CLAUDE.md 8.1 class 9, fabricated data rendered as fact):
     - a world map of server nodes, "ports 4000-4018", "G7 servers", "PPO RL agents", "multi-agent consensus 100%",
       "network resonance 9.17Hz", "Node 812 malware purge <10ms": none of these exists. The twelve agents are a naming system
       for domains, not a running multi-agent network (CLAUDE.md 6), so no consensus or latency is drawn for them.
     - a "9-stage" ladder (SAND ... OMEGA_MASTER): rejected in docs/IDEA_INTAKE.md, it conflicts with the 12 canon gates.
     - "revenue fortress", buying physical gold: money. Payments and tokens ship dormant (CLAUDE.md 9).
     - an "owner's absolute terminal, override active": no such state exists, and owner-only status does not belong on a member surface.

   WHAT EACH PANEL READS (one real source each; a source that fails says so in the panel, it is never filled in):
     FOUNDATION   the page's own backend-read counters, window.__omegaData, kept by bg.js's fetch recorder, plus the architecture
                  the repo actually has (static pages -> Supabase auth, Postgres with RLS, edge functions, storage).
     AGENTS       omega-agents.json: the twelve personas, one ring, the same sign medallion art the agent list uses.
     ASCENSION    omega-canon.json authority.gate_names (the twelve real gates) and the member's own authority, from
                  OmegaCharacterCard.authorityOf, with certificates_earned from their own profiles row.
     LIVE/DORMANT public.get_platform_flag for six named flags. It FAILS CLOSED: only a confirmed true reads ACTIVE; an error or no
                  answer reads UNKNOWN, never ACTIVE.

   Text only via textContent; no markup is built from data.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaCommandWall) return;
  window.__omegaCommandWall = 1;

  /* Shown by their literal platform_settings key, as omega-flags.js's own dormancy notice does. The panel reports the state of a setting; it does not
     describe, name or promise what the feature would pay, which is also what scripts/commerce-contract.py requires of any copy that mentions earnings. */
  var FLAGS = ['payments_enabled', 'tokens_enabled', 'ad_network_enabled', 'creator_earnings_enabled', 'courses_enabled', 'mfa_enrolment_enabled'];

  function el(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function note(parent, text) { if (!parent) return; clear(parent); el('div', 'ocw-note', text, parent); }
  function getJSON(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }); }
  function signArt(sign) { return '/assets/legacy/sign-' + String(sign || '').toLowerCase() + '.webp'; }
  function wait(test, tries) {
    return new Promise(function (resolve) {
      var n = 0;
      (function tick() { if (test() || ++n > tries) return resolve(); setTimeout(tick, 120); })();
    });
  }

  function style() {
    if (document.getElementById('ocw-style')) return;
    var s = document.createElement('style');
    s.id = 'ocw-style';
    s.textContent =
      '.ocw{margin:0 0 26px}' +
      '.ocw-title{margin:0 0 4px;font-family:var(--D,"Cinzel Decorative",serif);font-size:20px;letter-spacing:.14em;color:var(--solar,#E2C86D);text-transform:uppercase}' +
      '.ocw-sub{margin:0 0 14px;font-family:var(--R,Rajdhani,sans-serif);font-size:15px;line-height:1.45;color:var(--muted,#8796A1);max-width:78ch}' +
      '.ocw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
      '.ocw-box{position:relative;min-width:0;border:1px solid rgba(201,168,76,.27);border-radius:10px;padding:14px 16px 14px;' +
        'background:linear-gradient(180deg,rgba(17,14,7,.8),rgba(5,6,10,.9));box-shadow:inset 0 0 0 1px rgba(255,214,130,.04),0 12px 34px rgba(0,0,0,.4)}' +
      '.ocw-box::before{content:"";position:absolute;left:16px;right:16px;top:-1px;height:2px;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(226,200,109,.85),transparent)}' +
      '.ocw-h{margin:0 0 10px;font-family:var(--D,"Cinzel Decorative",serif);font-size:13px;letter-spacing:.16em;color:var(--solar,#E2C86D);text-transform:uppercase}' +
      '.ocw-note{font-family:var(--R,Rajdhani,sans-serif);font-size:14px;line-height:1.5;color:var(--muted,#8796A1);padding:4px 2px}' +
      '.ocw-cap{margin:10px 0 0;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.06em;line-height:1.5;color:var(--muted,#8796A1)}' +
      /* foundation */
      '.ocw-flow{display:flex;flex-wrap:wrap;align-items:stretch;gap:8px}' +
      '.ocw-node{flex:1 1 120px;min-width:0;border:1px solid rgba(201,168,76,.3);border-radius:8px;padding:8px 10px;background:rgba(201,168,76,.05)}' +
      '.ocw-node b{display:block;font-family:var(--D,"Cinzel Decorative",serif);font-size:12px;letter-spacing:.1em;color:var(--solar,#E2C86D)}' +
      '.ocw-node span{display:block;margin-top:2px;font-family:var(--R,Rajdhani,sans-serif);font-size:14px;line-height:1.35;color:var(--ink,#E9E6DC)}' +
      '.ocw-arrow{align-self:center;color:var(--gold,#C9A84C);font-size:18px}' +
      '.ocw-feeds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}' +
      '.ocw-feed{border:1px solid rgba(201,168,76,.22);border-radius:8px;padding:8px 10px;text-align:left}' +
      '.ocw-feed b{display:block;font-family:var(--D,"Cinzel Decorative",serif);font-size:22px;line-height:1.1;color:var(--solar,#E2C86D)}' +
      '.ocw-feed span{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.1em;color:var(--muted,#8796A1)}' +
      /* agents */
      '.ocw-ring{position:relative;width:min(100%,260px);aspect-ratio:1;margin:0 auto}' +
      '.ocw-ring svg{position:absolute;inset:0;width:100%;height:100%}' +
      '.ocw-ring-c{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--D,"Cinzel Decorative",serif);font-size:40px;color:var(--solar,#E2C86D);text-shadow:0 0 22px rgba(226,200,109,.55)}' +
      '.ocw .ocw-ring-n{position:absolute;display:block;width:44px;height:44px;margin:-22px 0 0 -22px;padding:5px;box-sizing:border-box;border-radius:50%;transition:transform .15s}' +
      '.ocw .ocw-ring-n:hover,.ocw .ocw-ring-n:focus-visible{transform:scale(1.18);outline:none}' +
      '.ocw-ring-n img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;border:1px solid rgba(201,168,76,.5);background:#07070c}' +
      /* ascension */
      '.ocw-ladder{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 10px}' +
      '.ocw-gate{display:flex;align-items:center;gap:8px;min-height:26px;padding:3px 8px;border:1px solid rgba(255,255,255,.1);border-radius:6px;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.1em;color:var(--muted,#8796A1)}' +
      '.ocw-gate i{flex:0 0 8px;height:8px;border-radius:50%;background:rgba(255,255,255,.18)}' +
      '.ocw-gate.on{border-color:rgba(226,200,109,.55);color:var(--ink,#E9E6DC);background:rgba(201,168,76,.09)}' +
      '.ocw-gate.on i{background:var(--solar,#E2C86D);box-shadow:0 0 8px rgba(226,200,109,.7)}' +
      '.ocw-row{display:flex;justify-content:space-between;gap:10px;margin-top:10px;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.1em;color:var(--muted,#8796A1)}' +
      '.ocw-row b{color:var(--solar,#E2C86D);font-family:var(--D,"Cinzel Decorative",serif);font-size:16px}' +
      '.ocw .ocw-link{display:inline-flex;margin-top:10px;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.14em;color:var(--cyan,#00E5FF);text-decoration:none}' +
      /* flags */
      '.ocw-flags{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}' +
      '.ocw-flag{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 10px;border:1px solid rgba(255,255,255,.1);border-radius:6px;font-family:var(--R,Rajdhani,sans-serif);font-size:15px;color:var(--ink,#E9E6DC)}' +
      '.ocw-flag-k{font-family:var(--M,"Courier Prime",monospace);font-size:13px;letter-spacing:.04em;overflow-wrap:anywhere}' +
      '.ocw-flag code{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.12em;font-weight:700}' +
      '.ocw-flag.on code{color:#58D68D}.ocw-flag.off code{color:var(--gold,#C9A84C)}.ocw-flag.unk code{color:var(--muted,#8796A1)}' +
      '@media(max-width:900px){.ocw-grid{grid-template-columns:minmax(0,1fr)}}' +
      '@media(max-width:480px){.ocw-ladder{grid-template-columns:minmax(0,1fr)}.ocw-feeds{grid-template-columns:minmax(0,1fr)}}';
    document.head.appendChild(s);
  }

  /* FOUNDATION: the architecture this repo really has, and this page's own backend-read counters (window.__omegaData). */
  function renderFoundation(root) {
    clear(root);
    var flow = el('div', 'ocw-flow', null, root);
    var parts = [['Static pages', 'No build step; served as they are'], ['Supabase', 'Auth, Postgres with row security, edge functions, storage']];
    parts.forEach(function (p, i) {
      if (i) el('span', 'ocw-arrow', '→', flow);
      var n = el('div', 'ocw-node', null, flow);
      el('b', null, p[0], n);
      el('span', null, p[1], n);
    });
    var feeds = el('div', 'ocw-feeds', null, root);
    var cells = {};
    [['ok', 'ANSWERED'], ['failed', 'FAILED'], ['inflight', 'IN FLIGHT']].forEach(function (k) {
      var f = el('div', 'ocw-feed', null, feeds);
      cells[k[0]] = el('b', null, '—', f);
      el('span', null, k[1], f);
    });
    el('p', 'ocw-cap', 'Backend reads made by this page so far, counted by the page itself. A 4xx is an answer, not a failure.', root);
    function paint() {
      var W = window.__omegaData;
      ['ok', 'failed', 'inflight'].forEach(function (k) { cells[k].textContent = W && typeof W[k] === 'number' ? String(W[k]) : '—'; });
    }
    paint();
    document.addEventListener('omega:fetch-settled', paint);
  }

  /* AGENTS: the twelve personas on a ring, joined by hairlines. Decorative lines carry no measurement. */
  function renderAgents(root, agents) {
    clear(root);
    var ring = el('div', 'ocw-ring', null, root);
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    var n = agents.length, pts = agents.map(function (a, i) {
      var ang = (i / n) * 2 * Math.PI - Math.PI / 2;
      return [50 + 40 * Math.cos(ang), 50 + 40 * Math.sin(ang)];
    });
    pts.forEach(function (p, i) {
      [3, 4].forEach(function (d) {
        var q = pts[(i + d) % n], line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', p[0]); line.setAttribute('y1', p[1]); line.setAttribute('x2', q[0]); line.setAttribute('y2', q[1]);
        line.setAttribute('stroke', 'rgba(201,168,76,.22)'); line.setAttribute('stroke-width', '.3');
        svg.appendChild(line);
      });
    });
    ring.appendChild(svg);
    el('span', 'ocw-ring-c', 'Ω', ring);
    agents.forEach(function (a, i) {
      var node = el('a', 'ocw-ring-n', null, ring);
      node.href = a.href || '/agents.html';
      node.setAttribute('aria-label', a.name + ', ' + (a.role || a.sign));
      node.style.left = (Math.round(pts[i][0] * 100) / 100) + '%';
      node.style.top = (Math.round(pts[i][1] * 100) / 100) + '%';
      var img = el('img', null, null, node);
      img.src = signArt(a.sign); img.alt = ''; img.width = 34; img.height = 34; img.loading = 'lazy'; img.decoding = 'async';
    });
    el('p', 'ocw-cap', 'Twelve personas, each the name of a domain. A naming system, not a running network.', root);
  }

  /* ASCENSION: the twelve real gates; a gate is lit only if the member's own authority reaches it. */
  function renderAscension(root, canon, prof, C) {
    clear(root);
    var names = canon && canon.authority && canon.authority.gate_names;
    if (!names || !names.length) { note(root, 'The gates could not be read.'); return; }
    var passed = null;
    try {
      if (prof && !prof.error && prof.data && C && C.authorityOf && C.gatesPassed) {
        var auth = C.authorityOf(prof.data, canon);
        var g = auth === null || auth === undefined ? null : C.gatesPassed(auth, canon);
        passed = g ? g.passed : null;
      }
    } catch (e) { passed = null; }
    var ul = el('ul', 'ocw-ladder', null, root);
    names.forEach(function (name, i) {
      var li = el('li', 'ocw-gate' + (passed !== null && i < passed ? ' on' : ''), null, ul);
      el('i', null, null, li);
      el('span', null, name, li);
    });
    var row = el('div', 'ocw-row', null, root);
    el('span', null, passed === null ? 'Your gates could not be read right now.' : passed + ' OF ' + names.length + ' GATES PASSED', row);
    if (prof && !prof.error && prof.data && typeof prof.data.certificates_earned === 'number') {
      var c = el('span', null, 'CERTIFICATES ', row);
      el('b', null, String(prof.data.certificates_earned), c);
    }
    var a = el('a', 'ocw-link', 'OPEN MY PASSPORT →', root);
    a.href = '/passport.html';
  }

  /* LIVE AND DORMANT: fails closed. Only a confirmed true is ACTIVE; an error or no answer is UNKNOWN. */
  function renderFlags(root, sb) {
    clear(root);
    var ul = el('ul', 'ocw-flags', null, root);
    var rows = FLAGS.map(function (f) {
      var li = el('li', 'ocw-flag unk', null, ul);
      el('span', 'ocw-flag-k', f, li);
      var code = el('code', null, '[UNKNOWN]', li);
      return { key: f, li: li, code: code };
    });
    rows.forEach(function (r) {
      sb.rpc('get_platform_flag', { p_key: r.key }).then(function (res) {
        var on = res && !res.error && res.data === true, off = res && !res.error && res.data === false;
        r.li.className = 'ocw-flag ' + (on ? 'on' : off ? 'off' : 'unk');
        r.code.textContent = on ? '[ACTIVE]' : off ? '[DORMANT]' : '[UNKNOWN]';
      }, function () { /* stays UNKNOWN: a flag that cannot be read is never shown as on */ });
    });
    el('p', 'ocw-cap', 'Read from the platform settings. Anything not confirmed on shows as not active.', root);
  }

  async function boot() {
    var root = document.querySelector('[data-omega-command-wall]');
    if (!root) return;
    style();
    var q = function (k) { return root.querySelector('[data-ocw="' + k + '"]'); };
    renderFoundation(q('foundation'));

    var agentsP = fetch('/omega-agents.json').then(function (r) { if (!r.ok) throw new Error('agents'); return r.json(); })
      .then(function (j) { renderAgents(q('agents'), j.agents || j); })
      .catch(function () { note(q('agents'), 'The agent roster could not be read.'); });
    var canon = null;
    var canonP = getJSON('/omega-canon.json').then(function (j) { canon = j; }).catch(function () { canon = null; });

    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    if (!sb || !sb.auth) { note(q('ascension'), 'Sign in to see your gates.'); note(q('flags'), 'Sign in to see what is on.'); await agentsP; return; }
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    if (!s || !s.user) { note(q('ascension'), 'Sign in to see your gates.'); note(q('flags'), 'Sign in to see what is on.'); await agentsP; return; }

    renderFlags(q('flags'), sb);
    var prof = await sb.from('profiles').select('sign,axis_a,axis_b,axis_c,certificates_earned').eq('id', s.user.id).maybeSingle();
    await canonP;
    await wait(function () { return window.OmegaCharacterCard && window.OmegaCharacterCard.authorityOf; }, 25);
    renderAscension(q('ascension'), canon, prof, window.OmegaCharacterCard);
    await agentsP;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
