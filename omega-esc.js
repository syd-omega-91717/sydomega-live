/* omega-esc.js -- the one HTML escaper (window.OmegaEsc).

   WHY ONE. 98 root files each defined their own esc(): same intent, 98 chances to drift, and 4 pages that forgot to
   call it (FIXES_LOG 208-210). This is the single definition. scripts/esc-copy-ratchet.py stops a 99th copy.

   PAGES: LOAD IT WITH A PLAIN <script src="/omega-esc.js"></script> BEFORE THE SCRIPT THAT USES IT -- like omega-ui.js.
   bg.js does NOT inject this file: an injected script runs in no fixed order, and bg.js itself can run after a page's
   own scripts have started.

   MODULES (root omega-*.js): look it up at CALL time, never bind it once at load --
       function esc(v) { return window.OmegaEsc ? OmegaEsc.esc(v) : ''; }
   Binding at load would lock in the blank fallback if the module ran first. To make the lookup always succeed, bg.js
   defines window.OmegaEsc itself, inline and synchronous, from a verbatim copy of the IIFE below (between the
   omega-esc-bootstrap markers). That is the one deliberate duplicate; scripts/tests/test_omega_esc.py executes both
   and fails on any difference in source or behaviour, so change this IIFE and the bg.js copy together. A module that a
   page loads with its own <script> tag can still run before bg.js, so that page also loads this file first (achieve,
   cosmos, invest, media).

   USE (the alias fails closed: if this file ever failed to load, the page shows blanks, never raw markup):
       const esc = (window.OmegaEsc && OmegaEsc.esc) || (() => '');

   WHAT EACH HELPER IS FOR
     esc(v)   text content AND double- or single-quoted attribute values. null/undefined -> ''. Escapes & < > " '.
     num(v)   a stored value that must be a number (amounts, counts). Anything non-finite -> fallback (default 0).
              String#toLocaleString ignores its arguments, so a string amount used to pass through verbatim.
     url(v)   a link target. Returns v only if it starts with http:// or https://, else ''. Always esc() it as well
              when it goes into an attribute: esc(url(u)).

   WHAT NONE OF THEM PROTECTS -- do not use them for these:
     - a value inside an inline event-handler attribute (onclick="f('<here>')"). The browser decodes &#39; back to '
       BEFORE it parses the handler, so no escaping is enough. Put the value in a data- attribute and read it from a
       delegated listener (signal.html, decisions.html, budget.html).
     - a value inside <script> or <style>, a CSS value, or a URL that is not http(s) (javascript:, data:).
     - an href/src that was not passed through url().
*/
(function () {
  'use strict';
  if (window.OmegaEsc) return;
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(v, fallback) {
    var n = Number(v);
    return isFinite(n) ? n : (fallback == null ? 0 : fallback);
  }
  function url(v) {
    v = String(v == null ? '' : v).trim();
    return /^https?:\/\//i.test(v) ? v : '';
  }
  window.OmegaEsc = Object.freeze({ esc: esc, num: num, url: url, version: 1 });
})();
