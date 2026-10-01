(function(){
'use strict';

var $=function(id){return document.getElementById(id);};
var checks=[];

function updateObjectGraph(){
  var graph=window.OmegaObjectGraph;
  var status=$('omega-graph-status');
  if(!graph||typeof graph.snapshot!=='function'){
    if(status)status.textContent='OBJECT GRAPH UNAVAILABLE';
    return;
  }
  var snap=graph.snapshot(), objs=snap.objects||[];
  var events=objs.filter(function(o){return o.type==='event';}).length;
  var truth={};
  objs.forEach(function(o){truth[o.truth]=(truth[o.truth]||0)+1;});
  var states=Object.keys(truth).map(function(k){return k+': '+truth[k];}).join(' · ')||'NONE';
  if($('og-objects'))$('og-objects').textContent=String(snap.counts.objects);
  if($('og-relations'))$('og-relations').textContent=String(snap.counts.relations);
  if($('og-events'))$('og-events').textContent=String(events);
  if($('og-truth'))$('og-truth').textContent=events?'SOURCE':'UNKNOWN';
  if(status)status.textContent='OBSERVED '+snap.observedAt+' · '+states;
}

function add(name,state,detail){
  checks.push({name:name,state:state,detail:detail});
}

function paint(){
  $('checks').innerHTML=checks.map(function(x){
    var c=x.state==='ok'?'ok':x.state==='warn'?'warn':'bad';
    return '<div class="row"><span>'+x.name+'</span><span class="status '+c+'">'+x.state.toUpperCase()+' · '+x.detail+'</span></div>';
  }).join('');
  $('progress').style.width=Math.round(checks.filter(function(x){return x.state==='ok';}).length/Math.max(1,checks.length)*100)+'%';
  $('proof').textContent=checks.map(function(x){return '['+x.state.toUpperCase()+'] '+x.name+' — '+x.detail;}).join('\n');
  $('snapshot').textContent=JSON.stringify({
    href:location.href,
    origin:location.origin,
    protocol:location.protocol,
    online:navigator.onLine,
    viewport:innerWidth+'×'+innerHeight,
    dpr:devicePixelRatio,
    language:navigator.language,
    userAgent:navigator.userAgent,
    storageKeys:Object.keys(localStorage).length
  },null,2);
}

async function probe(path){
  try{
    var response=await fetch(path,{cache:'no-store',credentials:'same-origin'});
    return {ok:response.ok,status:response.status};
  }catch(e){
    return {ok:false,status:0};
  }
}

async function run(){
  updateObjectGraph();
  checks=[];
  $('refresh').disabled=true;
  $('refresh').textContent='CHECKING…';
  $('m-runtime').textContent='READY';
  $('s-runtime').textContent=(navigator.hardwareConcurrency||'?')+' CPU threads · '+(navigator.deviceMemory||'?')+' GB memory hint';

  add('Secure context',isSecureContext?'ok':'warn',location.protocol);
  add('Browser online',navigator.onLine?'ok':'bad',navigator.onLine?'online':'offline');
  add(
    'Local storage',
    (function(){
      try{
        var key='__omega_probe__';
        localStorage.setItem(key,'1');
        localStorage.removeItem(key);
        return true;
      }catch(e){
        return false;
      }
    }())?'ok':'bad',
    localStorage.length+' keys'
  );

  var assets=['/manifest.json','/nav.js','/bg.js','/verify-deployment.html'];
  var results=await Promise.all(assets.map(probe));
  results.forEach(function(r,i){
    add('Asset '+assets[i],r.ok?'ok':'bad',r.ok?'HTTP '+r.status:'HTTP '+(r.status||'error'));
  });

  var sw='serviceWorker' in navigator;
  $('m-sw').textContent=sw?'AVAILABLE':'NONE';
  $('s-sw').textContent=sw?'API exposed':'Browser does not expose service workers';
  add('Service worker API',sw?'ok':'warn',sw?'available':'unavailable');

  var conn=navigator.connection;
  $('m-network').textContent=navigator.onLine?'ONLINE':'OFFLINE';
  $('s-network').textContent=conn?(conn.effectiveType||'unknown')+' · '+(conn.saveData?'save-data':'normal'):'connection hints unavailable';

  var hasSupabase=!!window.supabase;
  add('Supabase client global',hasSupabase?'ok':'warn',hasSupabase?'available on this page':'not exposed globally');

  $('m-storage').textContent=localStorage.length;
  $('s-storage').textContent='localStorage keys visible to this origin';
  $('m-runtime').textContent=checks.filter(function(x){return x.state==='ok';}).length+'/'+checks.length;
  $('stamp').textContent=new Date().toISOString();

  paint();
  $('refresh').disabled=false;
  $('refresh').textContent='RUN CHECK';
}

$('refresh').addEventListener('click',run);
window.addEventListener('online',run);
window.addEventListener('offline',run);
run();
}());
