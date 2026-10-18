/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-media-core.js  (media.html only)

   MEDIA: read what was published, publish your own -- above the Living
   Codex catalogue, which already holds the franchise lore that cinema,
   movies, trailers, series and universe each repeated.

     DISPATCHES   rpc published_dispatches(3): the newest published news
     YOUR WORKS   publications where user_id is the member (RLS: own rows):
                  count, newest title, status
   Each column ends in its action (READ ALL on news.html, COMMIT A WORK on
   publishing.html). Measured 2026-10-18: 1 dispatch and 0 publications
   live; an empty column says so. Read-only.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaMediaCore) return;

  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function act(parent, href, text) { var a = el('a', 'omc-act', text, parent); a.href = href; return a; }

  function style() {
    if (document.getElementById('omc-style')) return;
    var s = document.createElement('style');
    s.id = 'omc-style';
    s.textContent = [
      '.omc{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:16px 0 22px}',
      '.omc-card{display:grid;gap:8px;align-content:start;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03)}',
      '.omc-h{font-family:monospace;font-size:.64rem;letter-spacing:.18em;color:var(--muted,#9aa)}',
      '.omc-li{display:grid;gap:2px;padding:8px 0;border-top:1px solid rgba(255,255,255,.06)}',
      '.omc-li strong{font-family:var(--R,sans-serif);font-size:1rem;color:var(--ink,#eee)}',
      '.omc-li p{margin:0;font-family:var(--R,sans-serif);font-size:.85rem;color:var(--muted,#9aa);overflow-wrap:anywhere}',
      '.omc-li small{font-family:monospace;font-size:.6rem;letter-spacing:.08em;color:var(--muted,#9aa)}',
      '.omc-big{display:flex;align-items:baseline;gap:8px}',
      '.omc-big b{font-family:var(--R,sans-serif);font-size:1.9rem;line-height:1;color:var(--ink,#eee)}',
      '.omc-big span{font-family:monospace;font-size:.6rem;letter-spacing:.12em;color:var(--muted,#9aa)}',
      '.omc-empty{font-family:monospace;font-size:.64rem;letter-spacing:.1em;color:var(--muted,#9aa)}',
      '.omc .omc-act{display:inline-flex!important;justify-self:start;align-items:center;min-height:40px;padding:8px 14px;border-radius:10px;border:1px solid rgba(212,175,55,.5);color:var(--ink,#eee);font-family:monospace;font-size:.66rem;letter-spacing:.14em;text-decoration:none}'
    ].join('');
    document.head.appendChild(s);
  }

  async function boot() {
    var root = document.querySelector('[data-omega-media-core]');
    if (!root) return;
    var sb = null;
    try { sb = window.OmegaSB && window.OmegaSB.get ? await window.OmegaSB.get() : (window.__omegaSb || null); } catch (e) { sb = null; }
    if (!sb) return;
    var s = null;
    try { s = (await sb.auth.getSession()).data.session; } catch (e) { s = null; }
    style();
    root.classList.add('omc');
    var r = await Promise.all([
      sb.rpc('published_dispatches', { p_limit: 3 }),
      s && s.user ? sb.from('publications').select('kind,title,status,created_at').eq('user_id', s.user.id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: null, error: { message: 'signed out' } })
    ]);
    root.textContent = '';

    var d = el('section', 'omc-card', null, root);
    el('div', 'omc-h', 'DISPATCHES', d);
    if (r[0].error) el('div', 'omc-empty', 'DISPATCHES UNAVAILABLE', d);
    else if (!(r[0].data || []).length) el('div', 'omc-empty', 'NOTHING PUBLISHED YET', d);
    else (r[0].data || []).forEach(function (x) {
      var li = el('div', 'omc-li', null, d);
      el('strong', null, x.title || 'Dispatch', li);
      el('p', null, String(x.body || '').slice(0, 140), li);
      el('small', null, [String(x.category || '').toUpperCase(), String(x.created_at || '').slice(0, 10)].filter(Boolean).join(' · '), li);
    });
    act(d, '/news.html', 'READ ALL ↗');

    var w = el('section', 'omc-card', null, root);
    el('div', 'omc-h', 'YOUR WORKS', w);
    if (r[1].error) el('div', 'omc-empty', s && s.user ? 'WORKS UNAVAILABLE' : 'SIGN IN TO SEE YOUR WORKS', w);
    else {
      var pubs = r[1].data || [];
      var big = el('div', 'omc-big', null, w);
      el('b', null, String(pubs.length), big);
      el('span', null, pubs.length === 1 ? 'WORK COMMITTED' : 'WORKS COMMITTED', big);
      if (pubs[0]) {
        var li = el('div', 'omc-li', null, w);
        el('strong', null, pubs[0].title || 'Untitled', li);
        el('small', null, [String(pubs[0].kind || '').toUpperCase(), String(pubs[0].status || '').toUpperCase(), String(pubs[0].created_at || '').slice(0, 10)].filter(Boolean).join(' · '), li);
      }
    }
    act(w, '/publishing.html', 'COMMIT A WORK ↗');
  }

  window.OmegaMediaCore = {};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
