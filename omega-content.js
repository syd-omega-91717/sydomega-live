/* ============================================================================
   SYD OMEGA 91717 -- CONTENT MOTION PASS
   Brings the CONTENT of every page alive -- legibly. One global engine that:
     - counts numeric stats UP to their value on first view
     - staggers list rows / cards into view as you scroll (cinematic reveal)
     - gives tokens / nodes / tiles an element-tinted glow on hover
   Motion guides the eye; it never fights it. Respects reduced-motion, is
   idempotent, and touches only presentation (no data). Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaContent) return;
  window.__omegaContent = 1;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = [
    '@keyframes ocRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '.oc-hidden{opacity:0}',
    '.oc-rise{animation:ocRise .6s cubic-bezier(.2,.7,.2,1) both}',
    // gentle interactive glow for content tiles/tokens/nodes
    '[data-oc-glow],.token,.node,.tile,.mod,.nftcard,.tcard{transition:box-shadow .3s ease,transform .3s ease}',
    '[data-oc-glow]:hover,.token:hover,.node:hover,.tile:hover,.nftcard:hover,.tcard:hover{box-shadow:0 0 0 1px rgba(201,168,76,.35),0 0 26px -6px rgba(226,200,109,.5)}',
    '@keyframes omTitleGlow{0%,100%{text-shadow:0 0 8px rgba(201,168,76,.12)}50%{text-shadow:0 0 20px rgba(226,200,109,.42)}}',
    '.t,.brand,.sechead,.hero .nm,.topbar .t,h1{animation:omTitleGlow 5s ease-in-out infinite}',
    '@keyframes omEmblemSpin{to{transform:rotate(360deg)}}',
    '.sechead{position:relative}',
    '.sechead::before{content:"";display:inline-block;width:9px;height:9px;margin-right:9px;vertical-align:middle;border:1px solid var(--gold,#C9A84C);border-radius:50%;border-top-color:transparent;animation:omEmblemSpin 6s linear infinite;opacity:.7}',
    '@media(prefers-reduced-motion:reduce){.t,.brand,.sechead,h1{animation:none}.sechead::before{animation:none}}'
  ].join('');
  var st = document.createElement('style');
  st.id = 'omega-content-css';
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  if (REDUCED) return; // legibility first: no motion when the user asked for none

  /* ---- 1. count numeric stats UP when they scroll into view -------------- */
  function countUp(el) {
    if (el.__oc) return; el.__oc = 1;
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d\-]*)(-?[\d,]*\.?\d+)(.*)$/); // prefix, number, suffix
    if (!m) return;
    var pre = m[1], suf = m[3];
    var target = parseFloat(m[2].replace(/,/g, ''));
    if (!isFinite(target) || target === 0) return;
    var dec = (m[2].split('.')[1] || '').length;
    var grouped = m[2].indexOf(',') > -1;
    var dur = 900, t0 = null;
    function fmt(n) {
      var s = dec ? n.toFixed(dec) : Math.round(n).toString();
      if (grouped) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return pre + s + suf;
    }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }

  /* ---- 2. stagger content rows / cards into view ------------------------- */
  var STAGGER_SELECTORS = '.card,.tier,.node,.tile,.mod,.token,.nftcard,.tcard,.srow,.mrow,.krow,.qa,li.row';
  var NUM_SELECTORS = '[data-oc-count],.metric .val,.stat .val,.big,.figure,.count,.balance';

  function observe() {
    if (!('IntersectionObserver' in window)) return null;
    return new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        obs.unobserve(el);
        if (el.__isNum) { el.classList.remove('oc-hidden'); countUp(el); }
        else {
          // staggered rise based on position among its siblings
          var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
          el.style.animationDelay = Math.min(sibs * 55, 500) + 'ms';
          el.classList.remove('oc-hidden');
          el.classList.add('oc-rise');
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  }

  function enhance() {
    var io = observe();
    // numbers
    var nums = document.querySelectorAll(NUM_SELECTORS);
    for (var i = 0; i < nums.length; i++) {
      var n = nums[i];
      if (n.__ocSeen) continue; n.__ocSeen = 1;
      if (!/\d/.test(n.textContent)) continue;
      n.__isNum = true;
      if (io) { n.classList.add('oc-hidden'); io.observe(n); } else countUp(n);
    }
    // rows / cards
    var rows = document.querySelectorAll(STAGGER_SELECTORS);
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j];
      if (r.__ocSeen) continue; r.__ocSeen = 1;
      if (io) { r.classList.add('oc-hidden'); io.observe(r); }
    }
  }

  function boot() {
    enhance();
    // catch content injected later (RPC-rendered lists, tabs)
    try {
      var deb;
      new MutationObserver(function () {
        clearTimeout(deb); deb = setTimeout(enhance, 120);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
