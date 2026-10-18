/* omega-nav-handler.js — Global event delegation for navigation actions.
   Centralizes inline navigation patterns into data-nav-action="url" attributes.
   Also handles keyboard navigation (Enter/Space) on elements with data-nav-action.
   Loaded deferred by bg.js; guard: data-omega-navhandler. */
(function(){
  /* The guard must not be the script's own tag: bg.js injects this file WITH
     data-omega-navhandler, so a querySelector guard always found itself and
     returned, and every data-nav-action element (46 dashboard KPI tiles) was
     dead from 2026-10-03 to 2026-10-18. */
  if(window.__omegaNavHandler) return;
  window.__omegaNavHandler = true;
  /* Only same-origin relative paths navigate (a leading single slash, e.g. the dashboard path).
     Absolute, protocol-relative ("//host") and scheme URLs (javascript:,
     data:, https://elsewhere) are refused, so a data-nav-action value can
     never become script execution or an off-site redirect. */
  function safeNavUrl(raw){
    var url=String(raw==null?'':raw).trim();
    if(url.charAt(0)!=='/'||url.charAt(1)==='/'||url.charAt(1)==='\\') return null;
    if(/[\u0000-\u001f\u007f\\]/.test(url)) return null;
    try{
      var u=new URL(url,location.origin);
      if(u.origin!==location.origin) return null;
      /* Rebuilt from re-encoded path segments, so nothing read from the DOM
         reaches location.href unescaped (CodeQL js/xss-through-dom). Every
         data-nav-action in the repo is a bare page path; query and hash are
         not carried. */
      return '/'+u.pathname.split('/').slice(1).map(function(s){
        try{ s=decodeURIComponent(s); }catch(_){}
        return encodeURIComponent(s);
      }).join('/');
    }catch(_){return null;}
  }
  document.addEventListener('click',function(e){
    var target=e.target.closest('[data-nav-action]');
    if(!target) return;
    var url=safeNavUrl(target.getAttribute('data-nav-action'));
    if(url) location.href=url;
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter' && e.key!==' ') return;
    var target=e.target.closest('[data-nav-action]');
    if(!target) return;
    e.preventDefault();
    var url=safeNavUrl(target.getAttribute('data-nav-action'));
    if(url) location.href=url;
  });
})();
