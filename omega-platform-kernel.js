(function(){'use strict';
if(window.OmegaPlatformKernel)return;
var manifest=null,state={ready:false,assets:[],capabilities:[],proofGates:[],errors:[],checkedAt:null};
function emit(kind,payload){try{document.dispatchEvent(new CustomEvent('omega:kernel',{detail:{kind:kind,payload:payload,at:new Date().toISOString()}}));}catch(_){}}
async function load(){
  var r=await fetch('/omega-platform-manifest.json',{cache:'no-store'});
  if(!r.ok)throw new Error('manifest HTTP '+r.status);
  manifest=await r.json();
  if(!manifest||!/^1\\./.test(String(manifest.schema_version||'')))throw new Error('unsupported manifest');
}
async function probe(path){
  try{var r=await fetch(path,{method:'HEAD',cache:'no-store'});return{path:path,ok:r.ok,status:r.status};}
  catch(e){return{path:path,ok:false,status:0,error:String(e&&e.message||e)};}
}
async function check(){
  state.errors=[];
  try{await load();}catch(e){state.errors=[String(e&&e.message||e)];state.ready=false;state.checkedAt=new Date().toISOString();emit('error',snapshot());return snapshot();}
  var routes=Array.from(new Set(manifest.capabilities.map(function(x){return x.route;}).filter(Boolean)));
  state.assets=await Promise.all(routes.map(probe));
  state.capabilities=manifest.capabilities.map(function(x){
    var a=state.assets.find(function(y){return y.path===x.route;});
    return Object.assign({},x,{route_observed:!!a&&a.ok});
  });
  state.proofGates=(manifest.proof_gates||[]).map(function(x){return Object.assign({},x,{source_declared:!!x.source,evidence_declared:!!x.evidence});});
  state.ready=true;state.checkedAt=new Date().toISOString();emit('ready',snapshot());return snapshot();
}
function snapshot(){return{ready:state.ready,checkedAt:state.checkedAt,manifest:manifest,assets:state.assets.slice(),capabilities:state.capabilities.slice(),proofGates:state.proofGates.slice(),errors:state.errors.slice()};}
window.OmegaPlatformKernel={version:'1.1.0',check:check,snapshot:snapshot};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else check();
}());