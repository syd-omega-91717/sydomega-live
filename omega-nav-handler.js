/* omega-nav-handler.js — Global event delegation for navigation actions.
   Centralizes inline navigation patterns into data-nav-action="url" attributes.
   Also handles keyboard navigation (Enter/Space) on elements with data-nav-action.
   Loaded deferred by bg.js; guard: data-omega-navhandler. */
(function(){
  if(document.querySelector('script[data-omega-navhandler]')) return;
  document.addEventListener('click',function(e){
    var target=e.target.closest('[data-nav-action]');
    if(!target) return;
    var url=target.getAttribute('data-nav-action');
    if(url) location.href=url;
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter' && e.key!==' ') return;
    var target=e.target.closest('[data-nav-action]');
    if(!target) return;
    e.preventDefault();
    var url=target.getAttribute('data-nav-action');
    if(url) location.href=url;
  });
})();
