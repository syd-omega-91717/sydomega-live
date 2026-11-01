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
    /* Member status line: only fields the profile really has (display_name, sign, element, is_owner). */
    '#om-status{text-align:center;margin:-14px 0 20px;font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#B8B29F}',
    '#om-status[hidden]{display:none}',
    /* Security block: real session controls, shown only when signed in. */
    '#om-sec{margin:34px auto 0;max-width:560px;padding:16px 18px;border:1px solid rgba(224,115,107,.4);border-radius:12px;background:rgba(196,69,60,.07)}',
    '#om-sec[hidden],#om-sec-confirm[hidden]{display:none}',
    '#om-sec h3{margin:0 0 8px;font:12px "Courier Prime",monospace;letter-spacing:3px;color:#E0736B;font-weight:400}',
    '#om-sec p{margin:0 0 12px;font-family:Rajdhani,sans-serif;font-size:15px;line-height:1.45;color:#D8D5CB}',
    '#om-ov .om-sec-row{display:flex;flex-wrap:wrap;gap:10px}',
    '#om-ov button.om-sec-btn{min-height:44px;padding:0 16px;border:1px solid rgba(201,168,76,.45);background:rgba(255,255,255,.04);color:#E2C86D;border-radius:10px;font:12px "Courier Prime",monospace;letter-spacing:.14em;cursor:pointer}',
    '#om-ov button.om-sec-danger{border-color:rgba(224,115,107,.65);color:#E0736B}',
    '#om-ov button.om-sec-btn:disabled{opacity:.5;cursor:default}',
    '#om-sec-confirm{margin-top:14px}',
    '#om-sec-status{margin:12px 0 0;min-height:1.2em}',
    '#om-status b{color:#E2C86D;font-weight:400}',
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
    '.om-grp[hidden],.om-card[hidden],.om-chip[hidden],#om-empty[hidden]{display:none!important}',
    '#om-empty{text-align:center;color:#A9C2D8;font-family:"Courier Prime",monospace;letter-spacing:1px}',
    'body.om-lock{overflow:hidden}',
    /* Pages the curated grid above does not list, merged in from nav.js. Compact
       chips, not emblem cards: ~170 cards would be a ~15,000px scroll. */
    '.om-chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.om-chip{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;padding:0 12px;border:1px solid rgba(201,168,76,.22);background:rgba(255,255,255,.02);border-radius:10px;color:#d8d5cb;text-decoration:none;font-family:"Courier Prime",monospace;font-size:12px;letter-spacing:1px}',
    '.om-chip:hover,.om-chip:focus-visible{border-color:rgba(201,168,76,.6);background:rgba(201,168,76,.08);color:#E2C86D}',
    /* a[href] in omega-accessibility-audit.css (0,1,1) outranks a lone class, so both the
       owner gate and [hidden] need !important or the chip paints anyway (measured). */
    'body:not(.omega-owner) .om-chip-owner{display:none!important}',
    /* The phone bottom nav (z 9990) sits above this overlay (z 9600) and would cover the last row;
       omega-bottom-stack.js publishes its measured height. omega-components.js used to force
       .om-cards to 1 column here with !important (measured 390px: 74 full-width cards). */
    '@media(max-width:760px){#om-ov{padding-top:58px;padding-bottom:calc(var(--omega-chrome-bottom,72px) + 24px)}.om-cards{grid-template-columns:repeat(3,1fr)}}',
    /* ---- v2 skin (concept set 3): tonal depth, gold hairline, Cinzel, bracketed primary nav ----
       Additive. #om-ov selectors (1,1,0) beat the global a[href] (0,1,1) and [class*="card"] skins
       without !important, so behaviour rules above (owner gate, [hidden]) are untouched. */
    '#om-open{width:42px;height:42px;border-radius:12px;border-color:rgba(201,168,76,.42);background:linear-gradient(165deg,#2C2822,#1B1914);box-shadow:inset 0 1px 0 rgba(247,224,160,.14),0 4px 14px rgba(0,0,0,.4);color:#E2C86D}',
    '#om-open:hover{box-shadow:inset 0 1px 0 rgba(247,224,160,.22),0 0 18px rgba(201,168,76,.28)}',
    '#om-ov{background:radial-gradient(ellipse at 16% 0%,rgba(201,168,76,.11),transparent 46%),radial-gradient(ellipse at 92% 100%,rgba(93,175,181,.07),transparent 42%),linear-gradient(180deg,#07070C,#030306)}',
    '#om-inner{max-width:1040px}',
    '#om-ov #om-title{display:flex;align-items:center;justify-content:center;gap:16px;font-size:22px;letter-spacing:.22em;color:#E2C86D;margin:0 0 14px}',
    '#om-ov #om-title::before{content:"\u03A9";font-size:48px;line-height:1;letter-spacing:0;color:#F2D98A;text-shadow:0 0 24px rgba(226,200,109,.6),0 0 3px rgba(255,244,200,.8)}',
    '#om-ov #om-status{display:table;margin:0 auto 22px;padding:6px 18px;border:1px solid rgba(201,168,76,.32);border-radius:999px;background:rgba(201,168,76,.06)}',
    '#om-ov #om-status[hidden]{display:none}',
    '#om-ov #om-q{max-width:540px;border-radius:999px;padding:0 22px;border-color:rgba(201,168,76,.42);background:rgba(20,18,14,.72);box-shadow:inset 0 1px 0 rgba(247,224,160,.08)}',
    '#om-ov #om-close{width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center;border:1px solid rgba(201,168,76,.42);border-radius:12px;background:linear-gradient(165deg,#2C2822,#1B1914);color:#E2C86D;box-shadow:inset 0 1px 0 rgba(247,224,160,.14)}',
    '#om-primary{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:1000px;margin:0 auto 30px}',
    '#om-primary[hidden]{display:none}',
    '#om-ov a.om-pill{position:relative;display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;padding:0 18px;border:1px solid rgba(201,168,76,.32);border-radius:10px;background:linear-gradient(165deg,#2C2822,#1B1914);box-shadow:inset 0 1px 0 rgba(247,224,160,.12);color:#E2C86D;font:600 15px Rajdhani,sans-serif;letter-spacing:.08em;text-decoration:none;transition:border-color .2s,box-shadow .2s,transform .2s}',
    '#om-ov a.om-pill i{font-style:normal;opacity:.5;margin:0 7px}',
    '#om-ov a.om-pill:hover,#om-ov a.om-pill:focus-visible{border-color:rgba(226,200,109,.75);box-shadow:inset 0 1px 0 rgba(247,224,160,.2),0 0 18px rgba(201,168,76,.22);transform:translateY(-2px)}',
    '#om-ov a.om-pill[aria-current="page"]{border-color:rgba(226,200,109,.8);background:linear-gradient(165deg,#3B3424,#221E15);box-shadow:inset 3px 0 0 #E2C86D,inset 0 1px 0 rgba(247,224,160,.2)}',
    '#om-ov .om-grp h4{display:flex;align-items:center;gap:14px;font-family:"Cinzel Decorative",serif;font-size:13px;letter-spacing:.24em;color:#E2C86D;opacity:1;margin:0 0 12px}',
    '#om-ov .om-grp h4::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(201,168,76,.5),transparent)}',
    '#om-ov .om-cards{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important}',
    '#om-ov a.om-card{border-radius:12px!important;border:1px solid rgba(201,168,76,.34);background:linear-gradient(165deg,#2C2822,#1B1914);box-shadow:inset 0 1px 0 rgba(247,224,160,.14),0 6px 16px rgba(0,0,0,.35);transition:border-color .2s,box-shadow .2s,transform .2s}',
    '#om-ov a.om-card:hover,#om-ov a.om-card:focus-visible{border-color:rgba(226,200,109,.78);background:linear-gradient(165deg,#3B3424,#221E15);box-shadow:inset 0 1px 0 rgba(247,224,160,.22),0 0 22px rgba(201,168,76,.22),0 8px 22px rgba(0,0,0,.45);transform:translateY(-3px)}',
    '#om-ov a.om-chip{border-radius:10px;border:1px solid rgba(201,168,76,.28);background:linear-gradient(165deg,#2A2620,#1A1813);box-shadow:inset 0 1px 0 rgba(247,224,160,.1)}',
    '#om-ov a.om-chip:hover,#om-ov a.om-chip:focus-visible{border-color:rgba(226,200,109,.7);background:linear-gradient(165deg,#3B3424,#221E15)}',
    '@media (prefers-reduced-motion:reduce){#om-ov a.om-pill,#om-ov a.om-card{transition:none}#om-ov a.om-pill:hover,#om-ov a.om-card:hover{transform:none}}',
    '@media(max-width:760px){#om-ov #om-title{font-size:18px;gap:12px}#om-ov #om-title::before{font-size:38px}#om-primary{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px;margin-bottom:24px}#om-ov a.om-pill{justify-content:center;padding:0 8px;font-size:14px}#om-ov a.om-pill i{margin:0 4px}}',
    '@media(max-width:340px){.om-cards{grid-template-columns:repeat(2,1fr)}}'
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

  /* The platform's core destinations as a bracketed strip, the way the design sets its primary
     nav ([Dashboard] [Nodes] ...). Real pages only: each href is a file that exists, and the page
     the member is on is marked aria-current. Hidden while a search is active. */
  var PRIMARY = [['Dashboard', '/dashboard.html'], ['Matrix', '/matrix.html'], ['Factions', '/factions.html'],
    ['Governance', '/governance.html'], ['Security', '/security.html'], ['Settings', '/settings.html']];
  function primaryHtml() {
    var here = location.pathname.replace(/\/+$/, '') || '/';
    return '<nav id="om-primary" aria-label="Primary pages">' + PRIMARY.map(function (p) {
      var cur = here === p[1] ? ' aria-current="page"' : '';
      return '<a class="om-pill" href="' + p[1] + '"' + cur + '><i aria-hidden="true">[</i>' + p[0] + '<i aria-hidden="true">]</i></a>';
    }).join('') + '</nav>';
  }

  function build() {
    var btn = document.createElement('button'); btn.id = 'om-open'; btn.type = 'button'; btn.setAttribute('aria-label', 'All pages');
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    document.body.appendChild(btn);

    var ov = document.createElement('div'); ov.id = 'om-ov';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'All pages');
    var html = '<button id="om-close" aria-label="Close">\u00D7</button><div id="om-inner"><div id="om-title">SYD OMEGA 91717</div><div id="om-status" hidden></div>' +
      '<input id="om-q" type="search" placeholder="Search pages" aria-label="Search pages" autocomplete="off" spellcheck="false">' +
      primaryHtml();
    GROUPS.forEach(function (g) {
      var ownerCls = g[3] ? ' om-grp-owner' : '';
      html += '<div class="om-grp' + ownerCls + '"><h4>' + g[0] + '</h4><div class="om-cards">';
      g[2].forEach(function (p) {
        html += '<a class="om-card" href="' + p[2] + '"><span class="om-ic" data-glyph="' + p[0] + '" data-col="' + g[1] + '"></span><span>' + p[1] + '</span></a>';
      });
      html += '</div></div>';
    });
    html += '<p id="om-empty" hidden>No pages match.</p>' +
      '<div id="om-sec" hidden><h3>SECURITY</h3>' +
      '<p>Lost a device? Sign out every other device and stay signed in here.</p>' +
      '<div class="om-sec-row">' +
      '<button type="button" class="om-sec-btn" data-scope="others">SIGN OUT OTHER DEVICES</button>' +
      '<button type="button" class="om-sec-btn om-sec-danger" data-scope="global">SIGN OUT EVERYWHERE</button></div>' +
      '<div id="om-sec-confirm" role="group" aria-label="Confirm sign out" hidden><p id="om-sec-msg"></p>' +
      '<div class="om-sec-row"><button type="button" class="om-sec-btn om-sec-danger" id="om-sec-yes">CONFIRM</button>' +
      '<button type="button" class="om-sec-btn" id="om-sec-no">CANCEL</button></div></div>' +
      '<p id="om-sec-status" role="status" aria-live="polite"></p></div></div>';
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

    /* OmegaAxis.pages() shape: {key: slug, label, href (path, no hash), section: section KEY,
       sectionLabel, col, owner}. Group and title by sectionLabel. Merge every page nav.js can reach that the curated grid lacks. nav.js loads
       after this file, so this runs on open and retries until it has published. */
    /* Status line. Reads window.__omegaProfile (also delivered as omega:user-loaded's
       detail.profile). Text only, nothing guessed: with no profile the line stays hidden. */
    var st = ov.querySelector('#om-status');
    function paintStatus(p) {
      p = p || window.__omegaProfile;
      if (!p || typeof p !== 'object') { st.hidden = true; return; }
      var parts = [p.sign, p.element].filter(function (v) { return typeof v === 'string' && v; });
      st.textContent = '';
      if (typeof p.display_name === 'string' && p.display_name) { var b = document.createElement('b'); b.textContent = p.display_name; st.appendChild(b); }
      if (parts.length) st.appendChild(document.createTextNode((st.firstChild ? ' \u00B7 ' : '') + parts.join(' \u00B7 ')));
      if (p.is_owner === true) st.appendChild(document.createTextNode((st.firstChild ? ' \u00B7 ' : '') + 'OWNER'));
      st.hidden = !st.firstChild;
    }
    function paintSecurity() { sec.hidden = !(window.__omegaProfile && window.OmegaSB && typeof window.OmegaSB.get === 'function'); }
    window.addEventListener('omega:user-loaded', function (e) { paintStatus(e && e.detail && e.detail.profile); });

    /* SECURITY: sign out other devices / everywhere. The existing LOG OUT already calls
       signOut() whose default scope is 'global'; what was missing was 'others' (keep this
       device) and an explicit, confirmed everywhere. Uses the shared client OmegaSB.get()
       like nav.js does (a second client would be a different GoTrueClient on the same storage
       key). Supabase resolves {error} instead of throwing, so the result is checked before any
       success text is shown. Other devices keep working until their current access token
       expires: the copy says so rather than promising instant revocation. */
    var sec = ov.querySelector('#om-sec'), secConfirm = ov.querySelector('#om-sec-confirm'),
        secMsg = ov.querySelector('#om-sec-msg'), secStatus = ov.querySelector('#om-sec-status'),
        secYes = ov.querySelector('#om-sec-yes'), secNo = ov.querySelector('#om-sec-no'), secPending = null;
    var SEC_COPY = {
      others: {
        ask: 'Sign out every other device? This device stays signed in. Other devices lose access when their current session expires, typically within an hour.',
        ok: 'Other devices are signed out. This device stays signed in.'
      },
      global: {
        ask: 'Sign out of all devices, including this one? You will need to sign in again here. Other devices lose access when their current session expires, typically within an hour.',
        ok: 'Signed out of all devices. Returning to sign-in\u2026'
      }
    };
    function secBusy(b) { sec.querySelectorAll('button').forEach(function (x) { x.disabled = b; }); }
    function secReset() { secPending = null; secConfirm.hidden = true; secStatus.textContent = ''; secBusy(false); }
    sec.querySelectorAll('[data-scope]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        secPending = btn.getAttribute('data-scope');
        secMsg.textContent = SEC_COPY[secPending].ask; secStatus.textContent = '';
        secConfirm.hidden = false; secNo.focus();            // safe default: Cancel has focus
      });
    });
    secNo.addEventListener('click', function () { secPending = null; secConfirm.hidden = true; });
    secYes.addEventListener('click', function () {
      var scope = secPending; if (scope !== 'others' && scope !== 'global') return;
      if (!window.OmegaSB || typeof window.OmegaSB.get !== 'function') {
        secConfirm.hidden = true; secStatus.textContent = 'The sign-in service is not available on this page. Nothing was changed.'; return;
      }
      secBusy(true); secConfirm.hidden = true; secStatus.textContent = 'Working\u2026';
      Promise.resolve().then(function () { return window.OmegaSB.get(); })
        .then(function (sb) { return sb.auth.signOut({ scope: scope }); })
        .then(function (res) {
          if (res && res.error) throw res.error;
          secStatus.textContent = SEC_COPY[scope].ok;
          if (scope === 'global') setTimeout(function () { location.href = '/account.html'; }, 700);
          else { secPending = null; secBusy(false); }
        })
        .catch(function (e) {
          secStatus.textContent = 'Could not sign out: ' + (e && e.message ? e.message : 'unknown error') + '. Try again.';
          secBusy(false);
        });
    });

    var merged = false;
    function mergeNavPages() {
      if (merged || !window.OmegaAxis || typeof window.OmegaAxis.pages !== 'function') return;
      var have = {};
      GROUPS.forEach(function (g) { g[2].forEach(function (p) { have[p[2]] = 1; }); });
      var bySec = {}, order = [];
      window.OmegaAxis.pages().forEach(function (p) {
        if (!p || typeof p.href !== 'string' || p.href.charAt(0) !== '/' || p.href.charAt(1) === '/' || have[p.href]) return;
        have[p.href] = 1;
        var sk = p.sectionLabel || p.section;
        (bySec[sk] = bySec[sk] || (order.push(sk), [])).push(p);
      });
      var inner = ov.querySelector('#om-inner'), html = '';
      order.forEach(function (name) {
        html += '<div class="om-grp"><h4>' + esc(name) + '</h4><div class="om-chips">';
        bySec[name].forEach(function (p) {
          html += '<a class="om-chip' + (p.owner ? ' om-chip-owner' : '') + '" href="' + esc(p.href) + '" data-q="' + esc((p.label + ' ' + name).toLowerCase()) + '">' + esc(p.label) + '</a>';
        });
        html += '</div></div>';
      });
      if (!html) return;
      merged = true;
      var holder = document.createElement('div'); holder.innerHTML = html;
      while (holder.firstChild) inner.insertBefore(holder.firstChild, empty);
    }
    function filter() {
      var term = q.value.trim().toLowerCase(), shown = 0;
      ov.querySelectorAll('.om-grp').forEach(function (g) {
        var any = 0;
        g.querySelectorAll('.om-card,.om-chip').forEach(function (c) {
          var hit = !term || (c.getAttribute('data-q') || c.textContent).toLowerCase().indexOf(term) !== -1;
          c.hidden = !hit; if (hit) any++;
        });
        g.hidden = !any; shown += any;
      });
      empty.hidden = shown > 0;
      var strip = ov.querySelector('#om-primary'); if (strip) strip.hidden = !!term;
    }
    q.addEventListener('input', filter);
    q.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var first = ov.querySelector('.om-grp:not([hidden]) .om-card:not([hidden]),.om-grp:not([hidden]) .om-chip:not([hidden])');
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
      mergeNavPages();
      paintStatus();
      secReset(); paintSecurity();
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
