/* ============================================================================
   omega-character-card.js -- the member's MAIN CHARACTER, one card everywhere.

   Mount:  <div data-omega-character-card></div>   (bg.js injects this module
   only on a page that carries a mount, as it does for the sculpture layer).

   What it is: the member's own sign, read from the ONE canon (OmegaCanon,
   omega-canon.json) and their own profile row. Sign, god, element, agent,
   house and gate come from the canon track; progress is what the profile
   RECORDS (authority, nodes cleared, medals, trophies, certificates).

   Roster: <div data-omega-character-roster></div> lists the 12 canon characters
   with the member's own per-sign progress from rpc('my_matrix') (phase 1 rows,
   the same data matrix.html shows). The member's main sign is marked. A sign
   whose axes are all still at their starting value of 1 reads "Not started";
   nothing is "collected" or levelled beyond what those recorded numbers say.

   Story: <div data-omega-character-story></div> shows the member's sign story from /omega-stories.json
   (original retellings of the classical constellation myths). Chapter k opens when the member has
   really passed N authority gates (same arithmetic as the card); a locked chapter shows the gate it
   needs and its text is never rendered. The file holds stories only: gods, agents and gates are read
   from the canon, never copied.

   Alive: <div data-omega-sculpture="character"></div> plus <div data-omega-character-sigil-note></div>
   puts the member's character into the 3-D layer (omega-sculpture.js, scene `character`): gate nodes
   lit by the gates really passed, five satellites sized by the five mana components, the core in the
   sign's element colour. This module only SETS the scene's data attributes from the same rules as the
   card (gates from authority, mana from OmegaRelearnSigilMana.fetchMana) and writes one plain-text line
   saying what the picture shows. A component with no recorded source stays a ghost.

   Class names: never a bare `main`, `on`, `lf` or `card` token. `.main` is the
   platform's content column (bg.js layout; omega-legal.js and omega-ui.js
   append the footer to the first `.main`), so a tile classed `main` swallowed
   the site footer. Modifiers here are `is-started` / `is-mine`.

   What it refuses to do (CLAUDE.md 8.1 class 9): invent a value. A member with
   no sign gets "not set yet" and a link to set it, never a sign guessed from
   the calendar. A column that is empty shows a dash, never a made-up number.
   Read-only: this module writes nothing.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaCharacterCard) return;
  window.__omegaCharacterCard = 1;

  var COLS = 'display_name,sign,element,god,agent,is_owner,axis_a,axis_b,axis_c,nodes_cleared,medals_earned,trophies_earned,certificates_earned,tracks_done,phases_done';

  function el(tag, cls, text, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  function style() {
    if (document.getElementById('occ-style')) return;
    var s = document.createElement('style');
    s.id = 'occ-style';
    s.textContent =
      '.occ{--occ-accent:var(--gold,#d4af37);position:relative;border:1px solid rgba(212,175,55,.28);border-radius:14px;padding:1.1rem 1.25rem;' +
      'background:linear-gradient(160deg,rgba(255,255,255,.04),rgba(255,255,255,.01));max-width:34rem;font-family:var(--R,Rajdhani,sans-serif);color:var(--ink,#e8e6df)}' +
      '.occ::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;border-radius:14px 14px 0 0;background:var(--occ-accent)}' +
      '.occ-eyebrow{font-family:var(--M,"Courier Prime",monospace);font-size:.68rem;letter-spacing:.18em;color:var(--muted,#8b93a3);text-transform:uppercase}' +
      '.occ-sign{font-family:var(--D,"Cinzel Decorative",serif);font-size:1.7rem;color:var(--occ-accent);margin:.15rem 0 .1rem}' +
      '.occ-sub{font-size:.95rem;color:var(--muted,#8b93a3)}' +
      '.occ-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(7.5rem,1fr));gap:.55rem .9rem;margin-top:.9rem}' +
      '.occ-k{font-family:var(--M,"Courier Prime",monospace);font-size:.62rem;letter-spacing:.14em;color:var(--muted,#8b93a3);text-transform:uppercase}' +
      '.occ-v{font-size:1.05rem}' +
      '.occ-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);margin-top:.9rem;overflow:hidden}' +
      '.occ-bar>i{display:block;height:100%;background:var(--occ-accent)}' +
      '.occ-note{font-size:.82rem;color:var(--muted,#8b93a3);margin-top:.45rem}' +
      '.occ a{color:var(--occ-accent)}' +
      '.ocr{display:grid;grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr));gap:.6rem;font-family:var(--R,Rajdhani,sans-serif);color:var(--ink,#e8e6df)}' +
      '.ocr-t{border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:.6rem .7rem;background:rgba(255,255,255,.02)}' +
      '.ocr-t.is-started{border-color:rgba(212,175,55,.45)}' +
      '.ocr-t.is-mine{border-color:var(--gold,#d4af37);box-shadow:0 0 0 1px rgba(212,175,55,.35) inset}' +
      '.ocr-n{font-family:var(--D,"Cinzel Decorative",serif);font-size:1rem;color:var(--gold,#d4af37)}' +
      '.ocr-s{font-size:.82rem;color:var(--muted,#8b93a3)}' +
      '.ocr-p{font-family:var(--M,"Courier Prime",monospace);font-size:.74rem;margin-top:.3rem}' +
      '.ocr-tag{font-family:var(--M,"Courier Prime",monospace);font-size:.6rem;letter-spacing:.14em;color:var(--gold,#d4af37)}' +
      '.ocr-msg{font-size:.9rem;color:var(--muted,#8b93a3)}' +
      '.ocs{max-width:44rem;font-family:var(--R,Rajdhani,sans-serif);color:var(--ink,#e8e6df)}' +
      '.ocs-h{font-family:var(--D,"Cinzel Decorative",serif);font-size:1.25rem;color:var(--gold,#d4af37)}' +
      '.ocs-ch{border-left:2px solid rgba(212,175,55,.45);padding:.1rem 0 .1rem .8rem;margin:.9rem 0}' +
      '.ocs-ch.is-locked{border-left-color:rgba(255,255,255,.14);opacity:.7}' +
      '.ocs-t{font-family:var(--M,"Courier Prime",monospace);font-size:.68rem;letter-spacing:.16em;color:var(--muted,#8b93a3);text-transform:uppercase}' +
      '.ocs-p{margin:.25rem 0 0;line-height:1.55}' +
      '.ocs-f{font-size:.78rem;color:var(--muted,#8b93a3);margin-top:1rem;line-height:1.5}';
    document.head.appendChild(s);
  }

  function num(v) {
    var n = Number(v);
    return (v === null || v === undefined || v === '' || !isFinite(n)) ? null : n;
  }
  function show(v) { return v === null ? '—' : String(v); }

  /* Authority by the platform's own rule (canon.authority.formula, the same one
     character.html and the authority_score() SQL function use):
     sqrt(A^3+B^3+C^3) * phi / e from the three RECORDED axes. The owner sits at
     the canon apex, as on character.html. Null when any axis is empty, so the
     card can never disagree with the page it sits on or invent a score. */
  function authorityOf(p, canon) {
    var a = canon && canon.authority;
    if (!a) return null;
    if (p.is_owner) return num(a.apex);
    var x = num(p.axis_a), y = num(p.axis_b), z = num(p.axis_c);
    if (x === null || y === null || z === null || !num(a.phi) || !num(a.euler)) return null;
    return Math.sqrt(Math.pow(x, 3) + Math.pow(y, 3) + Math.pow(z, 3)) * a.phi / a.euler;
  }

  /* How many of the canon's 12 authority gates a score has passed.
     Pure arithmetic on two real numbers; null when authority is empty. */
  function gatesPassed(authority, canon) {
    var gates = canon && canon.authority && canon.authority.gates;
    if (authority === null || !gates || !gates.length) return null;
    var n = 0;
    for (var i = 0; i < gates.length; i++) if (authority >= gates[i]) n++;
    return { passed: n, total: gates.length, apex: gates[gates.length - 1] };
  }

  function render(root, p, canon) {
    root.textContent = '';
    root.classList.add('occ');
    var track = (canon && p && p.sign) ? canon.trackBySign(p.sign) : null;
    el('div', 'occ-eyebrow', 'Main character', root);

    if (!p || !p.sign || !track) {
      el('div', 'occ-sign', 'Not set yet', root);
      var sub = el('div', 'occ-sub', p && p.sign ? 'This sign is not in the canon: ' + p.sign + '. ' : 'Your sign decides your main character. ', root);
      var a = el('a', '', 'Set it on your profile', sub);
      a.href = '/profile.html';
      return;
    }

    var elem = canon.elementFor(track.sign) || track.element;
    el('div', 'occ-sign', track.sign, root);
    el('div', 'occ-sub', track.god + ' · ' + elem + ' · ' + track.agent, root);

    var grid = el('div', 'occ-grid', null, root);
    function cell(k, v) { var c = el('div', '', null, grid); el('div', 'occ-k', k, c); el('div', 'occ-v', v, c); }
    cell('House', track.house);
    cell('Gate', track.gate);
    cell('Nodes cleared', show(num(p.nodes_cleared)));
    cell('Medals', show(num(p.medals_earned)));
    cell('Trophies', show(num(p.trophies_earned)));
    cell('Certificates', show(num(p.certificates_earned)));

    var auth = authorityOf(p, canon), g = gatesPassed(auth, canon);
    if (g) {
      cell('Authority', auth.toFixed(4));
      var bar = el('div', 'occ-bar', null, root), fill = el('i', '', null, bar);
      fill.style.width = Math.min(100, Math.round(auth / g.apex * 100)) + '%';
      el('div', 'occ-note', 'Gate ' + g.passed + ' of ' + g.total + ' passed · from your recorded axes, same rule as the Authority tile', root);
    } else {
      cell('Authority', '—');
      el('div', 'occ-note', 'Authority needs all three axes recorded — this card shows only what your profile holds.', root);
    }
  }

  /* rows: my_matrix() rows ({track,sign,a,b,c,node,pct,phase}). Only phase 1
     (or rows with no phase column) are used, as matrix.html does. A row is
     "started" when any axis has moved off its starting value of 1. */
  function startedRow(r) { return r && (num(r.a) > 1 || num(r.b) > 1 || num(r.c) > 1); }

  function renderRoster(root, rows, canon, mainSign) {
    root.textContent = '';
    root.classList.add('ocr');
    var tracks = canon && canon.tracks ? canon.tracks : [];
    if (!tracks.length) { el('div', 'ocr-msg', 'The canon did not load.', root); return; }
    var bySign = {};
    (rows || []).forEach(function (r) {
      if (r && (r.phase === undefined || r.phase === null || Number(r.phase) === 1) && r.sign) bySign[String(r.sign).toLowerCase()] = r;
    });
    var main = mainSign ? String(mainSign).toLowerCase() : '';
    tracks.forEach(function (t) {
      var r = bySign[String(t.sign).toLowerCase()];
      var isMain = main && String(t.sign).toLowerCase() === main;
      var started = startedRow(r);
      var tile = el('div', 'ocr-t' + (started ? ' is-started' : '') + (isMain ? ' is-mine' : ''), null, root);
      if (isMain) el('div', 'ocr-tag', 'MAIN CHARACTER', tile);
      el('div', 'ocr-n', t.sign, tile);
      el('div', 'ocr-s', t.god + ' \u00B7 ' + t.agent, tile);
      var line;
      if (!r) line = 'No progress data';
      else if (!started) line = 'Not started';
      else line = '(' + show(num(r.a)) + ',' + show(num(r.b)) + ',' + show(num(r.c)) + ') \u00B7 ' + show(num(r.pct)) + '%';
      el('div', 'ocr-p', line, tile);
    });
  }

  /* doc = omega-stories.json; p = the member's profile row. Pure DOM, textContent only. */
  function renderStory(root, doc, p, canon) {
    root.textContent = '';
    root.classList.add('ocs');
    var track = (canon && p && p.sign) ? canon.trackBySign(p.sign) : null;
    var story = (track && doc && doc.stories) ? doc.stories[track.sign] : null;
    if (!track) {
      el('div', 'ocr-msg', 'Your sign story opens once your sign is set. ', root);
      var a = el('a', '', 'Set it on your profile', root);
      a.href = '/profile.html';
      return;
    }
    if (!story) { el('div', 'ocr-msg', 'No story is written for ' + track.sign + ' yet.', root); return; }
    var g = gatesPassed(authorityOf(p, canon), canon);
    var passed = g ? g.passed : 0;
    var gates = Array.isArray(doc.chapter_gates) ? doc.chapter_gates : [0, 0, 0, 0];
    var titles = Array.isArray(doc.chapter_titles) ? doc.chapter_titles : [];
    el('div', 'ocs-h', story.constellation, root);
    var opened = 0;
    story.chapters.forEach(function (text, i) {
      var need = Number(gates[i]) || 0;
      var open = passed >= need;
      if (open) opened++;
      var ch = el('div', 'ocs-ch' + (open ? '' : ' is-locked'), null, root);
      el('div', 'ocs-t', 'Chapter ' + (i + 1) + ' \u00B7 ' + (titles[i] || ''), ch);
      if (open) el('p', 'ocs-p', text, ch);
      else el('p', 'ocs-p', 'Opens at gate ' + need + '. ' + (g ? 'You have passed ' + passed + ' of ' + g.total + '.' : 'Authority needs all three axes recorded.'), ch);
    });
    var foot = el('div', 'ocs-f', null, root);
    el('div', '', opened + ' of ' + story.chapters.length + ' chapters open, by the gates you have really passed.', foot);
    el('div', '', 'A retelling written for this platform. Sources: ' + (story.sources || []).join('; ') + '.', foot);
    if (story.variant) el('div', '', 'Variant: ' + story.variant, foot);
  }

  /* Elements come from the canon as UPPER CASE names; OmegaRealm.palette keys are Title case. */
  function paletteKey(name) { return name ? String(name).charAt(0).toUpperCase() + String(name).slice(1).toLowerCase() : ''; }

  async function bootSigil(sb, session, canon, p) {
    var stage = document.querySelector('[data-omega-sculpture="character"]');
    var notes = document.querySelectorAll('[data-omega-character-sigil-note]');
    var say = function (txt) { for (var i = 0; i < notes.length; i++) notes[i].textContent = txt; };
    var track = (canon && p && p.sign) ? canon.trackBySign(p.sign) : null;
    var parts = [];
    if (!track) {
      if (stage) { stage.removeAttribute('data-sculpt-gates'); stage.removeAttribute('data-sculpt-element'); stage.setAttribute('data-sculpt-mana', ''); }
      say('Set your sign to give your character its element, and its gates.');
      return;
    }
    var auth = authorityOf(p, canon), g = gatesPassed(auth, canon);
    if (stage) {
      stage.setAttribute('data-sculpt-element', paletteKey(canon.elementFor(track.sign) || track.element));
      if (g) stage.setAttribute('data-sculpt-gates', String(g.passed)); else stage.removeAttribute('data-sculpt-gates');
    }
    parts.push(g ? g.passed + ' of ' + g.total + ' gates lit' : 'gates unknown (authority needs all three axes recorded)');
    var read = { mana: null, failed: ['module'] };
    try {
      if (window.OmegaRelearnSigilMana && typeof window.OmegaRelearnSigilMana.fetchMana === 'function')
        read = await window.OmegaRelearnSigilMana.fetchMana(sb, session.user.id, 30);
    } catch (e) { read = { mana: null, failed: ['read'] }; }
    var names = ['FOCUS', 'LEARNING', 'CREATIVE', 'COLLABORATION', 'EXECUTION'];
    if (read.mana) {
      var vals = names.map(function (n) { var v = read.mana.components[n]; return v === null || v === undefined ? '-' : String(Math.max(0, Math.min(100, Number(v))) / 100); });
      if (stage) stage.setAttribute('data-sculpt-mana', vals.join(','));
      parts.push('mana ' + read.mana.total + '/100 over your last ' + read.mana.windowDays + ' days: ' +
        names.map(function (n) { var v = read.mana.components[n]; return n + ' ' + (v === null || v === undefined ? '\u2014' : v); }).join(' \u00B7 '));
    } else {
      if (stage) stage.setAttribute('data-sculpt-mana', '');
      parts.push('mana unavailable (could not read your ' + (read.failed || []).join(', ') + '), satellites drawn as ghosts');
    }
    say(parts.join(' \u00B7 ') + '. Drawn only from your recorded activity; hollow means no source yet.');
  }

  async function bootRoster(sb, session, canon) {
    var roots = document.querySelectorAll('[data-omega-character-roster]');
    if (!roots.length) return;
    var failR = function (msg) { for (var i = 0; i < roots.length; i++) { roots[i].textContent = ''; el('div', 'ocr-msg', msg, roots[i]); } };
    var m = await sb.rpc('my_matrix');
    if (m.error) { failR('Roster unavailable: your progress could not be read.'); return; }
    var pr = await sb.from('profiles').select('sign').eq('id', session.user.id).maybeSingle();
    var sign = (!pr.error && pr.data) ? pr.data.sign : null;
    for (var j = 0; j < roots.length; j++) renderRoster(roots[j], m.data || [], canon, sign);
  }

  async function boot() {
    var mounts = document.querySelectorAll('[data-omega-character-card]');
    var hasRoster = document.querySelectorAll('[data-omega-character-roster]').length > 0;
    var storyMounts = document.querySelectorAll('[data-omega-character-story]');
    var sigilNotes = document.querySelectorAll('[data-omega-character-sigil-note]');
    if (!mounts.length && !hasRoster && !storyMounts.length && !sigilNotes.length) return;
    style();
    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    var fail = function (msg) {
      for (var i = 0; i < mounts.length; i++) { mounts[i].classList.add('occ'); mounts[i].textContent = msg; }
      var rr = document.querySelectorAll('[data-omega-character-roster],[data-omega-character-story],[data-omega-character-sigil-note]');
      for (var k = 0; k < rr.length; k++) { rr[k].textContent = msg; }
    };
    if (!sb) { fail('Character unavailable: no data connection.'); return; }
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    if (!s || !s.user) { fail('Sign in to see your character.'); return; }
    var r = { data: null, error: null };
    if (mounts.length || storyMounts.length || sigilNotes.length) {
      r = await sb.from('profiles').select(COLS).eq('id', s.user.id).maybeSingle();
      if (r.error || !r.data) { fail('Character unavailable: your profile could not be read.'); return; }
    }
    /* OmegaCanon loads asynchronously; wait briefly, never render from a copy. */
    for (var i = 0; i < 25 && !(window.OmegaCanon && window.OmegaCanon.ready); i++) await new Promise(function (res) { setTimeout(res, 150); });
    if (!(window.OmegaCanon && window.OmegaCanon.ready)) { fail('Character unavailable: the canon did not load.'); return; }
    for (var j = 0; j < mounts.length; j++) render(mounts[j], r.data, window.OmegaCanon);
    if (storyMounts.length) {
      var doc = null;
      try { var resp = await fetch('/omega-stories.json'); doc = resp.ok ? await resp.json() : null; } catch (e) { doc = null; }
      for (var m = 0; m < storyMounts.length; m++) {
        if (doc) renderStory(storyMounts[m], doc, r.data, window.OmegaCanon);
        else storyMounts[m].textContent = 'Story unavailable: the story file could not be read.';
      }
    }
    if (sigilNotes.length) await bootSigil(sb, s, window.OmegaCanon, r.data);
    if (hasRoster) await bootRoster(sb, s, window.OmegaCanon);
  }

  window.OmegaCharacterCard = { render: render, renderRoster: renderRoster, renderStory: renderStory, gatesPassed: gatesPassed, authorityOf: authorityOf };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
