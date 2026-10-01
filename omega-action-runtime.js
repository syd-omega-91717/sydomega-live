/* Ω ACTION RUNTIME — governed client action boundary
   Presentation code may request actions here, but this runtime never becomes
   the authorization authority. The server/RLS/Edge boundary must revalidate. */
(function(){
  'use strict';
  if(window.OmegaAction)return;

  var CONTRACT_URL='/config/omega-action-contract.json';
  var contract=null;
  var listeners=Object.create(null);

  function now(){return new Date().toISOString();}
  function id(){return 'oa_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);}
  function emit(type,payload){
    var detail=Object.assign({type:type,at:now()},payload||{});
    try{window.dispatchEvent(new CustomEvent(type,{detail:detail}));}catch(e){}
    (listeners[type]||[]).slice().forEach(function(fn){try{fn(detail);}catch(e){}})
  }
  function on(type,fn){
    if(typeof fn!=='function')return function(){};
    (listeners[type]||(listeners[type]=[])).push(fn);
    return function(){var a=listeners[type]||[];var i=a.indexOf(fn);if(i>=0)a.splice(i,1);};
  }
  function normalize(input){
    input=input||{};
    var action=String(input.action||'').trim();
    if(!action)throw new Error('OmegaAction requires action');
    var actor=String(input.actor||window.__omegaCurrentProfile&&window.__omegaCurrentProfile.id||'anonymous');
    var requestId=String(input.requestId||id());
    return {
      id:requestId,
      actor:actor,
      target:input.target||null,
      input:input.input===undefined?{}:input.input,
      permission:input.permission||'authenticated',
      mode:input.mode||'READ',
      startedAt:now(),
      status:'REQUESTED',
      idempotencyKey:'omega-action:'+action+':'+actor+':'+requestId,
      action:action,
      metadata:input.metadata||{}
    };
  }
  async function loadContract(){
    if(contract)return contract;
    try{contract=await fetch(CONTRACT_URL,{cache:'force-cache'}).then(function(r){return r.ok?r.json():null;});}
    catch(e){contract=null;}
    return contract;
  }
  async function request(input){
    var a=normalize(input);
    emit('omega:action:requested',{action:a.action,actionId:a.id,request:a});
    var c=await loadContract();
    if(!c){
      a.status='UNKNOWN';
      emit('omega:action:failed',{action:a.action,actionId:a.id,error:'contract-unavailable'});
      return {ok:false,status:a.status,action:a,error:'contract-unavailable'};
    }
    /* Client-side checks improve UX only. They do not authorize writes. */
    if(c.authorization&&c.authorization.default==='deny'&&a.permission==='none'){
      a.status='DENIED';
      emit('omega:action:denied',{action:a.action,actionId:a.id,action:a});
      return {ok:false,status:a.status,action:a,error:'permission-required'};
    }
    a.status='AUTHORIZED';
    emit('omega:action:authorized',{action:a.action,actionId:a.id,action:a});
    try{
      if(typeof input.execute!=='function'){
        a.status='UNKNOWN';
        emit('omega:action:failed',{action:a.action,actionId:a.id,error:'no-executor'});
        return {ok:false,status:a.status,action:a,error:'no-executor'};
      }
      a.status='RUNNING';
      emit('omega:action:running',{action:a.action,actionId:a.id,action:a});
      var result=await input.execute(a);
      a.status='SUCCEEDED';
      emit('omega:action:succeeded',{action:a.action,actionId:a.id,action:a,result:result});
      return {ok:true,status:a.status,action:a,result:result};
    }catch(error){
      a.status='FAILED';
      var safe={name:error&&error.name||'Error',message:error&&error.message||'Action failed'};
      emit('omega:action:failed',{action:a.action,actionId:a.id,action:a,error:safe});
      if(window.omegaRuntime&&typeof window.omegaRuntime.record==='function')
        window.omegaRuntime.record('omega_action_failed',{action:a.action,status:a.status});
      return {ok:false,status:a.status,action:a,error:safe};
    }
  }
  window.OmegaAction={
    version:'1.0.0',
    contract:loadContract,
    request:request,
    on:on,
    emit:emit,
    create:normalize
  };
})();
