/* Ω SYD OMEGA 91717 — SOVEREIGN AI MEMORY ENGINE */
(function(){
  if(window.__omegaMemoryActive) return;
  window.__omegaMemoryActive=true;
  var MEM_PREFIX='omega_mem_', _uid=null, _cache={};
  function localSet(key,value,type){try{sessionStorage.setItem(MEM_PREFIX+key,JSON.stringify({value:value,type:type,ts:Date.now()}));}catch(e){}}
  function localGet(key){try{var s=sessionStorage.getItem(MEM_PREFIX+key);return s?JSON.parse(s):null;}catch(e){return null;}}
  var Storage={
    write:async function(key,value,type){
      var row={user_id:_uid,memory_key:key,memory_type:type||'semantic',memory:String(value).slice(0,500),content:String(value).slice(0,500),updated_at:new Date().toISOString()};
      _cache[key]={key:key,value:row.memory,type:row.memory_type,ts:Date.now()};
      if(window.__omegaSb&&_uid){
        try{var r=await window.__omegaSb.from('ai_memory').upsert(row,{onConflict:'user_id,memory_key'});if(!r.error){localSet(key,row.memory,row.memory_type);return true;}}catch(e){}
      }
      localSet(key,row.memory,row.memory_type);return false;
    },
    read:async function(key){
      if(_cache[key]) return _cache[key].value;
      if(window.__omegaSb&&_uid){
        try{var r=await window.__omegaSb.from('ai_memory').select('memory,content').eq('user_id',_uid).eq('memory_key',key).maybeSingle();if(r.data){var v=r.data.content||r.data.memory;_cache[key]={key:key,value:v,type:'',ts:Date.now()};return v;}}catch(e){}
      }
      var local=localGet(key);return local?local.value:null;
    },
    readRecent:async function(limit){
      if(window.__omegaSb&&_uid){
        try{var r=await window.__omegaSb.from('ai_memory').select('memory_key,memory_type,memory,content,updated_at').eq('user_id',_uid).order('updated_at',{ascending:false}).limit(limit||10);if(!r.error&&r.data)return r.data.map(function(m){return{key:m.memory_key,type:m.memory_type,content:m.content||m.memory,ts:m.updated_at};});}catch(e){}
      }
      return Object.values(_cache).sort(function(a,b){return b.ts-a.ts;}).slice(0,limit||10);
    },
    delete:async function(key){
      delete _cache[key];try{sessionStorage.removeItem(MEM_PREFIX+key);}catch(e){}
      if(window.__omegaSb&&_uid){try{await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid).eq('memory_key',key);}catch(e){}}
    }
  };
  async function store(key,value,type){if(!key||value===undefined||value===null)return;return Storage.write(key,String(value).slice(0,500),type||'semantic');}
  async function recall(limit,type){var mems=await Storage.readRecent(limit||5);return type?mems.filter(function(m){return m.type===type;}):mems;}
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
    if(window.__omegaSb&&_uid){try{if(pattern==='all'){await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid);_cache={};return;}await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid).like('memory_key',pattern+'%');}catch(e){}}
    Object.keys(_cache).forEach(function(k){if(k.indexOf(pattern)===0)delete _cache[k];});
  }
  document.addEventListener('omega:populated',function(e){var pr=e.detail&&e.detail.profile;if(!pr)return;_uid=pr.id;learnFromProfile(pr);});
  window.OmegaMemory={store:store,recall:recall,context:buildContext,forget:forget,read:Storage.read};
})();
