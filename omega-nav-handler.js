/* omega-nav-handler.js — Global event delegation for navigation actions.
   Centralizes inline navigation patterns into data-nav-action="url" attributes.
   Also handles keyboard navigation (Enter/Space) on elements with data-nav-action.
   Loaded deferred by bg.js; guard: data-omega-navhandler. */
(function(){
  if(document.querySelector('script[data-omega-navhandler]')) return;
  /* Only same-origin relative paths navigate ("/page.html", "/x?y#z").
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
      return u.pathname+u.search+u.hash;
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
