/* Ω WORLD ATLAS — governed civilization hierarchy. Data comes from the canonical atlas source registry. */
(function(){
'use strict';
var all=[],filter='ALL';
function kids(id){return all.filter(function(x){return x.parent===id;});}
function visible(x){return filter==='ALL'||x.state===filter;}
function renderScene(){
 var root=document.getElementById('wa-body-nodes');if(!root)return;root.replaceChildren();
 all.filter(function(x){return x.type==='PLANET';}).forEach(function(p,i){
  var a=document.createElement('button');a.type='button';a.className='wa-node';
  var angle=i/8*Math.PI*2;a.style.left=(50+Math.cos(angle)*40)+'%';a.style.top=(50+Math.sin(angle)*35)+'%';
  a.textContent=p.name;var s=document.createElement('small');s.textContent=p.state;a.appendChild(s);
  a.addEventListener('click',function(){inspect(p.id);});root.appendChild(a);
 });
}
function renderItem(x,level){
 if(!visible(x))return null;
 var wrap=document.createElement('div');wrap.className='wa-item level-'+Math.min(level,6);wrap.setAttribute('role','treeitem');
 var btn=document.createElement('button');btn.type='button';
 var label=document.createElement('span');label.textContent=x.name;
 var meta=document.createElement('span');meta.className='meta';meta.textContent=x.type+' · '+x.state;
 btn.appendChild(label);btn.appendChild(meta);btn.addEventListener('click',function(){inspect(x.id);});wrap.appendChild(btn);
 kids(x.id).filter(visible).forEach(function(k){var child=renderItem(k,level+1);if(child)wrap.appendChild(child);});
 return wrap;
}
function renderTree(){
 var root=document.getElementById('wa-tree');if(!root)return;root.replaceChildren();
 all.filter(function(x){return x.parent===null;}).forEach(function(x){var item=renderItem(x,0);if(item)root.appendChild(item);});
}
function inspect(id){
 var x=all.find(function(n){return n.id===id;});if(!x)return;
 var box=document.getElementById('wa-inspector');if(!box)return;box.replaceChildren();
 var tag=document.createElement('span');tag.className='tag';tag.textContent=x.type+' · '+x.state;
 var h=document.createElement('h3');h.textContent=x.name;var p=document.createElement('p');p.textContent=x.role;
 box.appendChild(tag);box.appendChild(h);box.appendChild(p);
 var list=document.createElement('ul');list.className='wa-list';
 [['PARENT',x.parent||'WORLD CORE'],['ROUTE',x.route||'MODEL / CONCEPT'],['MODULE',x.module||'—'],['CHILDREN',String(kids(x.id).length)]].forEach(function(pair){
  var li=document.createElement('li');var b=document.createElement('b');b.textContent=pair[0]+' ';li.appendChild(b);li.appendChild(document.createTextNode(pair[1]));list.appendChild(li);
 });
 box.appendChild(list);
 var note=document.createElement('p');
 note.textContent=x.type==='SERVICE'?'Production services must resolve to an existing canonical route and capability contract before being advertised as live.':x.type==='TASK'?'Tasks are simulation definitions until bound to persisted mission, authorization, event and evidence contracts.':'Child objects inherit no legal authority merely from their parent.';
 box.appendChild(note);
}
function setFilter(next){filter=next;document.querySelectorAll('.wa-controls button').forEach(function(b){b.classList.toggle('active',b.dataset.filter===next);});renderTree();}
async function boot(){
 try{
  var r=await fetch('/config/omega-civilization-atlas.json',{cache:'no-store'});
  if(!r.ok)throw new Error('atlas source unavailable: HTTP '+r.status);
  var data=await r.json();all=(data.bodies||[]).concat(data.objects||[]);
 }catch(e){
  var root=document.getElementById('wa-tree');if(root){root.textContent='ATLAS SOURCE UNAVAILABLE — no fallback state is fabricated.';}
  return;
 }
 renderScene();renderTree();document.querySelectorAll('.wa-controls button').forEach(function(b){b.addEventListener('click',function(){setFilter(b.dataset.filter);});});
 inspect('earth-world');
 document.getElementById('wa-planets').textContent=String(all.filter(function(x){return x.type==='PLANET';}).length);
 document.getElementById('wa-worlds').textContent=String(all.filter(function(x){return x.type==='WORLD';}).length);
 document.getElementById('wa-countries').textContent=String(all.filter(function(x){return x.type==='COUNTRY';}).length);
 document.getElementById('wa-empires').textContent=String(all.filter(function(x){return x.type==='EMPIRE';}).length);
 document.getElementById('wa-cities').textContent=String(all.filter(function(x){return x.type==='CITY';}).length);
 document.getElementById('wa-services').textContent=String(all.filter(function(x){return x.type==='SERVICE';}).length);
}
window.OmegaWorldAtlas={get nodes(){return all;},setFilter:setFilter,inspect:inspect};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();