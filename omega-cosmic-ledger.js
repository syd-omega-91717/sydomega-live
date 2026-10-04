/* Ω COSMIC LEDGER — governed concept data; no fake live telemetry. */
(function(){
'use strict';
var bodies=[
{id:'sun',name:'SOLAR CORE',state:'LORE / VISUAL',role:'Central Ω identity and energy metaphor.',note:'Conceptual center only. No physical energy system is implied.'},
{id:'mercury',name:'MERCURY',state:'LORE / VISUAL',role:'Speed, communication and execution motif.',note:'Use as narrative language for fast information flow, not orbital infrastructure.'},
{id:'venus',name:'VENUS',state:'LORE / VISUAL',role:'Aesthetic, culture and creative expression motif.',note:'Connects to media, design and identity experiences.'},
{id:'earth',name:'EARTH',state:'PRODUCTION WORLD',role:'The actual user and service environment.',note:'This is the only planetary body in the scene representing the current physical operating context.'},
{id:'mars',name:'MARS LEDGER',state:'LORE / R&D',role:'Continuity, archival and resilient-ledger metaphor.',note:'Production mapping: backups, evidence, replication and disaster recovery.'},
{id:'jupiter',name:'JUPITER',state:'R&D',role:'Scale, capacity and hyperscale-system motif.',note:'Production mapping: load testing, capacity planning and horizontal scaling.'},
{id:'saturn',name:'SATURN',state:'R&D',role:'Boundaries, rings, governance and containment motif.',note:'Production mapping: policy boundaries, tenancy and governance controls.'},
{id:'uranus',name:'URANUS',state:'R&D',role:'Architectural change and unconventional infrastructure motif.',note:'Production mapping: controlled experimentation and architecture evolution.'},
{id:'neptune',name:'NEPTUNE',state:'R&D',role:'Deep-network, unknowns and frontier-research motif.',note:'Production mapping: resilience research, provider failover and future systems.'}
];
function detail(b){
 var n=document.getElementById('cosmic-ledger-detail');if(!n)return;
 n.textContent='';
 var h=document.createElement('strong');h.textContent=b.name;
 var r=document.createElement('span');r.textContent=b.role;
 var note=document.createElement('span');note.textContent=b.note;
 var state=document.createElement('span');state.textContent=' '+b.state;state.style.color='#e8c97a';
 n.appendChild(h);n.appendChild(document.createElement('br'));n.appendChild(r);
 n.appendChild(document.createElement('br'));n.appendChild(note);n.appendChild(state);
}
function boot(){
 var grid=document.getElementById('cosmic-ledger-cards');if(grid)grid.textContent='';
 bodies.forEach(function(b){
  var p=document.querySelector('[data-body="'+b.id+'"]');if(p)p.addEventListener('click',function(){detail(b);});
  if(grid){
   var c=document.createElement('article');c.className='cl-card';
   var h=document.createElement('h3');h.textContent=b.name;
   var d=document.createElement('p');d.textContent=b.role+' '+b.note;
   var s=document.createElement('span');s.className='cl-state';s.textContent=b.state;
   c.appendChild(h);c.appendChild(d);c.appendChild(s);grid.appendChild(c);
  }
 });
 var sun=document.querySelector('.cl-sun');if(sun)sun.addEventListener('click',function(){detail(bodies[0]);});
 detail(bodies[3]);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.OmegaCosmicLedger={bodies:bodies};
})();