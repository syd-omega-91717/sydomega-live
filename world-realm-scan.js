/* Ω WORLD — manual route scan and realm focus lens.
   Reads the existing OmegaWorldEngine registry; it does not invent status. */
(function(){
  'use strict';
  if(window.OmegaWorldScanConsole)return;
  var root=document.getElementById('ow-realm-console');
  if(!root)return;
  var ids={
    state:document.getElementById('ow-realm-scan-state'),
    reachable:document.getElementById('ow-realm-reachable'),
    total:document.getElementById('ow-realm-total'),
    last:document.getElementById('ow-realm-last'),
    select:document.getElementById('ow-realm-select'),
    name:document.getElementById('ow-realm-name'),
    role:document.getElementById('ow-realm-role'),
    description:document.getElementById('ow-realm-description'),
    route:document.getElementById('ow-realm-route-state'),
    open:document.getElementById('ow-realm-open'),
    rescan:document.getElementById('ow-realm-rescan')
  };
  var engine=window.OmegaWorldEngine;
  var modules=engine&&Array.isArray(engine.modules)?engine.modules:[];
  var selected=modules[0]||null;
  var busy=false;
  function safeHref(value){
    if(typeof value!=='string'||value.charAt(0)!=='/'||value.slice(0,2)==='//')return '/dashboard.html';
    return value;
  }
  function stateOf(mod){
    if(!mod||!mod.routeState||mod.routeState==='CHECKING')return 'checking';
    if(mod.routeState==='LIVE')return 'reachable';
    if(mod.routeState==='UNAVAILABLE')return 'unavailable';
    return 'checking';
  }
  function setState(node,state,label){
    node.dataset.state=state;
    node.textContent=label;
  }
  function renderMetrics(){
    var reachable=modules.filter(function(m){return stateOf(m)==='reachable';}).length;
    var unavailable=modules.filter(function(m){return stateOf(m)==='unavailable';}).length;
    var checking=modules.length-reachable-unavailable;
    root.classList.toggle('is-scanning',busy||checking>0);
    root.setAttribute('aria-busy',busy||checking>0?'true':'false');
    ids.reachable.textContent=String(reachable);
    ids.total.textContent=String(modules.length);
    if(checking){
      setState(ids.state,'checking','SCANNING · '+checking+' PENDING');
    }else if(unavailable){
      setState(ids.state,'unavailable','PARTIAL REACHABILITY');
    }else{
      setState(ids.state,'reachable','ALL ROUTES REACHABLE');
    }
    var stamps=modules.map(function(m){return m.verifiedAt?Date.parse(m.verifiedAt):NaN;}).filter(Number.isFinite);
    if(stamps.length){
      var stamp=new Date(Math.max.apply(Math,stamps));
      ids.last.textContent=stamp.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'});
    }else ids.last.textContent='NOT YET RUN';
  }
  function renderFocus(){
    if(!selected)return;
    ids.name.textContent=selected.name||selected.id||'REALM';
    ids.role.textContent=selected.role||'PLATFORM REALM';
    ids.description.textContent=selected.purpose||'No description is registered for this realm.';
    var state=stateOf(selected);
    var label=state==='reachable'?'ROUTE REACHABLE'+(selected.httpStatus?' · HTTP '+selected.httpStatus:'')
      :state==='unavailable'?'ROUTE UNAVAILABLE'+(selected.httpStatus?' · HTTP '+selected.httpStatus:'')
      :'ROUTE CHECKING';
    setState(ids.route,state,label);
    ids.open.href=safeHref(selected.href);
    ids.open.textContent='OPEN '+String(selected.name||'REALM').toUpperCase()+' ↗';
    Array.prototype.forEach.call(document.querySelectorAll('.ow-node[data-module]'),function(node){
      var active=node.dataset.module===selected.id;
      node.classList.toggle('ow-realm-selected',active);
      if(active)node.setAttribute('aria-current','true');else node.removeAttribute('aria-current');
    });
  }
  function render(){
    renderMetrics();
    renderFocus();
  }
  function populate(){
    if(!ids.select||!modules.length)return;
    ids.select.textContent='';
    modules.forEach(function(mod){
      var option=document.createElement('option');
      option.value=mod.id;
      option.textContent=mod.name||mod.id;
      ids.select.appendChild(option);
    });
    selected=modules[0];
    ids.select.value=selected.id;
    render();
  }
  function choose(id){
    selected=modules.find(function(mod){return mod.id===id;})||selected;
    renderFocus();
  }
  async function scan(){
    if(busy)return;
    if(!engine||typeof engine.verify!=='function'){
      setState(ids.state,'unavailable','WORLD ENGINE UNAVAILABLE');
      return;
    }
    busy=true;
    root.classList.add('is-scanning');
    root.setAttribute('aria-busy','true');
    ids.rescan.disabled=true;
    ids.rescan.textContent='SCANNING REALMS…';
    setState(ids.state,'checking','SCANNING 18 REALMS');
    try{
      await engine.verify();
      render();
    }catch(error){
      setState(ids.state,'unavailable','SCAN FAILED · RETRY AVAILABLE');
      console.warn('[OmegaWorldScanConsole] route scan failed',error);
    }finally{
      busy=false;
      root.classList.remove('is-scanning');
      root.setAttribute('aria-busy','false');
      ids.rescan.disabled=false;
      ids.rescan.textContent='↻ RUN REALM SCAN';
      render();
    }
  }
  function init(){
    engine=window.OmegaWorldEngine;
    modules=engine&&Array.isArray(engine.modules)?engine.modules:[];
    if(!modules.length){
      setState(ids.state,'unavailable','WORLD REGISTRY UNAVAILABLE');
      ids.total.textContent='—';
      ids.reachable.textContent='—';
      return;
    }
    populate();
    ids.select.addEventListener('change',function(){choose(ids.select.value);});
    ids.rescan.addEventListener('click',scan);
    var directory=document.getElementById('omega-world-nodes');
    if(directory)directory.addEventListener('click',function(event){
      var node=event.target.closest('.ow-node[data-module]');
      if(!node)return;
      ids.select.value=node.dataset.module;
      choose(node.dataset.module);
    });
    /* The World engine starts its initial scan during DOMContentLoaded.
       Observe its existing registry briefly; do not launch a duplicate scan. */
    var attempts=0;
    var timer=window.setInterval(function(){
      attempts++;
      render();
      var pending=modules.some(function(mod){return stateOf(mod)==='checking';});
      if(!pending||attempts>=60)window.clearInterval(timer);
    },250);
  }
  window.OmegaWorldScanConsole={refresh:render,scan:scan};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();