/* ============================================================================
   SYD OMEGA 91717 -- FINANCE NOTICE ("not advice")

   One plain notice at the top of every page that talks about money, assets,
   tokens or investing.  The owner's compliance brief asks for "clear
   disclaimers separating entertainment/simulation from regulated financial or
   investment advice"; before this file none of those pages said so (a grep of
   investment.html, blockchain.html, wallet.html and treasury.html for advice,
   disclaim, simulat or hypothetical returned nothing).

   OPT-IN BY ONE SCRIPT TAG PER PAGE.  A page that should carry the notice loads
   this file; the module holds no page list, so it cannot drift from the pages.
   scripts/tests/test_finance_notice.py derives the expected set from nav.js's
   own page->section map (the "invest" section) plus the money pages named in
   the commerce contract, and fails if a page in that set lacks the tag.

   WHAT IT SAYS IS DELIBERATELY NARROW.  It states what the platform is not
   (a bank, broker, exchange or regulated financial service; a source of
   advice; an offer), and that scenarios are illustrations.  It does not say a
   feature is live or dormant, does not describe any figure as simulated or
   real, and names no jurisdiction: those facts change, and a notice that is
   wrong in one direction is worse than none.  THE WORDING IS NOT LEGAL ADVICE
   AND HAS NOT BEEN REVIEWED BY COUNSEL -- it is a floor, not a sign-off.

   PLACEMENT.  In the page's content column, inserted at its top (other platform
   modules add a hero and a workspace rail above it; the contract is that it comes
   before the page's first heading, not that it is the first child).  Never a third column of
   the flex-row shell, CLAUDE.md 4), in flow, so it is not a fixed bar and
   touches no bottom-anchored constant.  Not dismissible: a notice a visitor can
   close once and never see again is not a disclaimer.  English only, on
   purpose: no data-i18n key, so no translation pack can state it differently.
   Pure ASCII.
   ============================================================================ */
(function () {
  'use strict';
  if (window.OmegaFinanceNotice) return;

  var HEAD = 'NOT FINANCIAL ADVICE';
  var BODY = 'SYD Omega is a personal platform. It is not a bank, broker, exchange or regulated financial service, ' +
    'and nothing on this page is financial, investment, tax or legal advice or an offer to buy or sell anything. ' +
    'Scenarios, projections and scores are illustrations, not predictions or promises of return. ' +
    'Decisions about money are yours; speak to a qualified adviser first.';

  var CSS = '' +
    '.ofn{margin:0 0 16px;padding:11px 16px;border:1px solid var(--line,rgba(201,168,76,.22));' +
      'border-left:3px solid var(--gold,#C9A84C);border-radius:2px;background:rgba(5,5,11,.72);' +
      'font:14px/1.5 var(--R,Rajdhani,sans-serif);color:var(--ink-dim,#CBD5DC);max-width:min(100%,calc(100vw - 16px));box-sizing:border-box}' +
    '.ofn b{display:block;margin-bottom:3px;font:700 12px var(--M,"Courier Prime",monospace);letter-spacing:.16em;' +
      'color:var(--solar,#E2C86D)}';

  var state = { mounted: false, reason: 'not run' };

  function column() {
    var side = document.getElementById('omega-side');
    var cand = document.querySelector('main.main') || document.querySelector('main') || document.getElementById('app');
    if (cand && side && cand.contains(side)) {
      /* the element is the whole shell: use the column that follows the sidebar */
      var n = side.nextElementSibling;
      while (n && /^(SCRIPT|STYLE|LINK)$/.test(n.tagName)) n = n.nextElementSibling;
      cand = n && !n.contains(side) ? n : null;
    }
    return cand;
  }

  function mount() {
    if (document.getElementById('omega-finance-notice')) { state = { mounted: true, reason: 'already present' }; return true; }
    var host = column();
    if (!host) { state = { mounted: false, reason: 'no content column found' }; return false; }
    if (!document.getElementById('omega-finance-notice-css')) {
      var st = document.createElement('style');
      st.id = 'omega-finance-notice-css';
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    var box = document.createElement('aside');
    box.id = 'omega-finance-notice';
    box.className = 'ofn';
    box.setAttribute('role', 'note');
    box.setAttribute('aria-label', 'Financial notice');
    var h = document.createElement('b');
    h.textContent = HEAD;
    box.appendChild(h);
    box.appendChild(document.createTextNode(BODY));
    host.insertBefore(box, host.firstChild);
    state = { mounted: true, reason: 'mounted' };
    return true;
  }

  function run() { if (!mount()) setTimeout(mount, 800); }   /* nav.js can still be placing the sidebar on a slow page */

  window.OmegaFinanceNotice = { head: HEAD, body: BODY, state: function () { return state; }, mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
