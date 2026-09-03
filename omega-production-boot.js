/* SYD OMEGA 91717 — production boot
 * Loads the shared experience shell once, from same-origin repository assets.
 */
(function(){'use strict';
  if(window.__OMEGA_PRODUCTION_BOOT__) return;
  window.__OMEGA_PRODUCTION_BOOT__=true;
  function load(){
    if(document.querySelector('script[data-omega-production-shell]')) return;
    var s=document.createElement('script');
    s.src='/omega-production-shell.js';
    s.async=true;
    s.dataset.omegaProductionShell='true';
    s.onerror=function(){document.documentElement.dataset.omegaShellError='true';};
    (document.head||document.documentElement).appendChild(s);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true}); else load();
})();
