/* Ω WORLD ATLAS — governed planetary/civilization hierarchy. Registry-backed; no fabricated fallback state. */
(function(){
'use strict';
var all=[],filter='ALL';
var FILTERS={ALL:function(){return true;},PRODUCTION:function(x){return x.state==='LIVE';},SIMULATION:function(x){return x.state==='SIMULATED';},SOURCE:function(x){return x.state==='SOURCE';}};
function kids(id){return all.filter(function(x){return x.parent===id;});}
function visible(x){return (FILTERS[filter]||FILTERS.ALL)(x);}
function nodeButton(x,className){
 var a=document.createElement('button');a.type='button';a.className=className||'wa-node';
 a.setAttribute('aria-label',x.name+' — '+x.state);a.addEventListener('click',function(){inspect(x.id);});
 var label=document.createElement('span');label.textContent=x.name;a.appendChild(label);
 var state=document.createElement('small');state.textContent=x.state;a.appendChild(state);
 return a;
}
function renderScene(){
 var root=document.getElementById('wa-body-nodes');if(!root)return;root.replaceChildren();
 var core=all.find(function(x){return x.type==='PLANETARY_CORE';});
 if(core){
  var c=nodeButton(core,'wa-node wa-core-node');c.style.left='50%';c.style.top='50%';root.appendChild(c);
 }
 var planets=all.filter(function(x){return x.type==='PLANET';});
 planets.forEach(function(p,i){
  var a=nodeButton(p,'wa-node');var angle=i/Math.max(planets.length,1)*Math.PI*2;
  a.style.left=(50+Math.cos(angle)*40)+'%';a.style.top=(50+Math.sin(angle)*35)+'%';root.appendChild(a);
 });
}
function renderItem(x,level){
 if(!visible(x))return null;
 var wrap=document.createElement('div');wrap.className='wa-item level-'+Math.min(level,8);wrap.setAttribute('role','treeitem');
 var btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-label',x.name+' — '+x.state);
 var label=document.createElement('span');label.textContent=x.name;
 var meta=document.createElement('span');meta.className='meta';meta.textContent=x.type+' · '+x.state;
 btn.appendChild(label);btn.appendChild(meta);btn.addEventListener('click',function(){inspect(x.id);});wrap.appendChild(btn);
 kids(x.id).filter(visible).forEach(function(k){var child=renderItem(k,level+1);if(child)wrap.appendChild(child);});
 return wrap;
}
function renderTree(){
 var root=document.getElementById('wa-tree');if(!root)return;root.replaceChildren();
 all.filter(function(x){return x.parent===null;}).filter(visible).forEach(function(x){var item=renderItem(x,0);if(item)root.appendChild(item);});
}
function addField(list,label,value){
 var li=document.createElement('li'),b=document.createElement('b');b.textContent=label+' ';li.appendChild(b);li.appendChild(document.createTextNode(value==null||value===''?'—':String(value)));list.appendChild(li);
}
function inspect(id){
 var x=all.find(function(n){return n.id===id;});if(!x)return;
 var box=document.getElementById('wa-inspector');if(!box)return;box.replaceChildren();
 var tag=document.createElement('span');tag.className='tag';tag.textContent=x.type+' · '+x.state;
 var h=document.createElement('h3');h.textContent=x.name;
 var p=document.createElement('p');p.textContent=x.role||'Registry object.';
 box.appendChild(tag);box.appendChild(h);box.appendChild(p);
 var list=document.createElement('ul');list.className='wa-list';
 addField(list,'PARENT',x.parent||'WORLD CORE');addField(list,'ROUTE',x.route||'MODEL / CONCEPT');addField(list,'MODULE',x.module||'—');
 addField(list,'LIFECYCLE',x.lifecycle||'—');addField(list,'PROVENANCE',x.provenance||'—');addField(list,'CHILDREN',kids(x.id).length);
 if(x.contract){addField(list,'CAPABILITY',x.contract.capability);addField(list,'AUTHORIZATION',x.contract.authorization);addField(list,'EVENT',x.contract.event);addField(list,'EVIDENCE',x.contract.evidence);}
 box.appendChild(list);
 var note=document.createElement('p');
 note.textContent=x.type==='SERVICE'?'A service is production only when its capability, authorization, authoritative data, event and evidence contracts are verified.':x.type==='TASK'?'A task is executable only through the canonical mission/action path; this registry never grants client authority.':x.type==='CITY'?'City state is simulation unless authoritative production data and legal/product authorization exist.':'Child objects inherit no legal authority merely from their parent.';
 box.appendChild(note);
}
function setFilter(next){filter=FILTERS[next]?next:'ALL';document.querySelectorAll('.wa-controls button').forEach(function(b){b.classList.toggle('active',b.dataset.filter===filter);});renderTree();renderScene();}
function setCount(id,predicate){var el=document.getElementById(id);if(el)el.textContent=String(all.filter(predicate).length);}
async function boot(){
 try{
  var r=await fetch('/config/omega-civilization-atlas.json',{cache:'no-store'});
  if(!r.ok)throw new Error('atlas source unavailable: HTTP '+r.status);
  var data=await r.json();
  all=(data.bodies||[]).concat(data.objects||[]);
  if(!Array.isArray(all)||!all.length)throw new Error('atlas source empty');
 }catch(e){
  var root=document.getElementById('wa-tree');if(root)root.textContent='ATLAS SOURCE UNAVAILABLE — no fallback state is fabricated.';
  return;
 }
 renderScene();renderTree();
 document.querySelectorAll('.wa-controls button').forEach(function(b){b.addEventListener('click',function(){setFilter(b.dataset.filter);});});
 inspect('earth-world');
 setCount('wa-planets',function(x){return x.type==='PLANET'||x.type==='PLANETARY_CORE';});
 setCount('wa-worlds',function(x){return x.type==='WORLD';});
 setCount('wa-countries',function(x){return x.type==='COUNTRY';});
 setCount('wa-empires',function(x){return x.type==='EMPIRE'||x.type==='FACTION';});
 setCount('wa-cities',function(x){return x.type==='CITY';});
 setCount('wa-services',function(x){return x.type==='SERVICE';});
}
window.OmegaWorldAtlas={get nodes(){return all;},setFilter:setFilter,inspect:inspect};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();