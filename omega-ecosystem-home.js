/* ==========================================================================
   Ω SYD OMEGA 91717 — THE ECOSYSTEM HOME (omega-ecosystem-home.js)

   The owner's reference (assets/concept/reel-01.jpg, and the four-panel wall in board-03.jpg) is ONE composed surface, not a list of
   links: the twelve agents down the left, a cinematic hero with the luminous Omega, the twelve franchises as a row of posters, an
   overview of the twelve, the member's own standing, and a right rail with profile, wallet, quick access, news and the ascension.
   The dashboard's Home view opened on a clock, a weather box and three cards in a lot of empty black. This composes the reference
   there, inside the page the platform already treats as home, so nothing is a fourth page.

   EVERY NUMBER AND NAME HERE COMES FROM A REAL SOURCE, and a panel that cannot read its source says so in plain words instead of
   drawing a plausible picture (CLAUDE.md 8.1 class 9; the mock-ups' "9,171,717 Omega", an uptime curve and a revenue chart have no
   source here, so none is drawn):
     agents          omega-agents.json                 the twelve personas, their roles and pages, and their medallion art
     universe        omega-catalog.json                the twelve franchises (title, sign, god, grade) and their poster art
     overview        omega-constellation.js            the twelve signs, each a link (already loaded on this page)
     axes, honors    profiles (own row)                axis_a/b/c, trophies, medals, certificates; bars are RELATIVE to the member's highest
     profile, gates  OmegaCharacterCard + OmegaCanon   the SAME authority and gate arithmetic the character page uses, not a copy
     wallet          rpc my_sovereign_summary          the member's sovereign points, labelled as a standing and not money
     news, activity  news, activity_feed               published news and the newest feed rows, or an empty state
     ascension       omega-sculpture.js (chronos)      the tree with the member's own house enlarged; no stage is claimed (none is measured)

   Everything is built with createElement and textContent: no markup is ever assembled from data. Read-only: this module writes nothing.
   Class names are all `oeh-`, and none contains "card" (omega-visual-evolution.css restyles [class*="card"]).
   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaEcosystemHome) return;
  window.__omegaEcosystemHome = 1;

  var COLS = 'display_name,sign,axis_a,axis_b,axis_c,trophies_earned,medals_earned,certificates_earned,avatar_url';

  function el(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function note(parent, text) { if (!parent) return; clear(parent); el('div', 'oeh-note', text, parent); }
  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function shortDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return ''; }
  }
  function signArt(sign) { return '/assets/legacy/sign-' + String(sign || '').toLowerCase() + '.webp'; }

  function style() {
    if (document.getElementById('oeh-style')) return;
    var s = document.createElement('style');
    s.id = 'oeh-style';
    s.textContent =
      '.oeh{display:grid;grid-template-columns:minmax(212px,248px) minmax(0,1fr) minmax(252px,296px);gap:14px;margin:0 0 24px;align-items:start}' +
      '.oeh-col{display:flex;flex-direction:column;gap:14px;min-width:0}' +
      '.oeh-box{position:relative;border:1px solid rgba(201,168,76,.27);border-radius:10px;padding:14px 14px 16px;min-width:0;' +
        'background:linear-gradient(180deg,rgba(17,14,7,.8),rgba(5,6,10,.88));' +
        'box-shadow:inset 0 0 0 1px rgba(255,214,130,.04),0 12px 34px rgba(0,0,0,.45)}' +
      '.oeh-box::before{content:"";position:absolute;left:16px;right:16px;top:-1px;height:2px;pointer-events:none;' +
        'background:linear-gradient(90deg,transparent,rgba(226,200,109,.85),transparent)}' +
      '.oeh-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:0 0 10px;font-family:var(--D,"Cinzel Decorative",serif);' +
        'font-size:12px;letter-spacing:.2em;color:var(--solar,#E2C86D);text-transform:uppercase}' +
      '.oeh-h a{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.14em;color:var(--cyan,#00E5FF);text-decoration:none;white-space:nowrap}' +
      '.oeh-note{font-family:var(--R,Rajdhani,sans-serif);font-size:14px;line-height:1.5;color:var(--muted,#8796A1);padding:6px 2px}' +
      /* agents */
      '.oeh-agents{display:flex;flex-direction:column;gap:3px}' +
      '.oeh .oeh-agent{display:flex;align-items:center;justify-content:flex-start;gap:10px;padding:3px 8px;border:1px solid transparent;border-radius:7px;' +
        'text-decoration:none;color:var(--ink,#E9E6DC);min-height:46px;transition:border-color .15s,background .15s}' +
      '.oeh .oeh-agent:hover,.oeh .oeh-agent:focus-visible{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.07);outline:none}' +
      '.oeh-agent img{width:34px;height:34px;border-radius:50%;object-fit:cover;flex:0 0 34px;border:1px solid rgba(201,168,76,.45);background:#07070c}' +
      '.oeh-agent-t{display:flex;flex-direction:column;min-width:0;flex:1;text-align:left}' +
      '.oeh-agent-n{font-family:var(--R,Rajdhani,sans-serif);font-size:16px;font-weight:600;line-height:1.1;color:var(--ink,#E9E6DC)}' +
      '.oeh-agent-r{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.06em;color:var(--muted,#8796A1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.oeh-agent-c{color:var(--gold,#C9A84C);font-size:18px;line-height:1}' +
      /* hero */
      '.oeh-hero{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);align-items:center;gap:6px;overflow:hidden;padding:18px 8px 16px 22px;min-height:300px;' +
        'background:radial-gradient(110% 130% at 80% 42%,rgba(201,168,76,.17),rgba(201,168,76,0) 62%),linear-gradient(180deg,rgba(17,14,7,.82),rgba(5,6,10,.9))}' +
      '.oeh-eyebrow{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.26em;color:var(--cyan,#00E5FF);text-transform:uppercase}' +
      '.oeh-title{margin:8px 0 12px;font-family:var(--D,"Cinzel Decorative",serif);font-weight:900;font-size:clamp(22px,2.35vw,36px);line-height:1.06;letter-spacing:0;' +
        'color:transparent;-webkit-text-fill-color:transparent;background:linear-gradient(180deg,#FFF2C4 0%,#E2C86D 46%,#A9822C 100%);' +
        '-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 18px rgba(226,200,109,.42))}' +
      '.oeh-sub{font-family:var(--R,Rajdhani,sans-serif);font-size:17px;line-height:1.5;color:var(--ink-dim,#CBD5DC);max-width:34ch;margin:0 0 14px}' +
      '.oeh-facts{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.12em;color:var(--muted,#8796A1);margin:0 0 16px}' +
      '.oeh-btns{display:flex;flex-wrap:wrap;gap:8px}' +
      '.oeh .oeh-btns .btn{padding:9px 13px;font-size:12px;letter-spacing:.08em;white-space:nowrap}' +
      /* The platform's a[href]:not(.on):not(.nav-home):not(.nav-back):not(.skip-link) link colour weighs 5 classes, so a plain scoped rule loses and the label computes gold on gold (the contrast gate read 1:1);
         .oeh.oeh doubles this surface's weight. Hover is restated because the platform swaps to a dark fill there and a forced dark label would vanish. */
      '.oeh.oeh .oeh-btns a.btn.btn-fill[href]{color:#120d02;-webkit-text-fill-color:#120d02;font-weight:700}' +
      '.oeh.oeh .oeh-btns a.btn.btn-fill[href]:hover,.oeh.oeh .oeh-btns a.btn.btn-fill[href]:focus-visible{color:#E2C86D;-webkit-text-fill-color:#E2C86D}' +
      '.oeh-art{position:relative;min-width:0;align-self:stretch;min-height:250px}' +
      /* universe */
      '.oeh-strip{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 10px;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,.4) transparent}' +
      '.oeh .oeh-poster{position:relative;flex:0 0 clamp(210px,24vw,262px);aspect-ratio:16/9;border-radius:8px;overflow:hidden;scroll-snap-align:start;display:block;' +
        'border:1px solid rgba(201,168,76,.32);background:#07070c;text-decoration:none;transition:border-color .15s,transform .15s}' +
      '.oeh .oeh-poster:hover,.oeh .oeh-poster:focus-visible{border-color:rgba(226,200,109,.8);transform:translateY(-2px);outline:none}' +
      '.oeh-poster img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.oeh-poster-l{position:absolute;left:0;right:0;bottom:0;padding:18px 10px 7px;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.1em;' +
        'color:#F3EBD0;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.82));display:flex;justify-content:space-between;gap:8px}' +
      /* trio */
      '.oeh-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}' +
      '.oeh-wheel{display:flex;justify-content:center;align-items:center;min-height:220px}' +
      '.oeh-bars{display:flex;flex-direction:column;gap:12px;margin-top:4px}' +
      '.oeh-bar-t{display:flex;justify-content:space-between;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.1em;color:var(--muted,#8796A1);margin-bottom:4px}' +
      '.oeh-bar-t b{color:var(--ink,#E9E6DC);font-weight:700}' +
      '.oeh-track{height:8px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden}' +
      '.oeh-fill{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#8A6A22,#E2C86D);box-shadow:0 0 10px rgba(226,200,109,.5)}' +
      '.oeh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}' +
      '.oeh-stat{border:1px solid rgba(201,168,76,.2);border-radius:7px;padding:8px 6px;text-align:center}' +
      '.oeh-stat b{display:block;font-family:var(--D,"Cinzel Decorative",serif);font-size:20px;color:var(--solar,#E2C86D)}' +
      '.oeh-stat span{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.08em;color:var(--muted,#8796A1)}' +
      '.oeh-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}' +
      '.oeh-li{display:flex;gap:9px;align-items:flex-start;font-family:var(--R,Rajdhani,sans-serif);font-size:15px;line-height:1.3;color:var(--ink,#E9E6DC)}' +
      '.oeh-li i{flex:0 0 7px;height:7px;margin-top:6px;border-radius:50%;background:var(--gold,#C9A84C);box-shadow:0 0 8px rgba(226,200,109,.6)}' +
      '.oeh-li small{display:block;font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.08em;color:var(--muted,#8796A1)}' +
      /* right rail */
      '.oeh-me{display:flex;gap:12px;align-items:center}' +
      '.oeh-me img{width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid rgba(226,200,109,.7);background:#07070c;box-shadow:0 0 16px rgba(226,200,109,.3)}' +
      '.oeh-me-n{font-family:var(--D,"Cinzel Decorative",serif);font-size:16px;color:var(--solar,#E2C86D);line-height:1.2;word-break:break-word}' +
      '.oeh-me-s{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.12em;color:var(--muted,#8796A1);margin-top:3px}' +
      '.oeh-big{font-family:var(--D,"Cinzel Decorative",serif);font-size:34px;line-height:1.1;color:var(--solar,#E2C86D);text-shadow:0 0 22px rgba(226,200,109,.5)}' +
      '.oeh-cap{font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:.12em;color:var(--muted,#8796A1);margin-top:4px;line-height:1.5}' +
      '.oeh-quick{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '.oeh .oeh-q{display:flex;flex-direction:column;justify-content:center;gap:2px;min-height:62px;padding:8px 10px;border:1px solid rgba(201,168,76,.26);border-radius:8px;' +
        'text-decoration:none;color:var(--ink,#E9E6DC);background:rgba(201,168,76,.04);text-align:left;align-items:flex-start;transition:border-color .15s,background .15s}' +
      '.oeh .oeh-q:hover,.oeh .oeh-q:focus-visible{border-color:rgba(226,200,109,.75);background:rgba(201,168,76,.1);outline:none}' +
      '.oeh-q b{font-family:var(--D,"Cinzel Decorative",serif);font-size:12px;letter-spacing:.14em;color:var(--solar,#E2C86D)}' +
      '.oeh-q span{font-family:var(--R,Rajdhani,sans-serif);font-size:14px;color:var(--muted,#8796A1)}' +
      '.oeh-tree{min-height:230px;border-radius:8px;overflow:hidden;margin-bottom:8px}' +
      '@media(max-width:1180px){.oeh{grid-template-columns:minmax(0,1fr) minmax(252px,300px)}.oeh-left{grid-column:1/-1}' +
        '.oeh-agents{flex-direction:row;overflow-x:auto;gap:8px}.oeh .oeh-agent{flex:0 0 auto;min-width:176px}.oeh-trio{grid-template-columns:repeat(2,minmax(0,1fr))}}' +
      '@media(max-width:760px){.oeh{grid-template-columns:minmax(0,1fr)}.oeh-hero{grid-template-columns:minmax(0,1fr);padding:20px 16px 8px}.oeh-art{min-height:210px}' +
        '.oeh-trio{grid-template-columns:minmax(0,1fr)}.oeh-big{font-size:30px}}';
    document.head.appendChild(s);
  }

  /* ── panels that need no member ───────────────────────────────────────── */
  function renderAgents(root, agents) {
    clear(root);
    var list = el('div', 'oeh-agents', null, root);
    agents.forEach(function (a) {
      var row = el('a', 'oeh-agent', null, list);
      row.href = a.href || '/agents.html';
      var img = el('img', null, null, row);
      img.src = signArt(a.sign); img.alt = ''; img.width = 34; img.height = 34; img.loading = 'lazy'; img.decoding = 'async';
      var t = el('span', 'oeh-agent-t', null, row);
      el('span', 'oeh-agent-n', a.name, t);
      el('span', 'oeh-agent-r', a.role || '', t);
      el('span', 'oeh-agent-c', '›', row);
    });
  }

  function renderUniverse(root, catalog) {
    clear(root);
    var strip = el('div', 'oeh-strip', null, root);
    (catalog.movies || []).forEach(function (m) {
      var a = el('a', 'oeh-poster', null, strip);
      a.href = '/movies.html';
      a.setAttribute('aria-label', m.title + ', franchise ' + m.n + ': ' + m.sign + ', ' + m.god);
      var img = el('img', null, null, a);
      img.src = '/assets/movies/franchise-' + pad2(m.n) + '-640.webp'; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      var l = el('span', 'oeh-poster-l', null, a);
      el('span', null, m.sign + ' · ' + m.god, l);
      el('span', null, m.requires && m.requires.grade ? 'GRADE ' + m.requires.grade : '', l);
    });
  }

  function renderQuick(root, agentsN, catalog) {
    clear(root);
    var t = (catalog && catalog.totals) || {};
    [['AGENTS', agentsN ? agentsN + ' personas' : 'the twelve', '/agents.html'],
     ['CINEMA', t.movies ? t.movies + ' franchises' : 'the franchises', '/movies.html'],
     ['GAMES', t.games ? t.games + ' games' : 'the games', '/gaming.html'],
     ['CHARACTER', 'your tree and house', '/character.html']].forEach(function (q) {
      var a = el('a', 'oeh-q', null, root);
      a.href = q[2];
      el('b', null, q[0], a);
      el('span', null, q[1], a);
    });
  }

  /* ── panels that read the member ──────────────────────────────────────── */
  function renderProfile(root, p, auth, gates) {
    clear(root);
    var me = el('div', 'oeh-me', null, root);
    var img = el('img', null, null, me);
    var av = null;
    try { var u = new URL(String(p.avatar_url || '')); if (u.protocol === 'https:') av = u.href; } catch (e) { av = null; }
    img.src = av || signArt(p.sign); img.alt = ''; img.width = 58; img.height = 58;
    if (av) img.referrerPolicy = 'no-referrer';
    var t = el('div', null, null, me);
    el('div', 'oeh-me-n', p.display_name || 'Member', t);
    var bits = [];
    if (p.sign) bits.push(String(p.sign).toUpperCase());
    if (auth !== null && auth !== undefined) bits.push('AUTH ' + Number(auth).toFixed(2));
    el('div', 'oeh-me-s', bits.join(' · ') || 'SET YOUR SIGN', t);
    if (gates) el('div', 'oeh-me-s', gates.passed + ' OF ' + gates.total + ' GATES', t);
  }

  function num(v) { var n = Number(v); return isFinite(n) ? n : null; }

  function renderAxes(root, p) {
    clear(root);
    var axes = [['KNOWLEDGE', num(p.axis_a)], ['MASTERY', num(p.axis_b)], ['CONTRIBUTION', num(p.axis_c)]];
    var known = axes.filter(function (a) { return a[1] !== null; });
    if (!known.length) { note(root, 'No axes are recorded for you yet.'); return; }
    var top = Math.max.apply(null, known.map(function (a) { return a[1]; }));
    var bars = el('div', 'oeh-bars', null, root);
    axes.forEach(function (a) {
      var row = el('div', null, null, bars);
      var t = el('div', 'oeh-bar-t', null, row);
      el('span', null, a[0], t);
      el('b', null, a[1] === null ? '—' : String(a[1]), t);
      var track = el('div', 'oeh-track', null, row);
      var fill = el('span', 'oeh-fill', null, track);
      fill.style.width = (a[1] === null || top <= 0 ? 0 : Math.max(2, Math.round(a[1] / top * 100))) + '%';
    });
    el('div', 'oeh-cap', 'Bars are relative to your highest axis.', root);
  }

  function renderHonors(root, p) {
    var host = root.querySelector('[data-oeh-honors]');
    if (!host) return;
    clear(host);
    [['TROPHIES', p.trophies_earned], ['MEDALS', p.medals_earned], ['CERTIFICATES', p.certificates_earned]].forEach(function (h) {
      var s = el('div', 'oeh-stat', null, host);
      var v = num(h[1]);
      el('b', null, v === null ? '—' : String(v), s);
      el('span', null, h[0], s);
    });
  }

  function renderWallet(root, res) {
    clear(root);
    if (res.error) { note(root, 'Your points could not be read right now.'); return; }
    var d = res.data;
    var pts = d && !Array.isArray(d) && d.ok !== false ? num(d.points) : null;
    if (pts === null) { note(root, 'No points are recorded for you yet.'); return; }
    el('div', 'oeh-big', pts.toLocaleString(), root);
    el('div', 'oeh-cap', 'SOVEREIGN POINTS', root);
    el('div', 'oeh-cap', 'A standing in the platform, not money.', root);
  }

  function renderNews(root, res) {
    clear(root);
    if (res.error) { note(root, 'News could not be read right now.'); return; }
    var rows = res.data || [];
    if (!rows.length) { note(root, 'No news has been published yet.'); return; }
    var ul = el('ul', 'oeh-list', null, root);
    rows.forEach(function (n) {
      var li = el('li', 'oeh-li', null, ul);
      el('i', null, null, li);
      var d = el('div', null, null, li);
      el('span', null, n.title, d);
      el('small', null, [n.category ? String(n.category).toUpperCase() : '', shortDate(n.created_at)].filter(Boolean).join(' · '), d);
    });
  }

  function renderActivity(root, res) {
    clear(root);
    if (res.error) { note(root, 'Activity could not be read right now.'); return; }
    var rows = res.data || [];
    if (!rows.length) { note(root, 'Nothing has happened yet. Your first task will appear here.'); return; }
    var ul = el('ul', 'oeh-list', null, root);
    rows.forEach(function (r) {
      var li = el('li', 'oeh-li', null, ul);
      el('i', null, null, li);
      var d = el('div', null, null, li);
      el('span', null, r.title || r.activity_type || 'Activity', d);
      el('small', null, shortDate(r.created_at), d);
    });
  }

  function renderAscension(root, p, gates) {
    var tree = document.querySelector('[data-omega-sculpture="chronos"][data-oeh-tree]');
    if (tree && p.sign) tree.setAttribute('data-sculpt-sign', p.sign);
    var cap = root;
    clear(cap);
    el('div', 'oeh-cap', gates ? gates.passed + ' OF ' + gates.total + ' GATES PASSED' : 'GATES UNKNOWN: AUTHORITY NEEDS ALL THREE AXES', cap);
    el('div', 'oeh-cap', 'No stage progress is measured for you yet, so none is drawn.', cap);
  }

  /* ── boot ─────────────────────────────────────────────────────────────── */
  function wait(test, tries) {
    return new Promise(function (resolve) {
      var n = 0;
      (function tick() { if (test() || n++ >= tries) return resolve(test()); setTimeout(tick, 150); })();
    });
  }

  async function boot() {
    var root = document.querySelector('[data-omega-ecosystem-home]');
    if (!root) return;
    style();
    var q = function (k) { return root.querySelector('[data-oeh="' + k + '"]'); };

    var agents = null, catalog = null;
    var agentsP = getJSON('/omega-agents.json').then(function (j) { agents = j.agents || j; renderAgents(q('agents'), agents); })
      .catch(function () { note(q('agents'), 'The agent roster could not be read.'); });
    var catP = getJSON('/omega-catalog.json').then(function (j) { catalog = j; renderUniverse(q('universe'), j); })
      .catch(function () { note(q('universe'), 'The franchises could not be read.'); });
    await Promise.all([agentsP, catP]);
    renderQuick(q('quick'), agents && agents.length, catalog);
    var t = (catalog && catalog.totals) || {};
    var facts = [];
    if (t.movies) facts.push(t.movies + ' FRANCHISES');
    if (t.series) facts.push(t.series + ' SERIES');
    if (t.games) facts.push(t.games + ' GAMES');
    if (agents && agents.length) facts.push(agents.length + ' AGENTS');
    if (q('facts')) q('facts').textContent = facts.join(' · ');

    var memberPanels = ['profile', 'axes', 'wallet', 'news', 'activity', 'ascension'];
    var say = function (m) { memberPanels.forEach(function (k) { note(q(k), m); }); };

    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    if (!sb) { say('No data connection, so your own panels cannot be shown.'); return; }
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    if (!s || !s.user) { say('Sign in to see your own panels.'); return; }

    var reads = await Promise.all([
      sb.from('profiles').select(COLS).eq('id', s.user.id).maybeSingle(),
      sb.rpc('my_sovereign_summary'),
      sb.from('news').select('id,title,category,created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(4),
      sb.from('activity_feed').select('id,activity_type,title,created_at').eq('user_id', s.user.id).order('created_at', { ascending: false }).limit(5)
    ]);
    var prof = reads[0];
    renderWallet(q('wallet'), reads[1]);
    renderNews(q('news'), reads[2]);
    renderActivity(q('activity'), reads[3]);
    if (prof.error || !prof.data) {
      ['profile', 'axes', 'ascension'].forEach(function (k) { note(q(k), 'Your profile could not be read right now.'); });
      return;
    }
    var p = prof.data;

    await wait(function () { return window.OmegaCanon && window.OmegaCanon.ready; }, 25);
    await wait(function () { return window.OmegaCharacterCard && window.OmegaCharacterCard.gatesPassed; }, 25);
    var auth = null, gates = null, C = window.OmegaCharacterCard, canon = window.OmegaCanon;
    try {
      if (C && canon && canon.ready) { auth = C.authorityOf(p, canon); gates = auth === null || auth === undefined ? null : C.gatesPassed(auth, canon); }
    } catch (e) { auth = null; gates = null; }
    renderProfile(q('profile'), p, auth, gates);
    renderAxes(q('axes'), p);
    renderHonors(root, p);
    renderAscension(q('ascension'), p, gates);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
