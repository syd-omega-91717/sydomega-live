/* omega-function-handler.js — Global event delegation for page-level function calls.
   Centralizes inline function call patterns into data-function-call="functionName" attributes.
   Function must be defined at window level (window.functionName).
   Functions receive the clicked element as a parameter for reading data attributes.
   Loaded deferred by bg.js; guard: data-omega-functionhandler. */
(function(){
  if(document.querySelector('script[data-omega-functionhandler]')) return;
  document.addEventListener('click',function(e){
    var target=e.target.closest('[data-function-call]');
    if(!target) return;
    var fn=target.getAttribute('data-function-call');
    if(fn && typeof window[fn]==='function') window[fn](target);
  });
})();
