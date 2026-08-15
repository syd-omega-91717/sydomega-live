/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN AI MEMORY ENGINE (omega-memory.js)
   
   Persistent, queryable AI memory. Grounds every AI response in what
   the platform knows about the member across all sessions.
   
   Inspired by:
   - Apple Intelligence: on-device semantic memory, private by design
   - ChatGPT Memory: persistent user facts, correctable, transparent
   - Anthropic Claude Projects: knowledge base retrieval
   - Google Gemini Gems: structured persistent context
   
   Memory Types:
   A. EPISODIC     — What happened: task completions, gate unlocks, sessions
   B. SEMANTIC     — What is known: member preferences, goals, sign, element
   C. PROCEDURAL   — What works: successful patterns, best times of day
   D. CONVERSATION — Recent AI interactions, used to maintain continuity
   E. DECLARATIVE  — Explicit facts stored by the member ("I prefer...")
   ========================================================================== */
(function(){
  if(window.__omegaMemoryActive) return;
  window.__omegaMemoryActive = true;

  var MEM_LIMIT = 50;         /* Max memories stored per type */
  var MEM_PREFIX = 'omega_mem_';
  var _uid = null;
  var _cache = {};             /* In-memory cache */

  /* ── STORAGE ADAPTER ──────────────────────────────────────────── */
  /* Primary: Supabase ai_memory table. Fallback: sessionStorage */
  var Storage = {
    write: async function(key, value, type){
      _cache[key] = {key:key,value:value,type:type,ts:Date.now()};
      /* Write to Supabase */
      if(window.__omegaSb&&_uid){
        try{
          await window.__omegaSb.from('ai_memory').upsert({
            user_id:_uid, memory_key:key, memory_type:type||'semantic',
            content:value, updated_at:new Date().toISOString()
          },{onConflict:'user_id,memory_key'});
        }catch(e){}
      }
      /* Fallback: sessionStorage */
      try{sessionStorage.setItem(MEM_PREFIX+key,JSON.stringify({value:value,type:type,ts:Date.now()}));}catch(e){}
    },
    read: async function(key){
      if(_cache[key]) return _cache[key].value;
      if(window.__omegaSb&&_uid){
        try{
          var r=await window.__omegaSb.from('ai_memory').select('content').eq('user_id',_uid).eq('memory_key',key).maybeSingle();
          if(r.data){_cache[key]={value:r.data.content,type:'',ts:Date.now()};return r.data.content;}
        }catch(e){}
      }
      try{var s=sessionStorage.getItem(MEM_PREFIX+key);if(s)return JSON.parse(s).value;}catch(e){}
      return null;
    },
    readRecent: async function(limit){
      if(window.__omegaSb&&_uid){
        try{
          var r=await window.__omegaSb.from('ai_memory').select('memory_key,memory_type,content,updated_at').eq('user_id',_uid).order('updated_at',{ascending:false}).limit(limit||10);
          if(r.data)return r.data.map(function(m){return{key:m.memory_key,type:m.memory_type,content:m.content,ts:m.updated_at};});
        }catch(e){}
      }
      /* Fallback from cache */
      return Object.values(_cache).sort(function(a,b){return b.ts-a.ts;}).slice(0,limit||10);
    },
    delete: async function(key){
      delete _cache[key];
      try{sessionStorage.removeItem(MEM_PREFIX+key);}catch(e){}
      if(window.__omegaSb&&_uid){
        try{await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid).eq('memory_key',key);}catch(e){}
      }
    }
  };

  /* ── MEMORY WRITER ────────────────────────────────────────────── */
  async function store(key, value, type){
    if(!key||!value) return;
    await Storage.write(key, String(value).slice(0,500), type||'semantic');
  }

  /* ── MEMORY READER ────────────────────────────────────────────── */
  async function recall(limit, type){
    var mems = await Storage.readRecent(limit||5);
    if(type) mems = mems.filter(function(m){return m.type===type;});
    return mems;
  }

  /* ── AUTO-LEARN FROM PROFILE ──────────────────────────────────── */
  async function learnFromProfile(profile){
    if(!profile) return;
    var PHI=1.6180339887,EU=2.7182818285;
    var a=Number(profile.axis_a||0.001),b=Number(profile.axis_b||0.001),c=Number(profile.axis_c||0.001);
    var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    /* Store semantic facts */
    await store('member:name', profile.display_name||'Sovereign', 'semantic');
    await store('member:element', profile.element||'?', 'semantic');
    await store('member:sign', profile.sign||'?', 'semantic');
    await store('member:agent', profile.agent||'?', 'semantic');
    await store('member:auth', auth.toFixed(4), 'semantic');
    await store('member:tier', profile.subscription_tier||'FREE', 'semantic');
    await store('session:page', location.pathname, 'episodic');
    await store('session:started', new Date().toISOString(), 'episodic');
  }

  /* ── MEMORY CONTEXT BUILDER ───────────────────────────────────── */
  /* Returns a compact context string for injection into AI prompts */
  async function buildContext(){
    var mems = await recall(8);
    if(!mems.length) return '';
    var semantic = mems.filter(function(m){return m.type==='semantic';});
    var episodic = mems.filter(function(m){return m.type==='episodic';}).slice(0,3);
    var lines = [];
    if(semantic.length) lines.push('KNOWN: '+semantic.map(function(m){return m.key+'='+m.content;}).join(','));
    if(episodic.length) lines.push('RECENT: '+episodic.map(function(m){return m.content;}).join(','));
    return lines.join('\n');
  }

  /* ── FORGET (GDPR Art.17) ─────────────────────────────────────── */
  async function forget(pattern){
    if(window.__omegaSb&&_uid){
      try{
        if(pattern==='all'){
          await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid);
          _cache={};return;
        }
        await window.__omegaSb.from('ai_memory').delete().eq('user_id',_uid).like('memory_key',pattern+'%');
      }catch(e){}
    }
    Object.keys(_cache).forEach(function(k){if(k.startsWith(pattern))delete _cache[k];});
  }

  /* ── INIT ─────────────────────────────────────────────────────── */
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(!pr) return;
    _uid=pr.id;
    learnFromProfile(pr);
  });

  window.OmegaMemory = {
    store: store,
    recall: recall,
    context: buildContext,
    forget: forget,
    read: Storage.read
  };
})();
