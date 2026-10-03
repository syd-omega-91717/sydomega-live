/* Ω OBJECT RUNTIME — canonical, truth-safe read normalization. */
(function(){
  'use strict';
  if(window.OmegaObject)return;
  var VERSION='1.1.0';
  var ALLOWED=new Set(['LIVE','VERIFIED','CALCULATED','SOURCE','SIMULATED','STALE','UNAVAILABLE','UNKNOWN']);
  function truth(value,fallback){return ALLOWED.has(value)?value:(fallback||'UNKNOWN');}
  function normalize(input,meta){
    input=input&&typeof input==='object'?input:{};
    meta=meta&&typeof meta==='object'?meta:{};
    if(input.id==null||String(input.id).trim()==='')return null;
    var id=String(input.id), type=String(meta.type||input.type||'unknown');
    var obj={id:id,type:type,label:String(input.label||input.name||input.title||input.display_name||id),
      description:input.description==null?null:String(input.description),
      state:String(input.state||'READY'),truth:truth(input.truth,meta.truth||'UNKNOWN'),
      source:meta.source||input.source||'UNKNOWN',
      observedAt:meta.observedAt||input.observedAt||new Date().toISOString(),
      ownerId:input.ownerId||input.user_id||input.owner_id||null,
      organizationId:input.organizationId||input.organization_id||null,
      metadata:input.metadata&&typeof input.metadata==='object'?input.metadata:{},
      permissions:Array.isArray(input.permissions)?input.permissions:[],
      relations:Array.isArray(input.relations)?input.relations:[],
      actions:Array.isArray(input.actions)?input.actions:[],
      lineage:Array.isArray(input.lineage)?input.lineage:[],
      createdAt:input.createdAt||input.created_at||null,
      updatedAt:input.updatedAt||input.updated_at||null,runtimeVersion:VERSION};
    Object.defineProperty(obj,'__omegaReadOnly',{value:true,enumerable:false});
    return Object.freeze(obj);
  }
  function collection(rows,meta){return(Array.isArray(rows)?rows:[]).map(function(row){return normalize(row,meta);}).filter(Boolean);}
  function relation(from,to,type,source){if(from==null||to==null)return null;return Object.freeze({id:'omega-relation:'+String(from)+'>'+String(to)+':'+String(type||'RELATED_TO'),from:String(from),to:String(to),type:String(type||'RELATED_TO'),truth:'SOURCE',source:source||'UNKNOWN',observedAt:new Date().toISOString()});}
  window.OmegaObject={version:VERSION,normalize:normalize,collection:collection,relation:relation,truthStates:Array.from(ALLOWED)};
})();
