/* Ω STUDIO LIBRARY page logic (studio-library.html). The library arrives only from the owner-only studio-library function;
   it is not a static file. Every status shown is the payload's own status; this file decides nothing about canon and has no
   control that could mark a work released, streaming or playable. Plain DOM only: text is set with textContent and nothing is parsed as HTML. */
(function () {
  'use strict';
  var TABS = [['films', 'FILMS'], ['series', 'SERIES'], ['games', 'GAMES'], ['characters', 'CHARACTERS'], ['screen', 'SCREENING ROOM'], ['status', 'WHAT REMAINS']];
  var L = null, state = { tab: 'films', fr: 'ALL', back: null };
  var LABEL = { CONCEPT: 'CONCEPT', SCREENPLAY_DRAFT: 'SCREENPLAY DRAFT', SCRIPT_DRAFT_SHORT: 'SHORT DRAFT', SCRIPTS_DRAFT: 'SCRIPTS IN DRAFT', BIBLE_DRAFT: 'BIBLE DRAFT', DESIGNED: 'DESIGNED', PROTOTYPE: 'PROTOTYPE', FOUNDER_APPROVED: 'FOUNDER APPROVED', REPO_CANON: 'REPO CANON', MERGED_DRAFT: 'MERGED DRAFT', RECONCILED_PROPOSED: 'RECONCILED', PROPOSED: 'PROPOSED' };

  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    for (k in (attrs || {})) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function badge(st) { return h('span', { 'class': 'sl-badge sl-s-' + st, text: LABEL[st] || st }); }
  function $(id) { return document.getElementById(id); }
  function frs() { return L.franchises.filter(function (f) { return state.fr === 'ALL' || f.id === state.fr; }); }

  /* ---- reader: fountain screenplays and teleplays, markdown design documents */
  var SCENE = /^(INT\.|EXT\.|INT\/EXT|I\/E)/;
  function isCue(line) { return line.length > 0 && line.length <= 42 && line === line.toUpperCase() && /[A-Z]/.test(line) && !SCENE.test(line) && !/^(ACT |TAG|FADE|CUT |SMASH|SUPER|INSERT|MAIN TITLES|CLOSING|THE END)/.test(line); }
  function renderFountain(text) {
    var out = h('div', { 'class': 'sl-body', 'data-no-clamp': '' }), lines = text.split('\n'), i = 0, head = true, prevBlank = true, inDia = false;
    while (i < lines.length) {
      var raw = lines[i], line = raw.replace(/\s+$/, '');
      if (head) {
        if (/^[A-Za-z ]+:/.test(line)) { out.appendChild(h('p', { 'class': /^Notes:/.test(line) ? 'sl-note' : 'sl-title', text: line })); i++; continue; }
        if (line === '') { head = false; i++; continue; }
        head = false;
      }
      if (line === '') { inDia = false; prevBlank = true; i++; continue; }
      var cls = null;
      if (SCENE.test(line)) cls = 'sl-scene';
      else if (/^(ACT (ONE|TWO|THREE)|TAG)$/.test(line)) cls = 'sl-act';
      else if (/(TO:|TO BLACK\.|FADE IN:|FADE OUT\.)$/.test(line) && line === line.toUpperCase()) cls = 'sl-trans';
      else if (inDia && /^\(/.test(line)) cls = 'sl-par';
      else if (inDia) cls = 'sl-dia';
      else if (prevBlank && isCue(line.replace(/\s*\(.*\)$/, '')) && i + 1 < lines.length && lines[i + 1].trim() !== '') { cls = 'sl-cue'; inDia = true; }
      out.appendChild(h('p', cls ? { 'class': cls, text: line } : { text: line }));
      prevBlank = false; i++;
    }
    return out;
  }
  function renderMarkdown(text) {
    var out = h('div', { 'class': 'sl-body sl-md', 'data-no-clamp': '' }), buf = [];
    function flush() { if (buf.length) { out.appendChild(h('pre', { text: buf.join('\n') })); buf = []; } }
    text.split('\n').forEach(function (line) {
      var m = /^(#{1,3})\s+(.*)$/.exec(line);
      if (m) { flush(); out.appendChild(h('h3', { text: m[2] })); }
      else if (line.trim() === '') flush();
      else buf.push(line);
    });
    flush();
    return out;
  }
  function openDoc(id) {
    var d = L.documents[id], box = $('sl-reader');
    if (!d) return;
    state.back = document.activeElement;
    box.textContent = '';
    var back = h('button', { type: 'button', 'class': 'sl-btn', text: 'BACK' });
    back.addEventListener('click', closeDoc);
    var title = h('h2', { text: d.title, tabindex: '-1', id: 'sl-reader-h' });
    box.appendChild(back); box.appendChild(title);
    box.appendChild(h('div', { 'class': 'sl-row' }, [badge(d.status)]));
    box.appendChild(d.kind === 'design' ? renderMarkdown(d.text) : renderFountain(d.text));
    $('sl-list').hidden = true; box.hidden = false; title.focus(); window.scrollTo(0, 0);
  }
  function closeDoc() {
    $('sl-reader').hidden = true; $('sl-list').hidden = false;
    if (state.back && state.back.focus && document.contains(state.back)) state.back.focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('sl-reader').hidden) closeDoc(); });

  /* ---- lists */
  function readBtn(id, label) { var b = h('button', { type: 'button', 'class': 'sl-btn', text: label }); b.addEventListener('click', function () { openDoc(id); }); return b; }
  function franchiseBlock(f, cards) { return h('div', {}, [h('h2', { 'class': 'sl-fr', text: f.title }), h('div', { 'class': 'sl-grid' }, cards)]); }

  function viewFilms() {
    var box = h('div', {});
    frs().forEach(function (f) {
      box.appendChild(franchiseBlock(f, f.films.map(function (fm) {
        return h('div', { 'class': 'sl-card' }, [badge(fm.status), h('div', { 'class': 'sl-name', text: fm.title }),
          h('div', { 'class': 'sl-row' }, fm.docs.map(function (id) { return readBtn(id, 'READ'); }))]);
      })));
    });
    return box;
  }
  function viewSeries() {
    var box = h('div', {});
    frs().forEach(function (f) {
      var s = f.series, size = s.seasons ? s.seasons + ' × ' + s.episodesPerSeason : 'NOT SIZED';
      var kids = [badge(s.status), h('div', { 'class': 'sl-name', text: s.title }), h('p', { 'class': 'sl-meta', text: size })];
      kids.push(h('div', { 'class': 'sl-row' }, s.docs.map(function (id) { return readBtn(id, L.documents[id].title.slice(0, 3)); })));
      box.appendChild(franchiseBlock(f, [h('div', { 'class': 'sl-card' }, kids)]));
    });
    return box;
  }
  function viewGames() {
    var box = h('div', {});
    frs().forEach(function (f) {
      var g = f.game, row = [];
      if (g.doc) row.push(readBtn(g.doc, 'DESIGN'));
      if (g.prototype) row.push(h('a', { 'class': 'sl-btn', href: g.prototype, text: 'OPEN PROTOTYPE' }));
      (g.companions || []).forEach(function (c) { row.push(h('a', { 'class': 'sl-btn', href: c.prototype, text: 'OPEN ' + c.title.toUpperCase() })); });
      box.appendChild(franchiseBlock(f, [h('div', { 'class': 'sl-card' }, [badge(g.status), h('div', { 'class': 'sl-name', text: g.title }),
        h('p', { 'class': 'sl-meta', text: 'MULTIPLAYER ' + g.multiplayer }), h('div', { 'class': 'sl-row' }, row)])]));
    });
    return box;
  }
  /* ---- the Screening Room: a procedural animatic of each series' cold open. Not footage; the words are the episode script's own. */
  var scr = { id: null, T: 0, playing: false, sound: false, raf: 0, last: 0, score: null };
  function stopScreen() { if (scr.raf) { cancelAnimationFrame(scr.raf); scr.raf = 0; } scr.playing = false; if (scr.score) { scr.score.stop(); scr.score = null; } }
  function viewScreen() {
    var A = window.OmegaAnimatic, box = h('div', { 'class': 'sl-screen' });
    if (!A) { box.appendChild(h('p', { 'class': 'sl-err', role: 'alert', text: 'The screening engine did not load.' })); return box; }
    var plans = {}, ids = [];
    A.ORDER.forEach(function (id) {
      var f = L.franchises.filter(function (x) { return x.id === id; })[0], d = L.documents['episode:' + id + ':101'];
      if (f) { plans[id] = A.plan({ id: id, title: f.title, premise: f.premise, series: f.series }, d && d.text); ids.push(id); }
    });
    if (!scr.id || !plans[scr.id]) { scr.id = ids[0]; scr.T = A.TITLE_AT + 2.5; }
    var picker = h('div', { 'class': 'sl-row', role: 'group', 'aria-label': 'Choose a franchise' });
    ids.forEach(function (id) {
      var b = h('button', { type: 'button', 'class': 'sl-chip', 'aria-pressed': scr.id === id ? 'true' : 'false', text: plans[id].title });
      b.addEventListener('click', function () { stopScreen(); scr.id = id; scr.T = A.TITLE_AT + 2.5; render(); }); picker.appendChild(b);
    });
    box.appendChild(picker);
    var canvas = h('canvas', { role: 'img', 'aria-label': 'Animatic of ' + plans[scr.id].title + ': a procedural moving storyboard of the first episode\'s cold open, with its spoken lines shown as captions below.' });
    var cap = h('p', { 'class': 'sl-cap', 'aria-live': 'polite', 'data-no-clamp': '' }), time = h('span', { 'class': 'sl-time', text: '' });
    var play = h('button', { type: 'button', 'class': 'sl-btn', text: 'PLAY' }), restart = h('button', { type: 'button', 'class': 'sl-btn', text: 'RESTART' });
    var snd = h('button', { type: 'button', 'class': 'sl-btn', 'aria-pressed': scr.sound ? 'true' : 'false', text: scr.sound ? 'SOUND ON' : 'SOUND OFF' });
    var scrub = h('input', { type: 'range', 'class': 'sl-scrub', min: '0', max: String(Math.round(A.DURATION * 10)), step: '1', value: String(Math.round(scr.T * 10)), 'aria-label': 'Position in the animatic' });
    if (!new A.Score(plans[scr.id]).available()) { snd.disabled = true; snd.textContent = 'NO AUDIO'; }
    box.appendChild(canvas); box.appendChild(h('div', { 'class': 'sl-ctl' }, [play, restart, snd, scrub, time])); box.appendChild(cap);
    var p = plans[scr.id], ctx = canvas.getContext('2d'), W = 0, H = 0;
    function size() { var w = Math.max(280, Math.min(960, box.clientWidth || canvas.parentNode && canvas.parentNode.clientWidth || 640)), dpr = Math.min(2, window.devicePixelRatio || 1); W = w; H = Math.round(w * 9 / 16); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function fmt(s) { var m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; }
    function paint() {
      if (!W) size(); A.draw(ctx, W, H, scr.T, p); scrub.value = String(Math.round(scr.T * 10)); time.textContent = fmt(scr.T) + ' / ' + fmt(A.DURATION);
      var ln = A.activeLine(p, scr.T); cap.textContent = ln ? (ln.who ? ln.who + ': ' : '') + ln.text : (scr.T >= A.TITLE_AT ? p.title + ' \u2014 ' + p.seriesTitle : (p.fromScript ? '' : 'No spoken lines in this cold open: the franchise premise is shown instead.'));
    }
    function tick(now) {
      if (!scr.playing) return;
      scr.T += Math.min(0.1, (now - scr.last) / 1000); scr.last = now;
      if (scr.T >= A.DURATION) { scr.T = A.DURATION - 0.01; paint(); stopScreen(); play.textContent = 'PLAY'; return; }
      paint(); scr.raf = requestAnimationFrame(tick);
    }
    function startAudio() { if (scr.score) scr.score.stop(); scr.score = null; if (scr.sound && scr.playing) { scr.score = new A.Score(p); if (!scr.score.start(scr.T)) scr.score = null; } }
    play.addEventListener('click', function () {
      if (scr.playing) { stopScreen(); play.textContent = 'PLAY'; return; }
      if (scr.T >= A.DURATION - 0.05) scr.T = 0; scr.playing = true; scr.last = performance.now(); play.textContent = 'PAUSE'; startAudio(); scr.raf = requestAnimationFrame(tick);
    });
    restart.addEventListener('click', function () { stopScreen(); scr.T = 0; paint(); { scr.playing = true; scr.last = performance.now(); play.textContent = 'PAUSE'; startAudio(); scr.raf = requestAnimationFrame(tick); } });
    snd.addEventListener('click', function () { scr.sound = !scr.sound; snd.setAttribute('aria-pressed', scr.sound ? 'true' : 'false'); snd.textContent = scr.sound ? 'SOUND ON' : 'SOUND OFF'; startAudio(); });
    scrub.addEventListener('input', function () { scr.T = Number(scrub.value) / 10; if (scr.playing) { scr.last = performance.now(); startAudio(); } paint(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && scr.playing) { stopScreen(); play.textContent = 'PLAY'; } });
    window.addEventListener('resize', function () { size(); paint(); });
    box.appendChild(h('p', { 'class': 'sl-meta sl-locked', text: 'THE CONVERGENCE: NOT STARTED. The registry says crossovers must be earned by the other six franchises first.' }));
    box.appendChild(h('p', { 'class': 'sl-meta', text: 'An animatic is a timed moving storyboard: generative art, the first spoken lines of the series\' first episode as captions, and a synthesized score (off until you turn it on). It is not footage and not a trailer; no actor, voice or filmed shot exists.' }));
    window.setTimeout(function () { size(); paint(); }, 0);
    return box;
  }
  /* What exists and what remains, exactly as the registry and the files on disk say (computed once, by scripts/studios-presence.py). */
  function viewStatus() {
    var s = L.status, box = h('div', {}), rows = [
      ['FILMS WITH A SCRIPT', s.filmsScripted + ' OF ' + s.films, (s.films - s.filmsScripted) + ' REMAIN'],
      ['SERIES EPISODES WRITTEN (SHORT DRAFTS)', s.episodesWritten + ' OF ' + s.episodesDeclared, (s.episodesDeclared - s.episodesWritten) + ' REMAIN'],
      ['PLAYABLE BUILDS', String(s.builds.length), s.gamesWithoutBuild.length + ' GAMES HAVE NONE']];
    rows.forEach(function (r) { box.appendChild(h('div', { 'class': 'sl-card' }, [h('div', { 'class': 'sl-name', text: r[0] }), h('p', { 'class': 'sl-meta', text: r[1] + ' \u00b7 ' + r[2] })])); });
    var open = [h('div', { 'class': 'sl-name', text: 'BUILT, OPEN THEM' })], row = [];
    s.builds.forEach(function (b) { row.push(h('a', { 'class': 'sl-btn', href: b.prototype, text: 'OPEN ' + b.title.toUpperCase() })); });
    open.push(h('div', { 'class': 'sl-row' }, row)); box.appendChild(h('div', { 'class': 'sl-card' }, open));
    box.appendChild(h('div', { 'class': 'sl-card' }, [h('div', { 'class': 'sl-name', text: 'GAMES WITH NO BUILD' }), h('p', { 'class': 'sl-meta', text: s.gamesWithoutBuild.map(function (g) { return g.title + ' (' + g.status + ')'; }).join(' \u00b7 ') })]));
    box.appendChild(h('p', { 'class': 'sl-meta', text: 'Every item is a proposal and every episode a short draft. Footage, voice, music, a human playtest and any release need people and tools outside this repository.' }));
    return box;
  }
  function viewCharacters() {
    var box = h('div', {});
    frs().forEach(function (f) {
      box.appendChild(franchiseBlock(f, f.characters.map(function (c) {
        return h('div', { 'class': 'sl-card' }, [badge(c.status), h('div', { 'class': 'sl-name', text: c.name }), h('p', { 'class': 'sl-meta', text: c.role })]);
      })));
    });
    return box;
  }

  /* ---- shell */
  function renderTabs() {
    var bar = $('sl-tabs'); bar.textContent = '';
    TABS.forEach(function (t, i) {
      var b = h('button', { type: 'button', 'class': 'sl-tab', role: 'tab', id: 'sl-tab-' + t[0], 'aria-selected': state.tab === t[0] ? 'true' : 'false', 'aria-controls': 'sl-body', tabindex: state.tab === t[0] ? '0' : '-1', text: t[1] });
      b.addEventListener('click', function () { state.tab = t[0]; render(); });
      b.addEventListener('keydown', function (ev) {
        var d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return; ev.preventDefault();
        state.tab = TABS[(i + d + TABS.length) % TABS.length][0]; render(); $('sl-tab-' + state.tab).focus();
      });
      bar.appendChild(b);
    });
  }
  function renderChips() {
    var bar = $('sl-chips'); bar.textContent = '';
    [{ id: 'ALL', label: 'ALL' }].concat(L.franchises.map(function (f) { return { id: f.id, label: String(f.number), title: f.title }; })).forEach(function (c) {
      var b = h('button', { type: 'button', 'class': 'sl-chip', 'aria-pressed': state.fr === c.id ? 'true' : 'false', text: c.label });
      if (c.title) b.setAttribute('aria-label', c.title);
      if (c.title) b.setAttribute('title', c.title);
      b.addEventListener('click', function () { state.fr = c.id; render(); });
      bar.appendChild(b);
    });
  }
  function render() {
    stopScreen(); renderTabs(); renderChips(); $('sl-chips').style.display = (state.tab === 'status' || state.tab === 'screen') ? 'none' : '';   // the franchise filter does not apply to the status tab
    var box = $('sl-body'); box.textContent = ''; box.setAttribute('aria-labelledby', 'sl-tab-' + state.tab);
    var view;
    switch (state.tab) {
      case 'series': view = viewSeries(); break;
      case 'games': view = viewGames(); break;
      case 'characters': view = viewCharacters(); break;
      case 'screen': view = viewScreen(); break;
      case 'status': view = viewStatus(); break;
      default: view = viewFilms();
    }
    box.appendChild(view);
  }

  /* ---- load: only an owner session gets the library; a refusal is shown, never swallowed into an empty page */
  function fail(msg) { var b = $('sl-body'); b.textContent = ''; b.appendChild(h('p', { 'class': 'sl-err', role: 'alert', text: msg })); }
  /* Why the load failed, in one short line. RESTRICTED and APPROVAL REQUIRED are the two refusals; anything else names the HTTP status and the
     function's own error code (both are fixed server strings, shown with textContent) so UNAVAILABLE can be told apart: 404 not deployed, 5xx function, NO RESPONSE network or CORS. */
  function why(e) {
    if (e && e.code === 'owner_only') return 'RESTRICTED';
    if (e && (e.status === 401 || e.status === 403)) return 'APPROVAL REQUIRED';
    var part = e && e.status ? String(e.status) : (e && e.message === 'empty' ? 'EMPTY' : 'NO RESPONSE');
    var code = e && typeof e.code === 'string' && /^[a-z_]{1,40}$/.test(e.code) ? ' · ' + e.code : '';
    var why2 = e && typeof e.reason === 'string' && /^[A-Za-z0-9_]{1,24}$/.test(e.reason) ? ' · ' + e.reason : '';
    return 'UNAVAILABLE · ' + part + code + why2;
  }
  function load() {
    if (!window.OmegaSB) return Promise.reject(new Error('no client'));
    return window.OmegaSB.get().then(function (sb) { return sb.functions.invoke('studio-library', { body: {} }); }).then(function (r) {
      if (r && r.error) {
        var e = new Error(r.error.message || 'error'), ctx = r.error.context;
        e.status = ctx && ctx.status;
        return (ctx && ctx.json ? ctx.json().catch(function () { return null; }) : Promise.resolve(null)).then(function (b) { e.code = b && b.error; e.reason = b && b.reason; throw e; });
      }
      if (!r || !r.data || !r.data.library) throw new Error('empty');
      return r.data.library;
    });
  }
  load().then(function (data) {
    L = data; $('sl-foot').textContent = L.canonVersion + ' · ' + L.asOf; render();
  }).catch(function (e) { fail(why(e)); });
})();
