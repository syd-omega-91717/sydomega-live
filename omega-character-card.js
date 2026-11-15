/* ============================================================================
   omega-character-card.js -- the member's MAIN CHARACTER, one card everywhere.

   Mount:  <div data-omega-character-card></div>   (bg.js injects this module
   only on a page that carries a mount, as it does for the sculpture layer).

   What it is: the member's own sign, read from the ONE canon (OmegaCanon,
   omega-canon.json) and their own profile row. Sign, god, element, agent,
   house and gate come from the canon track; progress is what the profile
   RECORDS (authority, nodes cleared, medals, trophies, certificates).

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
      '.occ a{color:var(--occ-accent)}';
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

  async function boot() {
    var mounts = document.querySelectorAll('[data-omega-character-card]');
    if (!mounts.length) return;
    style();
    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    var fail = function (msg) { for (var i = 0; i < mounts.length; i++) { mounts[i].classList.add('occ'); mounts[i].textContent = msg; } };
    if (!sb) { fail('Character unavailable: no data connection.'); return; }
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    if (!s || !s.user) { fail('Sign in to see your character.'); return; }
    var r = await sb.from('profiles').select(COLS).eq('id', s.user.id).maybeSingle();
    if (r.error || !r.data) { fail('Character unavailable: your profile could not be read.'); return; }
    /* OmegaCanon loads asynchronously; wait briefly, never render from a copy. */
    for (var i = 0; i < 25 && !(window.OmegaCanon && window.OmegaCanon.ready); i++) await new Promise(function (res) { setTimeout(res, 150); });
    if (!(window.OmegaCanon && window.OmegaCanon.ready)) { fail('Character unavailable: the canon did not load.'); return; }
    for (var j = 0; j < mounts.length; j++) render(mounts[j], r.data, window.OmegaCanon);
  }

  window.OmegaCharacterCard = { render: render, gatesPassed: gatesPassed, authorityOf: authorityOf };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
