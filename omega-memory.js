/* Ω SYD OMEGA 91717 — SOVEREIGN AI MEMORY ENGINE
 *
 * Privacy boundary:
 * - Memory is opt-in through the canonical account-level AI-personalization preference.
 * - Consent is re-read from Supabase for every operation and fails closed.
 * - Browser fallback keys are user-namespaced; legacy unscoped keys are never read.
 * - Reads and writes require an authenticated user and current consent.
 * - Deletion remains available after consent is revoked.
 */
(function(){
  if(window.__omegaMemoryActive) return;
  window.__omegaMemoryActive=true;
  var MEM_PREFIX='omega_mem_v2_', LEGACY_PREFIX='omega_mem_', _uid=null, _cache={};

  function localKey(key){return MEM_PREFIX+_uid+'_'+key;}
  function localSet(key,value,type){
    if(!_uid)return;
    try{sessionStorage.setItem(localKey(key),JSON.stringify({value:value,type:type,ts:Date.now()}));}catch(e){}
  }
  function localGet(key){
    if(!_uid)return null;
    try{var s=sessionStorage.getItem(localKey(key));return s?JSON.parse(s):null;}catch(e){return null;}
  }
  function clearLocalKey(key){
    if(!_uid)return;
    try{sessionStorage.removeItem(localKey(key));}catch(e){}
  }
  function clearLocalUser(){
    if(!_uid)return;
    var prefix=MEM_PREFIX+_uid+'_';
    try{
      for(var i=sessionStorage.length-1;i>=0;i--){
        var k=sessionStorage.key(i);
        if(k&&k.indexOf(prefix)===0)sessionStorage.removeItem(k);
      }
    }catch(e){}
  }
  function clearLegacyLocal(){
    try{
      for(var i=sessionStorage.length-1;i>=0;i--){
        var k=sessionStorage.key(i);
        if(k&&k.indexOf(LEGACY_PREFIX)===0&&k.indexOf(MEM_PREFIX)!==0)sessionStorage.removeItem(k);
      }
    }catch(e){}
  }
  function clearCache(){_cache={};}
  clearLegacyLocal();

  async function hasAiPersonalizationConsent(){
    if(!_uid||!window.__omegaSb)return false;
    try{
      /* Re-read the authoritative preference for every operation. This avoids
         stale consent in another tab after a user revokes AI personalization. */
      var r=await window.__omegaSb.from('omega_personal_context_preferences')
        .select('ai_personalization_enabled')
        .eq('user_id',_uid)
        .maybeSingle();
      return !r.error&&!!r.data&&r.data.ai_personalization_enabled===true;
    }catch(e){return false;}
  }
  async function permitted(){
    var ok=await hasPersonalisationConsent();
    if(!ok){clearCache();clearLocalUser();}
    return ok;
  }

  var Storage={
    write:async function(key,value,type){
      if(!_uid||!key||!(await permitted()))return false;
      var row={user_id:_uid,memory_key:key,memory_type:type||'semantic',memory:String(value).slice(0,500),content:String(value).slice(0,500),updated_at:new Date().toISOString()};
      if(window.__omegaSb){
        try{
          var r=await window.__omegaSb.from('ai_memory').upsert(row,{onConflict:'user_id,memory_key'});
          if(r.error)return false;
          _cache[key]={key:key,value:row.memory,type:row.memory_type,ts:Date.now()};
          localSet(key,row.memory,row.memory_type);
          return true;
        }catch(e){return false;}
      }
      return false;
    },
    read:async function(key){
      if(!_uid||!key||!(await permitted()))return null;
      if(_cache[key])return _cache[key].value;
      if(window.__omegaSb){
        try{
          var r=await window.__omegaSb.from('ai_memory').select('memory,content,memory_type,updated_at').eq('user_id',_uid).eq('memory_key',key).maybeSingle();
          if(r.error)return null;
          if(r.data){
            var v=r.data.content||r.data.memory;
            _cache[key]={key:key,value:v,type:r.data.memory_type||'',ts:r.data.updated_at||Date.now()};
            return v;
          }
          return null;
        }catch(e){return null;}
      }
      var local=localGet(key);
      return local?local.value:null;
    },
    readRecent:async function(limit){
      if(!_uid||!(await permitted()))return [];
      if(window.__omegaSb){
        try{
          var r=await window.__omegaSb.from('ai_memory').select('memory_key,memory_type,memory,content,updated_at').eq('user_id',_uid).order('updated_at',{ascending:false}).limit(limit||10);
          if(r.error)return [];
          if(r.data)return r.data.map(function(m){return{key:m.memory_key,type:m.memory_type,content:m.content||m.memory,ts:m.updated_at};});
          return [];
        }catch(e){return [];}
      }
      return Object.values(_cache).sort(function(a,b){return b.ts-a.ts;}).slice(0,limit||10);
    },
    delete:async function(key){
      if(!_uid||!key)return false;
      delete _cache[key];
      clearLocalKey(key);
      if(window.__omegaSb){
        try{
          var r=await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid).eq('memory_key',key);
          return !r.error;
        }catch(e){return false;}
      }
      return true;
    }
  };

  async function store(key,value,type){
    if(!key||value===undefined||value===null)return false;
    return Storage.write(key,String(value).slice(0,500),type||'semantic');
  }
  async function recall(limit,type){
    var mems=await Storage.readRecent(limit||5);
    return type?mems.filter(function(m){return m.type===type;}):mems;
  }
  async function learnFromProfile(profile){
    if(!profile)return;
    var PHI=1.6180339887,EU=2.7182818285,a=Number(profile.axis_a||0.001),b=Number(profile.axis_b||0.001),c=Number(profile.axis_c||0.001);
    var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    await store('member:name',profile.display_name||'Sovereign','semantic');
    await store('member:element',profile.element||'?','semantic');
    await store('member:sign',profile.sign||'?','semantic');
    await store('member:agent',profile.agent||'?','semantic');
    await store('member:auth',auth.toFixed(4),'semantic');
    await store('member:tier',profile.subscription_tier||'FREE','semantic');
    await store('session:page',location.pathname,'episodic');
    await store('session:started',new Date().toISOString(),'episodic');
  }
  async function buildContext(){
    var mems=await recall(8);if(!mems.length)return '';
    var semantic=mems.filter(function(m){return m.type==='semantic';}),episodic=mems.filter(function(m){return m.type==='episodic';}).slice(0,3),lines=[];
    if(semantic.length)lines.push('KNOWN: '+semantic.map(function(m){return m.key+'='+m.content;}).join(','));
    if(episodic.length)lines.push('RECENT: '+episodic.map(function(m){return m.content;}).join(','));
    return lines.join('\n');
  }
  async function forget(pattern){
    if(!_uid)return false;
    if(pattern==='all'){
      clearCache();clearLocalUser();
      if(window.__omegaSb){
        try{var all=await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid);return !all.error;}catch(e){return false;}
      }
      return true;
    }
    Object.keys(_cache).forEach(function(k){if(k.indexOf(pattern)===0)delete _cache[k];});
    clearLocalUser();
    if(window.__omegaSb){
      try{var r=await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid).like('memory_key',pattern+'%');return !r.error;}catch(e){return false;}
    }
    return true;
  }

  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(!pr||!pr.id)return;
    if(_uid!==pr.id){clearCache();_uid=pr.id;}
    learnFromProfile(pr);
  });
  document.addEventListener('omega:consent-changed',function(e){
    var detail=e.detail||{};
    if(detail.type==='ai_personalization'){
      if(detail.granted!==true){clearCache();clearLocalUser();}
    }
  });
  window.OmegaMemory={store:store,recall:recall,context:buildContext,forget:forget,read:Storage.read};
})();
