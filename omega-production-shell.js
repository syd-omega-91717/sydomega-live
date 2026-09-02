/* SYD OMEGA 91717 — Production Experience Shell
 * Safe, framework-free runtime layer for the existing page estate.
 * No data mutation. No secrets. Respects reduced motion.
 */
(function () {
  'use strict';
  if (window.__OMEGA_PRODUCTION_SHELL__) return;
  window.__OMEGA_PRODUCTION_SHELL__ = true;

  var root = document.documentElement;
  var body = document.body;
  if (!body) return;

  var path = location.pathname.split('/').pop() || 'index.html';
  var key = path.replace(new RegExp('\\.html?$', 'i'), '').toLowerCase() || 'home';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.dataset.omegaPage = key;
  root.dataset.omegaMotion = reduced ? 'reduced' : 'full';
  body.classList.add('omega-production-shell');

  var style = document.createElement('style');
  style.id = 'omega-production-shell-style';
  style.textContent = '\n'
    + '.omega-production-shell{background:#0a0a0f;}\n'
    + '.omega-production-shell::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:9990;background:radial-gradient(circle at 50% -10%,rgba(201,168,76,.08),transparent 42%);}\n'
    + '.omega-shell-emblem{position:fixed;right:18px;bottom:18px;z-index:9999;width:46px;height:46px;border:1px solid rgba(201,168,76,.55);border-radius:50%;display:grid;place-items:center;background:rgba(10,10,15,.78);backdrop-filter:blur(10px);box-shadow:0 0 28px rgba(201,168,76,.12);font:600 12px system-ui;color:#c9a84c;text-decoration:none;}\n'
    + '.omega-shell-emblem:hover{transform:scale(1.06);}\n'
    + '@media(prefers-reduced-motion:no-preference){.omega-shell-emblem{animation:omega-breathe 4s ease-in-out infinite;}@keyframes omega-breathe{0%,100%{box-shadow:0 0 20px rgba(201,168,76,.08)}50%{box-shadow:0 0 34px rgba(201,168,76,.22)}}}\n'
    + '@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}\n';
  document.head.appendChild(style);

  if (!document.querySelector('[data-omega-shell-emblem]')) {
    var link = document.createElement('a');
    link.className = 'omega-shell-emblem';
    link.dataset.omegaShellEmblem = 'true';
    link.href = '/';
    link.setAttribute('aria-label', 'SYD OMEGA home');
    link.title = 'SYD OMEGA 91717';
    link.textContent = 'Ω';
    body.appendChild(link);
  }

  window.OmegaProductionShell = {
    version: '1.0.0',
    page: key,
    reducedMotion: reduced,
    ready: true
  };
})();
