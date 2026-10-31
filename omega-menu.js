/* ============================================================================
   SYD OMEGA 91717 -- APP LAUNCHER (all pages, one tap)
   Fixes "no clear way to reach every page" -- especially on mobile. A launcher
   button opens a grouped, tappable grid of every platform page, so members
   never need the search bar to navigate. Pure ASCII, mobile-first, keyboard OK.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaMenu) return;
  window.__omegaMenu = 1;

  var GROUPS = [
    ['PROGRESSION', '#E86A3A', [
      ['\u25B2', 'Ascend', '/ascend.html'],
      ['\u2605', 'Achieve', '/achieve.html'],
      ['\u2605', 'Honors', '/honors.html'],
      ['\u2666', 'Achievements', '/achievements.html'],
      ['\u2637', 'Gates', '/elements.html#gates'],
      ['\u2609', 'Elements', '/elements.html'],
      ['\u25B3', 'Exam Hall', '/exam.html'],
      ['\u2726', 'Sovereign Points', '/points.html']
    ]],
    ['CORE', '#00E5FF', [
      ['\u2302', 'Dashboard', '/dashboard.html'],
      ['\u25C6', 'Identity', '/profile.html#identity'],
      ['\u2609', 'Cosmos', '/cosmos.html'],
      ['\u25CE', 'Matrix', '/matrix.html'],
      ['\u264D', 'Horoscope', '/cosmos.html#horoscope'],
      ['\u2721', 'Pantheons', '/pantheons.html'],
      ['\u2694', 'Factions', '/factions.html'],
      ['\u2604', 'Triads', '/matrix.html#triads'],
      ['\u25C7', 'Character', '/profile.html#character'],
      ['\u2691', 'Beacon', '/beacon.html'],
      ['\u2600', 'Agents', '/agents.html']
    ]],
    ['EXPERIENCE', '#9B6BF0', [
      ['\u2726', 'Academy', '/academy.html'],
      ['\u25A1', 'Courses', '/courses.html'],
      ['\u25B3', 'Exams', '/exam.html'],
      ['\u25B6', 'Games', '/gaming.html'],
      ['\u2b21', 'Contributions', '/contributions.html'],
      ['\u2638', 'Universe', '/media.html#universe'],
      ['\u25C9', 'Cinema', '/media.html#saga'],
      ['\u25A3', 'Media', '/media.html'],
      ['\u2b21', 'Sigil Vault', '/vault.html#nft']
    ]],
    ['ASSETS', '#C9A84C', [
      ['\u03A9', 'Vault', '/vault.html'],
      ['\u25C8', 'Treasury', '/vault.html#reserve'],
      ['\u2263', 'Ledger', '/ledger.html'],
      ['\u25D0', 'Wallet', '/vault.html#wallet'],
      ['\u25C7', 'Portfolio', '/profile.html#portfolio'],
      ['\u2318', 'Blockchain', '/blockchain.html'],
      ['\u25C8', 'Income', '/income.html'],
      ['\u2740', 'Payments', '/payments.html'],
      ['\u25B3', 'Subscriptions', '/subscriptions.html']
    ]],
    ['THE ORDER', '#C4453C', [
      ['\u2318', 'Family', '/family.html'],
      ['\u265A', 'Kings', '/elements.html#kings'],
      ['\u2691', 'Hall', '/hall.html'],
      ['\u2605', 'Trophies', '/trophies.html'],
      ['\u25A6', 'City', '/city.html'],
      ['\u2693', 'Bloodline', '/family.html#bloodline'],
      ['\u26EA', 'Heritage', '/family.html#heritage'],
      ['\u265B', 'Sovereigns', '/sovereigns.html'],
      ['\u2696', 'Charter', '/matrix.html#charter'],
      ['\u2696', 'Compliance', '/compliance.html']
    ]],
    ['SERVICES', '#3fb27f', [
      ['\u2723', 'Services', '/services.html'],
      ['\u25C9', 'Intelligence', '/intelligence.html'],
      ['\u2756', 'Chatbot', '/chatbot.html'],
      ['\u2696', 'Consultancy', '/consultancy.html'],
      ['\u25C8', 'Marketplace', '/marketplace.html'],
      ['\u2711', 'Publishing', '/publishing.html'],
      ['\u2732', 'Marketing', '/marketing.html'],
      ['\u2696', 'Contracts', '/contracts.html'],
      ['\u2727', 'Research', '/research.html'],
      ['\u2699', 'Automation', '/automation.html'],
      ['\u2609', 'Prediction', '/prediction.html'],
      ['\u2b21', 'Grid', '/matrix.html#grid']
    ]],
    ['COMMUNITY', '#34C6E6', [
      ['\u2695', 'News', '/news.html'],
      ['\u25C8', 'Social Hub', '/social.html'],
      ['\u2696', 'Events', '/events.html'],
      ['\u2622', 'Notifications', '/notifications.html'],
      ['\u2b21', 'Contributions', '/contributions.html'],
      ['\u25CE', 'Evolution', '/evolution.html'],
      ['\u2727', 'Search', '/search.html']
    ]],
    ['LIFESTYLE', '#E2C86D', [
      ['\u2695', 'Health', '/health.html'],
      ['\u2708', 'Travel', '/travel.html']
    ]],
    ['ACCOUNT', '#A9C2D8', [
      ['\u25CF', 'Profile', '/profile.html'],
      ['\u2699', 'Settings', '/settings.html'],
      ['\u25C6', 'Passport', '/profile.html#passport'],
      ['\u2713', 'KYC', '/profile.html#kyc']
    ]],
    /* Owner-only. Hidden for everyone else via CSS (body.omega-owner is set by
       bg.js after it confirms is_owner). Approvals had no menu entry at all --
       the owner could only reach it from the pending-members alert, which only
       appears when someone is already waiting. */
    ['OWNER', '#C0392B', [
      ['\u2713', 'Approvals', '/approvals.html'],
      ['\u2318', 'Control Deck', '/interface-omni.html']
    ], true]
  ];

  var css = [
    '#om-open{position:fixed;top:10px;left:12px;z-index:9000;height:34px;width:38px;padding:0;display:flex;align-items:center;justify-content:center;border:1px solid rgba(201,168,76,.28);background:rgba(10,10,15,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#C9A84C;border-radius:10px;cursor:pointer}',
    '#om-open:hover{border-color:rgba(201,168,76,.6);color:#E2C86D}',
    /* padding:0 above is load-bearing: #om-open has an id but no class, so
       bg.js's fallback skin for bare buttons (button:not([class])) gave it
       20px side padding, leaving 4px for this icon -- max-width:100% then drew
       the four-square grid as a 2x18px dot (measured 2026-10-25). */
    '#om-open svg{width:18px;height:18px;flex:none}',
    '#om-ov{position:fixed;inset:0;z-index:9600;background:radial-gradient(ellipse at 50% 30%,rgba(13,13,22,.97),rgba(2,2,6,.98));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:none;overflow-y:auto;padding:64px 18px 40px}',
    '#om-ov.open{display:block}',
    '#om-close{position:fixed;top:14px;right:16px;font-size:var(--fs-5,28px);color:#C9A84C;cursor:pointer;line-height:1;background:none;border:0}',
    '#om-inner{max-width:920px;margin:0 auto}',
    '#om-title{text-align:center;font-family:"Cinzel Decorative",serif;color:#C9A84C;letter-spacing:3px;font-size:var(--fs-4,20px);margin:0 0 24px}',
    '.om-grp{margin:0 0 22px}',
    /* owner-only group: hidden unless bg.js confirms is_owner (body.omega-owner) */
    '.om-grp-owner{display:none}',
    'body.omega-owner .om-grp-owner{display:block}',
    '.om-grp h4{font-family:"Courier Prime",monospace;color:#00E5FF;font-size:12px;letter-spacing:3px;margin:0 0 10px;opacity:.85}',
    '.om-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}',
    '.om-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;border:1px solid rgba(201,168,76,.22);background:rgba(255,255,255,.02);border-radius:12px;color:#d8d5cb;text-decoration:none;font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:1px;transition:all .2s}',
    '.om-card:hover{border-color:rgba(201,168,76,.6);background:rgba(201,168,76,.08);color:#E2C86D;transform:translateY(-2px)}',
    '.om-ic{width:40px;height:40px;display:inline-block}',
    '.om-card:hover .om-ic{filter:brightness(1.3)}',
    '#om-q{display:block;width:100%;max-width:420px;margin:0 auto 24px;box-sizing:border-box;padding:11px 14px;min-height:44px;border:1px solid rgba(201,168,76,.28);background:rgba(255,255,255,.04);color:#d8d5cb;border-radius:10px;font-family:"Courier Prime",monospace;font-size:16px;letter-spacing:1px}',
    '#om-q:focus{outline:2px solid #00E5FF;outline-offset:2px;border-color:rgba(201,168,76,.6)}',
    '.om-grp[hidden],.om-card[hidden],#om-empty[hidden]{display:none!important}',
    '#om-empty{text-align:center;color:#A9C2D8;font-family:"Courier Prime",monospace;letter-spacing:1px}',
    'body.om-lock{overflow:hidden}',
    '@media(max-width:760px){#om-ov{padding-top:58px}.om-cards{grid-template-columns:repeat(3,1fr)}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'om-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  function fillIcons(root) {
    var els = root.querySelectorAll('.om-ic');
    function fill() {
      if (!window.OmegaEmblem) return false;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.__filled) continue;
        el.innerHTML = window.OmegaEmblem.ring(esc(el.getAttribute('data-glyph')), esc(el.getAttribute('data-col')), {});
        el.__filled = 1;
      }
      return true;
    }
    if (fill()) return;
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (fill() || tries > 20) clearInterval(t);
    }, 150);
  }

  function build() {
    var btn = document.createElement('button'); btn.id = 'om-open'; btn.type = 'button'; btn.setAttribute('aria-label', 'All pages');
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    document.body.appendChild(btn);

    var ov = document.createElement('div'); ov.id = 'om-ov';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'All pages');
    var html = '<button id="om-close" aria-label="Close">\u00D7</button><div id="om-inner"><div id="om-title">SYD OMEGA 91717</div>' +
      '<input id="om-q" type="search" placeholder="Search pages" aria-label="Search pages" autocomplete="off" spellcheck="false">';
    GROUPS.forEach(function (g) {
      var ownerCls = g[3] ? ' om-grp-owner' : '';
      html += '<div class="om-grp' + ownerCls + '"><h4>' + g[0] + '</h4><div class="om-cards">';
      g[2].forEach(function (p) {
        html += '<a class="om-card" href="' + p[2] + '"><span class="om-ic" data-glyph="' + p[0] + '" data-col="' + g[1] + '"></span><span>' + p[1] + '</span></a>';
      });
      html += '</div></div>';
    });
    html += '<p id="om-empty" hidden>No pages match.</p></div>';
    ov.innerHTML = html;
    fillIcons(ov);
    document.body.appendChild(ov);

    /* Desktop collision (2026-10-25, owner screenshot). #om-open is fixed at
       12,10 (44x40, z-9000), which is exactly where nav.js's sidebar draws its
       own Home button (.on-btn, 6,10, 44x44) -- so on every page with the
       sidebar, Home was covered and could not be clicked. Phones already hide
       #om-open as a duplicate of the nav's own drawer (bg.js, "Phone chrome
       budget"); the desktop sidebar is the same duplicate (it reaches every
       page, ALL SERVICES included), so the button steps aside wherever the
       sidebar is actually rendered, and stays wherever there is no sidebar
       (public pages, pages that hide it). Measured, not assumed: nav.js renders
       after this file and some pages hide the sidebar, so it is re-checked on
       resize and whenever the sidebar's box changes. The overlay itself is
       untouched and still opens from code. */
    function syncWithSidebar() {
      var side = document.getElementById('omega-side');
      var r = side && side.getBoundingClientRect();
      btn.style.display = (r && r.width > 0 && r.height > 0) ? 'none' : '';
    }
    syncWithSidebar();
    window.addEventListener('resize', syncWithSidebar, { passive: true });
    (function watch() {
      var side = document.getElementById('omega-side');
      if (side && window.ResizeObserver) { new ResizeObserver(syncWithSidebar).observe(side); return; }
      if (!side && window.MutationObserver) {
        var mo = new MutationObserver(function () {
          if (document.getElementById('omega-side')) { mo.disconnect(); syncWithSidebar(); watch(); }
        });
        mo.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { mo.disconnect(); }, 15000);
      }
    })();

    /* Search: filters cards by label, hides groups left empty. Enter follows the
       first visible card, so a member can type and go without touching the grid. */
    var q = ov.querySelector('#om-q'), empty = ov.querySelector('#om-empty');
    function filter() {
      var term = q.value.trim().toLowerCase(), shown = 0;
      ov.querySelectorAll('.om-grp').forEach(function (g) {
        var any = 0;
        g.querySelectorAll('.om-card').forEach(function (c) {
          var hit = !term || c.textContent.toLowerCase().indexOf(term) !== -1;
          c.hidden = !hit; if (hit) any++;
        });
        g.hidden = !any; shown += any;
      });
      empty.hidden = shown > 0;
    }
    q.addEventListener('input', filter);
    q.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var first = ov.querySelector('.om-grp:not([hidden]) .om-card:not([hidden])');
      if (first) location.href = first.getAttribute('href');
    });

    /* Open/close with focus handling: scroll lock, focus into the search field,
       focus restored to whatever opened it, aria-expanded kept true to state. */
    var returnTo = null;
    function isOpen() { return ov.classList.contains('open'); }
    function open() {
      if (isOpen()) return;
      returnTo = document.activeElement;
      ov.classList.add('open'); document.body.classList.add('om-lock');
      btn.setAttribute('aria-expanded', 'true');
      q.value = ''; filter();
      setTimeout(function () { try { q.focus(); } catch (_) {} }, 0);
    }
    function close() {
      if (!isOpen()) return;
      ov.classList.remove('open'); document.body.classList.remove('om-lock');
      btn.setAttribute('aria-expanded', 'false');
      try { if (returnTo && returnTo.focus) returnTo.focus(); } catch (_) {}
    }
    btn.onclick = open;
    ov.querySelector('#om-close').onclick = close;
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      /* Tab stays inside the dialog while it is open. */
      if (e.key === 'Tab' && isOpen()) {
        var f = ov.querySelectorAll('button,input,a[href]:not([hidden])');
        var items = Array.prototype.filter.call(f, function (n) { return !n.closest('[hidden]'); });
        if (!items.length) return;
        var a = items[0], z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    /* Public handle: the button is hidden on phones and beside the desktop
       sidebar (above), which left this overlay with no way to open at all. */
    window.OmegaMenu = { open: open, close: close, toggle: function () { (isOpen() ? close : open)(); }, isOpen: isOpen };
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
