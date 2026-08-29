/* Ω EVIDENCE ENGINE — client-side evidence ledger
 * Records verifiable runtime signals without asserting that a feature is
 * production-ready. Privileged persistence must be handled server-side.
 */
(function(global){
  'use strict';
  if(global.OmegaEvidence) return;
  var records=[];
  var MAX=250;
  function now(){return new Date().toISOString();}
  function add(signal){
    if(!signal || !signal.capability || !signal.kind) return null;
    var item={id:'ev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),capability:String(signal.capability),kind:String(signal.kind),value:signal.value===undefined?true:signal.value,source:signal.source||'runtime',timestamp:now()};
    records.unshift(item); if(records.length>MAX) records.length=MAX;
    try{document.dispatchEvent(new CustomEvent('omega:evidence',{detail:item}));}catch(e){}
    return item;
  }
  function list(capability){return records.filter(function(r){return !capability||r.capability===capability;}).slice();}
  function summary(capability){var rs=list(capability),out={signals:rs.length,verified:false,kinds:{}};rs.forEach(function(r){out.kinds[r.kind]=(out.kinds[r.kind]||0)+1;});out.verified=!!(out.kinds.test&&out.kinds.runtime&&out.kinds.deployment);return out;}
  global.OmegaEvidence=Object.freeze({record:add,list:list,summary:summary,version:'1.0.0'});
})(window);
