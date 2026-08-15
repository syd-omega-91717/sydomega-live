/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN INTELLIGENCE ENGINE (omega-intelligence.js)
   
   The autonomous AI layer. Implements multi-agent orchestration, reasoning
   chains, tool use, memory integration, and platform-wide AI coordination.
   
   Inspired by:
   - OpenAI Assistants: tool use, memory, file retrieval, multi-step reasoning
   - Palantir AIP: operational intelligence grounded in sovereign platform data
   - Anthropic Claude: constitutional AI, artifact generation, tool use
   - DeepMind AlphaCode: code reasoning as a model for platform reasoning
   - Google Gemini: multimodal intelligence, long-context reasoning
   
   Architecture:
   A. AGENT ROUTER       — Routes queries to the correct specialized agent
   B. REASONING CHAIN    — ReAct pattern: Reason→Act→Observe→Respond
   C. TOOL REGISTRY      — Platform tools the AI can call autonomously
   D. MEMORY INTEGRATION — Uses OmegaMemory to ground responses in history
   E. ORCHESTRATOR       — Coordinates multi-agent workflows
   F. RESPONSE PIPELINE  — Format, validate, stream to UI
   ========================================================================== */
(function(){
  if(window.__omegaIntelligenceActive) return;
  window.__omegaIntelligenceActive = true;

  var PHI=1.6180339887, EU=2.7182818285;
  var APEX=27.8367, TRIAL=557, DEDICATION=33437;

  /* ── A. TOOL REGISTRY ─────────────────────────────────────────── */
  /* Every tool has: name, description, execute(args)→result */
  var TOOLS = {
    get_member_status: {
      name: 'get_member_status',
      desc: 'Get the current member\'s authority score, axis values, element, and gate position',
      execute: async function(){
        var pr = window.__omegaCurrentProfile;
        if(!pr) return {error:'no_session'};
        var a=Number(pr.is_owner?9:pr.axis_a||0.001);
        var b=Number(pr.is_owner?9:pr.axis_b||0.001);
        var c=Number(pr.is_owner?9:pr.axis_c||0.001);
        var auth=pr.is_owner?APEX:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
        var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.517,APEX];
        var GNAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];
        var gi=GATES.findIndex(function(g){return auth<g;});
        return {auth:auth.toFixed(4),axis_a:a.toFixed(3),axis_b:b.toFixed(3),axis_c:c.toFixed(3),
          element:pr.element,sign:pr.sign,agent:pr.agent,
          gate_next:gi>=0?gi+1:12,gate_name:gi>=0?GNAMES[gi]:'APEX',
          gate_delta:gi>=0?(GATES[gi]-auth).toFixed(4):'0.0000'};
      }
    },
    get_platform_stats: {
      name: 'get_platform_stats',
      desc: 'Get live platform statistics: member count, tasks today, incidents',
      execute: async function(){
        if(!window.__omegaSb) return {error:'no_sb'};
        var sb=window.__omegaSb;
        var [mc,tc] = await Promise.all([
          sb.from('profiles').select('id',{count:'exact',head:true}).eq('access_approved',true),
          sb.from('task_completions').select('id',{count:'exact',head:true}).gte('completed_at',new Date().toISOString().slice(0,10))
        ]);
        return {active_members:mc.count||0,tasks_today:tc.count||0,apex:APEX,trial_s:TRIAL,dedication_s:DEDICATION};
      }
    },
    get_recent_activity: {
      name: 'get_recent_activity',
      desc: 'Get recent platform activity feed entries',
      execute: async function(){
        if(!window.__omegaSb) return {error:'no_sb'};
        var r=await window.__omegaSb.from('activity_feed').select('activity_type,title,created_at').eq('is_public',true).order('created_at',{ascending:false}).limit(5);
        return {activities:r.data||[]};
      }
    },
    calculate_auth: {
      name: 'calculate_auth',
      desc: 'Calculate authority score for given axis values',
      execute: async function(args){
        var a=Number(args.a||0),b=Number(args.b||0),c=Number(args.c||0);
        return {auth:(Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU).toFixed(4),
          formula:'sqrt('+a+'^3+'+b+'^3+'+c+'^3)×'+PHI+'/'+EU};
      }
    },
    get_agent_for_sign: {
      name: 'get_agent_for_sign',
      desc: 'Get the sovereign agent assigned to a zodiac sign',
      execute: async function(args){
        var MAP={Aries:'Sentinel',Taurus:'Merchant',Gemini:'Scout',Cancer:'Warden',Leo:'Sovereign',Virgo:'Auditor',Libra:'Proxy',Scorpio:'Oracle',Sagittarius:'Beacon',Capricorn:'Analyst',Aquarius:'Tutor',Pisces:'Historian'};
        var sign=args.sign||'';
        return {agent:MAP[sign]||'Unknown',sign:sign,platform:'SYD OMEGA 91717'};
      }
    }
  };

  /* ── B. REASONING CHAIN (ReAct) ──────────────────────────────── */
  /* Reason → Act (call tool) → Observe result → Continue or Respond */
  async function reasonAndAct(query, profile, history){
    var toolsDesc = Object.values(TOOLS).map(function(t){
      return '- '+t.name+': '+t.desc;
    }).join('\n');

    var ctx = '';
    if(profile){
      var a=Number(profile.axis_a||0.001),b=Number(profile.axis_b||0.001),c=Number(profile.axis_c||0.001);
      var auth=profile.is_owner?APEX:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
      ctx='\nMEMBER CONTEXT: auth='+auth.toFixed(4)+' axis_a='+a.toFixed(3)+' axis_b='+b.toFixed(3)+' axis_c='+c.toFixed(3)+' sign='+(profile.sign||'?')+' element='+(profile.element||'?')+' is_owner='+(profile.is_owner||false);
    }

    var system='You are the Sovereign Intelligence Engine of SYD OMEGA 91717.\n'
      +'CANONICAL FACTS: AUTH=sqrt(A³+B³+C³)×φ/e, φ='+PHI+', e='+EU+', apex='+APEX+', trial='+TRIAL+'s, dedication='+DEDICATION+'s, lattice=104976 nodes.\n'
      +'AVAILABLE TOOLS:\n'+toolsDesc+'\n'
      +'To call a tool respond with: TOOL:tool_name:{"arg":"val"}\n'
      +'Keep responses concise (under 150 words). Be precise. Never fabricate numbers.'+ctx;

    var msgs = (history||[]).slice(-4).concat([{role:'user',content:query}]);

    /* First pass: check if tool use is needed */
    var resp = await callConcierge(system, msgs);
    var toolMatch = resp&&resp.match(/^TOOL:(\w+):(\{.*?\})/);
    if(toolMatch){
      var toolName=toolMatch[1],toolArgs={};
      try{ toolArgs=JSON.parse(toolMatch[2]); }catch(e){}
      var tool=TOOLS[toolName];
      if(tool){
        var observation = await tool.execute(toolArgs);
        /* Second pass: respond with observation */
        msgs.push({role:'assistant',content:resp});
        msgs.push({role:'user',content:'TOOL_RESULT:'+JSON.stringify(observation)});
        var finalResp = await callConcierge(system, msgs);
        return finalResp||resp;
      }
    }
    return resp;
  }

  async function callConcierge(system, messages){
    if(!window.__omegaSb) return null;
    var pr=window.__omegaCurrentProfile||{};
    var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
    var auth=pr.is_owner?APEX:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    /* Encode multi-turn context into a single message for the concierge endpoint */
    var lastMsg=messages[messages.length-1];
    var userMsg=lastMsg&&lastMsg.role==='user'?lastMsg.content:'query';
    if(messages.length>1){
      var hist=messages.slice(0,-1).map(function(m){return m.role.toUpperCase()+': '+m.content;}).join('\n');
      userMsg='[CONTEXT]\n'+hist+'\n\n[QUERY]\n'+userMsg;
    }
    try{
      var r=await window.__omegaSb.functions.invoke('concierge',{
        body:{message:userMsg.slice(0,2000),system_override:system,context:{sign:pr.sign||'?',a:a.toFixed(3),b:b.toFixed(3),c:c.toFixed(3),auth:auth.toFixed(4),tier:pr.subscription_tier||'free',rank:pr.rank||'--'}}
      });
      if(r.data&&r.data.reply) return r.data.reply;
    }catch(e){}
    return null;
  }

  /* ── C. MULTI-AGENT ORCHESTRATOR ─────────────────────────────── */
  var AGENT_DOMAINS = {
    Sentinel:  ['security','threat','access','permission','breach','lock'],
    Analyst:   ['analytics','data','stats','numbers','metrics','performance'],
    Beacon:    ['onboarding','start','begin','new','welcome','guide'],
    Warden:    ['family','bloodline','heritage','genealogy','lineage'],
    Sovereign: ['governance','enterprise','elite','authority','highest'],
    Merchant:  ['token','buy','sell','marketplace','revenue','payment'],
    Auditor:   ['compliance','audit','legal','policy','risk','validate'],
    Oracle:    ['predict','forecast','future','trend','intelligence'],
    Scout:     ['discover','find','search','explore','new','suggest'],
    Proxy:     ['automate','execute','run','schedule','batch','workflow'],
    Historian: ['history','archive','past','record','log','memory'],
    Tutor:     ['learn','teach','explain','guide','exam','knowledge']
  };

  function selectAgent(query){
    var q = query.toLowerCase();
    var scores = {};
    Object.entries(AGENT_DOMAINS).forEach(function(entry){
      var agent=entry[0],keywords=entry[1];
      scores[agent]=keywords.filter(function(k){return q.includes(k);}).length;
    });
    var best=Object.entries(scores).sort(function(a,b){return b[1]-a[1];});
    return best[0][1]>0?best[0][0]:null;
  }

  /* ── D. PUBLIC API ────────────────────────────────────────────── */
  window.OmegaIntelligence = {
    reason: reasonAndAct,
    tools: TOOLS,
    selectAgent: selectAgent,
    APEX: APEX,
    TRIAL: TRIAL,
    DEDICATION: DEDICATION,
    PHI: PHI,
    EU: EU,
    /* Ask with full intelligence pipeline */
    ask: async function(query, history){
      var pr=window.__omegaCurrentProfile||null;
      /* Select best agent */
      var agentName=selectAgent(query);
      /* Emit routing event */
      if(window.OmegaOS)window.OmegaOS.events.emit('intelligence:query',{query:query.slice(0,100),agent:agentName});
      /* Recall memories */
      var memCtx='';
      if(window.OmegaMemory){var m=await window.OmegaMemory.recall(5);if(m.length)memCtx='\nMEMORIES:'+m.map(function(x){return x.content;}).join(';');}
      /* Run reasoning chain */
      var resp=await reasonAndAct(query+(memCtx?'\n'+memCtx:''), pr, history);
      /* Store to memory */
      if(window.OmegaMemory&&resp) window.OmegaMemory.store('conversation:'+Date.now(),query.slice(0,200)+'→'+resp.slice(0,200));
      /* Telemetry */
      if(window.OmegaTelemetry)window.OmegaTelemetry.track('ai_query',{agent:agentName,query_len:query.length});
      return resp||'Intelligence engine unavailable. Ensure the concierge edge function is deployed.';
    }
  };

  /* Load profile into global when populated */
  document.addEventListener('omega:populated',function(e){
    if(e.detail&&e.detail.profile)window.__omegaCurrentProfile=e.detail.profile;
  });
})();
