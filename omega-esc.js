/* omega-esc.js -- the one HTML escaper (window.OmegaEsc).

   WHY ONE. 98 root files each defined their own esc(): same intent, 98 chances to drift, and 4 pages that forgot to
   call it (FIXES_LOG 208-210). This is the single definition. scripts/esc-copy-ratchet.py stops a 99th copy.

   LOAD IT WITH A PLAIN <script src="/omega-esc.js"></script> BEFORE THE SCRIPT THAT USES IT -- like omega-ui.js. It is
   deliberately NOT injected by bg.js: bg.js injects after the page's own scripts have started, so a page that renders
   at init would find window.OmegaEsc missing, and bg.js is the platform's single point of failure.

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
