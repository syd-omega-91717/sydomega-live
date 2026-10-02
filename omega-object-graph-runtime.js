/* Ω OBJECT GRAPH RUNTIME — canonical read-side graph facade.
   It does not invent data, authorize writes, or replace Supabase/RLS.
   Existing surfaces can feed rows/events into one normalized graph and
   subscribe to changes without creating a second state model. */
(function(){
  'use strict';
  if(window.OmegaObjectGraph)return;
  var VERSION='1.0.0', objects=new Map(), relations=new Map(), listeners=[];
  var TYPES=new Set(['member','mission','achievement','gate','holding','transaction','document','course','lesson','post','media','agent','conversation','project','event','credential','asset','capability']);
  function emit(kind,payload){var detail={kind:kind,version:VERSION,payload:payload,at:new Date().toISOString()};listeners.slice().forEach(function(fn){try{fn(detail);}catch(e){}});try{document.dispatchEvent(new CustomEvent('omega:object-graph',{detail:detail}));}catch(e){}}
  function assertRuntime(){if(!window.OmegaObject)throw new Error('OmegaObject runtime is required');}
  function put(row,meta){
    assertRuntime(); meta=meta||{};
    var type=String(meta.type||row&&row.type||'');
    if(!TYPES.has(type))return null;
    if(!row||row.id==null)return null;
    var obj=window.OmegaObject.normalize(row,Object.assign({},meta,{type:type}));
    objects.set(obj.type+':'+obj.id,obj); emit('object:upserted',obj); return obj;
  }
  function putMany(rows,meta){return(Array.isArray(rows)?rows:[]).map(function(r){return put(r,meta);}).filter(Boolean);}
  function link(edge){
    if(!edge||edge.from==null||edge.to==null)return null;
    var key=String(edge.from)+'>'+String(edge.to)+'>'+String(edge.type||'RELATED_TO');
    var rel=window.OmegaObject.relation(edge.from,edge.to,edge.type,edge.source);
    relations.set(key,rel); emit('relation:upserted',rel); return rel;
  }
  function ingest(event){
    if(!event||typeof event!=='object')return {ok:false,state:'UNKNOWN',reason:'invalid-event'};
    var row=event.object||event.data||event.payload;
    var meta=event.meta||{};
    if(row&&row.id!=null&&meta.type)put(row,meta);
    if(event.relation)link(event.relation);
    return {ok:true,state:'LIVE',objects:objects.size,relations:relations.size};
  }
  function get(type,id){return objects.get(String(type)+':'+String(id))||null;}
  function find(type){var out=[];objects.forEach(function(v){if(!type||v.type===type)out.push(v);});return Object.freeze(out);}
  function snapshot(){return Object.freeze({version:VERSION,objects:Array.from(objects.values()),relations:Array.from(relations.values()),counts:{objects:objects.size,relations:relations.size},observedAt:new Date().toISOString()});}
  function subscribe(fn){if(typeof fn!=='function')return function(){};listeners.push(fn);return function(){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  function clear(){objects.clear();relations.clear();emit('graph:cleared',null);}
  window.OmegaObjectGraph={version:VERSION,put:put,putMany:putMany,link:link,ingest:ingest,get:get,find:find,snapshot:snapshot,subscribe:subscribe,clear:clear};
  document.addEventListener('omega:platform-event',function(e){ingest(e&&e.detail||{});});
  document.addEventListener('omega:action:succeeded',function(e){var d=e&&e.detail||{};if(d&&d.action)ingest({object:d.action,meta:{type:d.action.type||'event',source:'omega-action-runtime'}});});
  function bindOmegaBus(){
    if(!window.OmegaBus||typeof window.OmegaBus.on!=='function')return;
    window.OmegaBus.on('*',function(evt){
      if(!evt||!evt.id||!evt.name)return;
      var payload=evt.payload&&typeof evt.payload==='object'?evt.payload:{};
      put({id:String(evt.id),label:String(payload.title||payload.name||evt.name),metadata:{eventName:evt.name,payload:payload},createdAt:new Date(evt.ts||Date.now()).toISOString()},
          {type:'event',source:'OmegaBus:'+evt.name,truth:'SOURCE',observedAt:new Date(evt.ts||Date.now()).toISOString()});
      if(payload.memberId!=null)link({from:String(payload.memberId),to:String(evt.id),type:'TRIGGERS',source:'OmegaBus:'+evt.name});
    });
  }
  bindOmegaBus();
  window.addEventListener('omega:bus-ready',bindOmegaBus);
  (function waitForBus(n){if(window.OmegaBus||n<=0)return;setTimeout(function(){bindOmegaBus();waitForBus(n-1);},250);})(20);
})();
