/* Ω CAPABILITY PROVENANCE — evidence-first module inspection */
(function(){'use strict';
if(window.OmegaCapabilityProvenance)return;
var REALITY={LIVE:'LIVE',CALCULATED:'CALCULATED',SIMULATED:'SIMULATED',USER_CREATED:'USER-CREATED',LORE:'LORE',UNAVAILABLE:'UNAVAILABLE'};
function text(v){return String(v==null?'':v);}
function node(tag,cls,value){var n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=text(value);return n;}
function row(label,value,state){var r=node('div','ocp-row');r.appendChild(node('span','ocp-label',label));var v=node('span','ocp-value',value);if(state)v.dataset.state=state;r.appendChild(v);return r;}
function getModules(){return window.OmegaWorldEngine&&Array.isArray(window.OmegaWorldEngine.modules)?window.OmegaWorldEngine.modules:[];}
function render(m,routeState,checkedAt){
 var root=document.getElementById('omega-capability-provenance');if(!root)return;
 root.textContent='';
 var head=node('div','ocp-head');var title=node('div','ocp-title','CAPABILITY PROVENANCE');
 var badge=node('span','ocp-badge',routeState||REALITY.UNAVAILABLE);badge.dataset.state=routeState||REALITY.UNAVAILABLE;
 head.appendChild(title);head.appendChild(badge);root.appendChild(head);
 root.appendChild(node('p','ocp-lede','Select any World node to inspect what is known, what is measured, and what remains unverified. This panel never upgrades route reachability into proof of business correctness.'));
 if(!m){root.appendChild(row('Selection','No module selected',REALITY.UNAVAILABLE));return;}
 var grid=node('div','ocp-grid');
 grid.appendChild(row('Module',m.name));grid.appendChild(row('Purpose',m.purpose));grid.appendChild(row('Role',m.role));
 grid.appendChild(row('Route',m.href));grid.appendChild(row('Route evidence',routeState||REALITY.UNAVAILABLE,routeState||REALITY.UNAVAILABLE));
 grid.appendChild(row('Evidence source','Deployed route HEAD check',REALITY.LIVE));grid.appendChild(row('Freshness',checkedAt||'Not checked',checkedAt?REALITY.LIVE:REALITY.UNAVAILABLE));
 grid.appendChild(row('Authorization','Not verified by World route check',REALITY.UNAVAILABLE));
 grid.appendChild(row('Database health','Not verified by World route check',REALITY.UNAVAILABLE));
 grid.appendChild(row('Business correctness','Not verified by World route check',REALITY.UNAVAILABLE));
 root.appendChild(grid);
 var boundary=node('div','ocp-boundary');boundary.appendChild(node('strong',null,'Evidence boundary: '));
 boundary.appendChild(document.createTextNode('LIVE means only that the route responded acceptably. Authentication, persistence, authorization, payments, achievements and business rules require their own contracts.'));
 root.appendChild(boundary);
}
function bind(){
 var selected=null,checkedAt=null;
 function refresh(m,state){selected=m||selected;render(selected,state||REALITY.UNAVAILABLE,checkedAt);}
 function scan(){
  var nodes=[].slice.call(document.querySelectorAll('.ow-node'));checkedAt=new Date().toISOString();
  nodes.forEach(function(n){n.addEventListener('click',function(){var id=n.dataset.module;selected=getModules().find(function(m){return m.id===id;});var live=n.querySelector('.ow-live');refresh(selected,live&&live.dataset.state);});});
  var first=nodes[0];if(first){var id=first.dataset.module;selected=getModules().find(function(m){return m.id===id;});var live=first.querySelector('.ow-live');render(selected,live&&live.dataset.state||REALITY.UNAVAILABLE,checkedAt);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
 window.OmegaCapabilityProvenance={render:render,refresh:refresh};
}
bind();
})();