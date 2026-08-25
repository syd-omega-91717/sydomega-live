/* Ω command smoke tests — browser-console compatible */
(function(){'use strict';
 function assert(v,m){if(!v)throw new Error('Ω command test failed: '+m);}
 function run(){
  assert(window.OMEGA_COMMAND_CATALOG,'catalog missing');
  assert(window.OMEGA_COMMAND_CATALOG.count===99,'expected 99 commands');
  assert(window.OMEGA_COMMAND_ADAPTER,'adapter missing');
  ['/DECLINE','/INTERVIEWQ','/RETRO','/TLDR'].forEach(function(c){const r=window.OMEGA_COMMAND_ADAPTER.resolve(c);assert(r.ok,c+' unresolved');assert(r.requiresAuthorization===true,c+' authorization contract missing');});
  console.info('Ω command smoke tests: PASS');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
