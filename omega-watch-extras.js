/* ============================================================================
   SYD OMEGA 91717 -- WATCH EXTRAS (what cinema.html held that movies.html did not)

   cinema.html listed the same twelve films as movies.html and was retired into
   it.  Two things were worth keeping, both true and both unique:

     FILMS BY ELEMENT      derived from the tiles themselves (the element tag
                           and the roman number each tile already carries), so
                           there is no second copy of the film list to drift.
     THE REAL OLYMPIANS    a non-fiction companion: a click fetches the god's
                           summary from Wikipedia (no key, no login).

   WHAT WAS NOT CARRIED OVER, ON PURPOSE.  cinema.html advertised "144 series"
   and twelve "featured series" with episode counts, called the films
   gate-locked, and its ARCHITECTURE text put Fire on films I and X where its own
   element tab (and the tiles) say I, V and IX.  scripts/tests/
   test_series_status_truth.py already forbids the 144 claim on series.html, and
   movies.html says these are concept reels, not films.

   The Wikipedia text and link come from a third party: they are written with
   textContent, and the link is used only if it points at en.wikipedia.org.
   A file, not an inline block, so the CSP inline ratchet holds.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaWatchExtras) return;

  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  /* mythology facts, not platform canon */
  var EPITHET = { ARES: 'God of War', APHRODITE: 'Goddess of Love', HERMES: 'Messenger of the Gods', ARTEMIS: 'Goddess of the Hunt', APOLLO: 'God of Light', ATHENA: 'Goddess of Wisdom', HERA: 'Queen of Olympus', DEMETER: 'Goddess of Earth', ZEUS: 'King of the Gods', HESTIA: 'Goddess of the Hearth', HEPHAESTUS: 'God of the Forge', POSEIDON: 'God of the Sea' };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function films() {
    return Array.prototype.map.call(document.querySelectorAll('.omv-tile[data-film]'), function (t) {
      var n = parseInt(t.getAttribute('data-film'), 10);
      var tags = t.querySelectorAll('.omv-tags span');
      var cap = t.querySelector('.omv-cap');
      var god = cap && cap.querySelector('b') ? cap.querySelector('b').textContent.trim() : '';
      var title = cap ? cap.textContent.replace(god, '').replace(/^[\s·]+/, '').trim() : '';
      return { n: n, roman: ROMAN[n - 1] || String(n), god: god, title: title, element: tags.length > 1 ? tags[1].textContent.trim() : '', color: t.style.getPropertyValue('--omv-c') || '' };
    }).filter(function (f) { return f.n >= 1 && f.n <= 12 && f.god; });
  }

  function buildElements(host, list) {
    var groups = {}, order = [];
    list.forEach(function (f) { if (!f.element) return; if (!groups[f.element]) { groups[f.element] = []; order.push(f.element); } groups[f.element].push(f); });
    order.forEach(function (name) {
      var g = groups[name];
      var card = el('div', 'omv-el card');
      var head = el('div', 'omv-el-h', name + ' · Film' + (g.length > 1 ? 's ' : ' ') + g.map(function (f) { return f.roman; }).join(', '));
      card.appendChild(head);
      card.appendChild(el('div', 'omv-el-b', g.map(function (f) { return f.title; }).join(' · ')));
      host.appendChild(card);
    });
  }

  function wikiLink(u) { return typeof u === 'string' && /^https:\/\/en\.wikipedia\.org\//.test(u) ? u : null; }
  function summary(name) {
    function get(page) { return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(page)).then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); }); }
    var cap = name.charAt(0) + name.slice(1).toLowerCase();
    return get(cap + '_(mythology)').catch(function () { return get(cap); });
  }
  function loadMyth(f, body) {
    body.textContent = '';
    body.appendChild(el('span', 'omv-note', 'LOADING…'));
    summary(f.god).then(function (data) {
      body.textContent = '';
      body.appendChild(el('div', 'omv-myth-t', String(data && data.extract || 'No summary available.')));
      var url = wikiLink(data && data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page) || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(f.god.charAt(0) + f.god.slice(1).toLowerCase());
      var a = el('a', 'omv-myth-a', 'READ FULL ARTICLE ON WIKIPEDIA →');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      body.appendChild(a);
    }).catch(function () {
      body.textContent = '';
      body.appendChild(el('span', 'omv-note omv-bad', 'Could not reach Wikipedia — check your connection and try again.'));
      var b = el('button', 'omv-myth-b', 'RETRY'); b.type = 'button'; b.setAttribute('data-myth', String(f.n));
      body.appendChild(b);
    });
  }
  function buildMyth(host, list) {
    list.forEach(function (f) {
      var card = el('div', 'omv-myth card');
      card.style.setProperty('--omv-c', f.color);
      card.appendChild(el('div', 'omv-myth-g', f.god + ' · ' + (EPITHET[f.god.toUpperCase()] || '').toUpperCase()));
      card.appendChild(el('div', 'omv-myth-f', 'Fronts: ' + f.title + ' · Film ' + f.roman));
      var body = el('div', 'omv-myth-body'); body.id = 'omv-myth-' + f.n;
      var b = el('button', 'omv-myth-b', 'LOAD REAL SUMMARY (WIKIPEDIA)'); b.type = 'button'; b.setAttribute('data-myth', String(f.n));
      body.appendChild(b); card.appendChild(body); host.appendChild(card);
    });
  }

  function boot() {
    var list = films(); if (list.length !== 12) return;
    var eh = document.getElementById('omv-elements'); if (eh && !eh.children.length) buildElements(eh, list);
    var mh = document.getElementById('omv-myth-grid'); if (mh && !mh.children.length) buildMyth(mh, list);
    document.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('[data-myth]') : null; if (!b) return;
      var n = parseInt(b.getAttribute('data-myth'), 10), f = list.filter(function (x) { return x.n === n; })[0];
      var body = document.getElementById('omv-myth-' + n); if (f && body) loadMyth(f, body);
    });
  }
  window.OmegaWatchExtras = { films: films, status: function () { return { films: films().length }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
