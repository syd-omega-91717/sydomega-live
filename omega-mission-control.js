/* Ω MISSION CONTROL — sovereign operational surface */
(function(){
'use strict';
if(window.__omegaMissionControl)return; window.__omegaMissionControl=true;
function boot(){
 if(document.getElementById('omega-mission-control'))return;
 var root=document.createElement('aside');root.id='omega-mission-control';root.className='omega-mc';root.hidden=true;
 root.innerHTML='<div class="omega-mc-backdrop"></div><section class="omega-mc-panel" role="dialog" aria-modal="true" aria-label="Omega Mission Control"><header><div><span class="omega-mc-eyebrow">Ω SOVEREIGN OPERATIONS</span><h2>Mission Control</h2></div><button data-close aria-label="Close">×</button></header><div class="omega-mc-core"><img src="/assets/omega/sovereign-core.svg" alt="Omega sovereign core visualization"><div class="omega-mc-readout"><b>LIVE RUNTIME</b><span data-state>INITIALIZING</span></div></div><div class="omega-mc-grid"><article><b>CAPABILITIES</b><strong data-cap>—</strong><small>runtime evidence</small></article><article><b>COMMANDS</b><strong data-cmd>99</strong><small>registered intents</small></article><article><b>EVIDENCE</b><strong data-ev>—</strong><small>observations</small></article><article><b>HEALTH</b><strong data-health>ONLINE</strong><small>client telemetry</small></article></div><div class="omega-mc-actions"><button data-open-command>Open Ω Command</button><button data-copy>Copy runtime snapshot</button></div><footer><span>NO PRIVILEGED ACTIONS FROM UI</span><span data-time>—</span></footer></section>';
 document.body.appendChild(root);
 function sync(){
  var ev=window.OmegaEvidence; var sum=ev&&ev.summary?ev.summary():null;
  root.querySelector('[data-cap]').textContent=sum?sum.capabilities:'—'; root.querySelector('[data-ev]').textContent=sum?sum.records:'—';
  root.querySelector('[data-state]').textContent=window.OmegaOS?'OPERATIONAL':'DEGRADED'; root.querySelector('[data-time]').textContent=new Date().toLocaleTimeString();
 }
 function open(){root.hidden=false;sync();}
 function close(){root.hidden=true;}
 document.addEventListener('omega:mission_control',open); root.querySelector('[data-close]').onclick=close;root.querySelector('.omega-mc-backdrop').onclick=close;
 root.querySelector('[data-open-command]').onclick=function(){close();document.dispatchEvent(new CustomEvent('omega:command_request',{detail:{source:'mission-control'}}));};
 root.querySelector('[data-copy]').onclick=function(){var ev=window.OmegaEvidence;var snap={product:'SYD OMEGA 91717',surface:'Mission Control',time:new Date().toISOString(),evidence:ev&&ev.summary?ev.summary():null};navigator.clipboard&&navigator.clipboard.writeText(JSON.stringify(snap,null,2));};
 document.addEventListener('omega:command',sync); document.addEventListener('omega:evidence',sync); setInterval(function(){if(!root.hidden)sync();},5000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
