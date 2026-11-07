/* Ω STUDIO LIBRARY page logic (studio-library.html). The library arrives only from the owner-only studio-library function;
   it is not a static file. Every status shown is the payload's own status; this file decides nothing about canon and has no
   control that could mark a work released, streaming or playable. Plain DOM only: text is set with textContent and nothing is parsed as HTML. */
(function () {
  'use strict';
  var TABS = [['films', 'FILMS'], ['series', 'SERIES'], ['games', 'GAMES'], ['characters', 'CHARACTERS']];
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
      box.appendChild(franchiseBlock(f, [h('div', { 'class': 'sl-card' }, [badge(g.status), h('div', { 'class': 'sl-name', text: g.title }),
        h('p', { 'class': 'sl-meta', text: 'MULTIPLAYER ' + g.multiplayer }), h('div', { 'class': 'sl-row' }, row)])]));
    });
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
    renderTabs(); renderChips();
    var box = $('sl-body'); box.textContent = ''; box.setAttribute('aria-labelledby', 'sl-tab-' + state.tab);
    var view;
    switch (state.tab) {
      case 'series': view = viewSeries(); break;
      case 'games': view = viewGames(); break;
      case 'characters': view = viewCharacters(); break;
      default: view = viewFilms();
    }
    box.appendChild(view);
  }

  /* ---- load: only an owner session gets the library; a refusal is shown, never swallowed into an empty page */
  function fail(msg) { var b = $('sl-body'); b.textContent = ''; b.appendChild(h('p', { 'class': 'sl-err', role: 'alert', text: msg })); }
  function load() {
    if (!window.OmegaSB) return Promise.reject(new Error('no client'));
    return window.OmegaSB.get().then(function (sb) { return sb.functions.invoke('studio-library', { body: {} }); }).then(function (r) {
      if (r && r.error) {
        var e = new Error(r.error.message || 'error'), ctx = r.error.context;
        e.status = ctx && ctx.status;
        return (ctx && ctx.json ? ctx.json().catch(function () { return null; }) : Promise.resolve(null)).then(function (b) { e.code = b && b.error; throw e; });
      }
      if (!r || !r.data || !r.data.library) throw new Error('empty');
      return r.data.library;
    });
  }
  load().then(function (data) {
    L = data; $('sl-foot').textContent = L.canonVersion + ' · ' + L.asOf; render();
  }).catch(function (e) { fail(e && e.code === 'owner_only' ? 'RESTRICTED' : (e && (e.status === 401 || e.status === 403) ? 'APPROVAL REQUIRED' : 'UNAVAILABLE')); });
})();
