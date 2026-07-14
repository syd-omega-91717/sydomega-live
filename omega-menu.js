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
      ['\u25B2', 'Ascend', '/ascension.html'],
      ['\u2605', 'Honors', '/honors.html'],
      ['\u2666', 'Achievements', '/achievements.html'],
      ['\u2637', 'Gates', '/gates.html'],
      ['\u2609', 'Elements', '/elements.html'],
      ['\u25B3', 'Exam Hall', '/exam.html'],
      ['\u2726', 'Sovereign Points', '/points.html']
    ]],
    ['CORE', '#00E5FF', [
      ['\u2302', 'Dashboard', '/dashboard.html'],
      ['\u25C6', 'Identity', '/identity.html'],
      ['\u2609', 'Cosmos', '/cosmos.html'],
      ['\u25CE', 'Matrix', '/matrix.html'],
      ['\u264D', 'Horoscope', '/horoscope.html'],
      ['\u2721', 'Pantheons', '/pantheons.html'],
      ['\u2694', 'Factions', '/factions.html'],
      ['\u2604', 'Triads', '/triads.html'],
      ['\u25C7', 'Character', '/character.html'],
      ['\u2691', 'Beacon', '/beacon.html'],
      ['\u2600', 'Agents', '/agents.html']
    ]],
    ['EXPERIENCE', '#9B6BF0', [
      ['\u2726', 'Academy', '/academy.html'],
      ['\u25B6', 'Games', '/gaming.html'],
      ['\u2638', 'Universe', '/media.html'],
      ['\u25C9', 'Cinema', '/media.html'],
      ['\u25A3', 'Media', '/media.html'],
      ['\u2b21', 'Sigil Vault', '/vault.html#nft']
    ]],
    ['ASSETS', '#C9A84C', [
      ['\u03A9', 'Vault', '/vault.html'],
      ['\u25C8', 'Treasury', '/vault.html#reserve'],
      ['\u2263', 'Ledger', '/ledger.html'],
      ['\u25D0', 'Wallet', '/vault.html#wallet'],
      ['\u25C7', 'Portfolio', '/portfolio.html'],
      ['\u2318', 'Blockchain', '/blockchain.html'],
      ['\u25C8', 'Income', '/income.html'],
      ['\u2740', 'Payments', '/payments.html'],
      ['\u25B3', 'Subscriptions', '/subscriptions.html']
    ]],
    ['THE ORDER', '#8B0000', [
      ['\u2318', 'Family', '/family.html'],
      ['\u265A', 'Kings', '/kings.html'],
      ['\u2691', 'Hall', '/hall.html'],
      ['\u2605', 'Trophies', '/trophies.html'],
      ['\u25A6', 'City', '/city.html'],
      ['\u2693', 'Bloodline', '/bloodline.html'],
      ['\u26EA', 'Heritage', '/heritage.html'],
      ['\u265B', 'Sovereigns', '/sovereigns.html'],
      ['\u2696', 'Charter', '/charter.html'],
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
      ['\u2b21', 'Grid', '/grid.html']
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
      ['\u25C6', 'Passport', '/passport.html'],
      ['\u2713', 'KYC', '/kyc.html']
    ]]
  ];

  var css = [
    '#om-open{position:fixed;top:10px;left:12px;z-index:9000;height:34px;width:38px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(201,168,76,.28);background:rgba(10,10,15,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#C9A84C;border-radius:10px;cursor:pointer}',
    '#om-open:hover{border-color:rgba(201,168,76,.6);color:#E2C86D}',
    '#om-open svg{width:18px;height:18px}',
    '#om-ov{position:fixed;inset:0;z-index:9600;background:radial-gradient(ellipse at 50% 30%,rgba(13,13,22,.97),rgba(2,2,6,.98));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:none;overflow-y:auto;padding:64px 18px 40px}',
    '#om-ov.open{display:block}',
    '#om-close{position:fixed;top:14px;right:16px;font-size:26px;color:#C9A84C;cursor:pointer;line-height:1;background:none;border:0}',
    '#om-inner{max-width:920px;margin:0 auto}',
    '#om-title{text-align:center;font-family:"Cinzel Decorative",serif;color:#C9A84C;letter-spacing:3px;font-size:18px;margin:0 0 24px}',
    '.om-grp{margin:0 0 22px}',
    '.om-grp h4{font-family:"Courier Prime",monospace;color:#00E5FF;font-size:11px;letter-spacing:3px;margin:0 0 10px;opacity:.85}',
    '.om-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}',
    '.om-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px;border:1px solid rgba(201,168,76,.22);background:rgba(255,255,255,.02);border-radius:12px;color:#d8d5cb;text-decoration:none;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:1px;transition:all .2s}',
    '.om-card:hover{border-color:rgba(201,168,76,.6);background:rgba(201,168,76,.08);color:#E2C86D;transform:translateY(-2px)}',
    '.om-ic{width:40px;height:40px;display:inline-block}',
    '.om-card:hover .om-ic{filter:brightness(1.3)}',
    '@media(max-width:760px){#om-ov{padding-top:58px}.om-cards{grid-template-columns:repeat(3,1fr)}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'om-css'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function fillIcons(root) {
    var els = root.querySelectorAll('.om-ic');
    function fill() {
      if (!window.OmegaEmblem) return false;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.__filled) continue;
        el.innerHTML = window.OmegaEmblem.ring(el.getAttribute('data-glyph'), el.getAttribute('data-col'), {});
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
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
    document.body.appendChild(btn);

    var ov = document.createElement('div'); ov.id = 'om-ov';
    var html = '<button id="om-close" aria-label="Close">\u00D7</button><div id="om-inner"><div id="om-title">SYD OMEGA 91717</div>';
    GROUPS.forEach(function (g) {
      html += '<div class="om-grp"><h4>' + g[0] + '</h4><div class="om-cards">';
      g[2].forEach(function (p) {
        html += '<a class="om-card" href="' + p[2] + '"><span class="om-ic" data-glyph="' + p[0] + '" data-col="' + g[1] + '"></span><span>' + p[1] + '</span></a>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    ov.innerHTML = html;
    fillIcons(ov);
    document.body.appendChild(ov);

    btn.onclick = function () { ov.classList.add('open'); };
    ov.querySelector('#om-close').onclick = function () { ov.classList.remove('open'); };
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.classList.remove('open'); });
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
