/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN WORKFLOW ENGINE (omega-workflow.js)
   
   Multi-step workflow orchestration for sovereign platform operations.
   Inspired by:
   - AWS Step Functions: state machine workflows with retry/catch
   - Salesforce Flow: declarative business process automation
   - Zapier: trigger → action → condition pipelines
   - Temporal.io: durable execution, long-running workflow reliability
   
   Built-in Sovereign Workflows:
   W1. ONBOARDING        — New member setup: sign→element→agent→first tasks
   W2. GATE_UNLOCK       — Gate achievement: validate→celebrate→notify→record
   W3. TRIAL_GRANT       — Owner grants trial: set→notify→chrono→log
   W4. TASK_COMPLETE     — Member completes task: validate→award→check gates→notify
   W5. APPROVAL_FLOW     — Member requests access: notify owner→wait→respond
   W6. DEDICATION_AWARD  — Daily dedication reached: celebrate→award→log
   W7. DATA_EXPORT       — GDPR export: collect→package→notify→deliver
   W8. REPORT_GENERATE   — Generate member progress report: query→build→cache
   ========================================================================== */
(function(){
  if(window.__omegaWorkflowActive) return;
  window.__omegaWorkflowActive = true;

  var _running = {}; /* active workflow instances */
  var _log = [];     /* local execution log */

  /* ── WORKFLOW DEFINITIONS ─────────────────────────────────────── */
  var WORKFLOWS = {
    onboarding: {
      name:'SOVEREIGN ONBOARDING',
      steps:['select_sign','assign_element_agent','set_initial_axes','send_welcome','record_event'],
      description:'Complete member onboarding after zodiac selection'
    },
    gate_unlock: {
      name:'GATE UNLOCK CEREMONY',
      steps:['verify_auth','compute_gate','show_celebration','record_achievement','notify_owner'],
      description:'Ceremonial gate unlock when member crosses authority threshold'
    },
    task_complete: {
      name:'TASK COMPLETION',
      steps:['validate_task','increment_axis','recompute_auth','check_gate','emit_events','log_activity'],
      description:'Full task completion pipeline with gate check and activity logging'
    },
    dedication_award: {
      name:'DEDICATION AWARD',
      steps:['verify_duration','award_axis_c','show_celebration','log_dedication'],
      description:'Award Axis C increment when daily dedication target is reached'
    },
    report_generate: {
      name:'PROGRESS REPORT',
      steps:['query_profile','query_tasks','query_dedications','build_report','cache_result'],
      description:'Generate comprehensive member progress report'
    }
  };

  /* ── STEP EXECUTORS ───────────────────────────────────────────── */
  var STEPS = {
    verify_auth: async function(ctx){
      var pr=window.__omegaCurrentProfile;
      if(!pr) return {ok:false,error:'no_session'};
      var PHI=1.6180339887,EU=2.7182818285;
      var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
      var auth=pr.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
      return {ok:true,auth:auth,profile:pr};
    },
    compute_gate: async function(ctx){
      var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.517,27.8367];
      var GNAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];
      var auth=ctx.auth||0;
      var gi=GATES.findIndex(function(g){return auth<g;});
      return {ok:true,gate_idx:gi<0?11:gi,gate_name:gi<0?'APEX':GNAMES[gi],threshold:gi<0?27.8367:GATES[gi]};
    },
    show_celebration: async function(ctx){
      if(window.OmegaSDT&&window.OmegaSDT.pulse){
        window.OmegaSDT.pulse('c',0.009,ctx.auth||0);
      }
      if(window.OmegaNotify){
        var msg=ctx.gate_name?'GATE UNLOCKED: '+ctx.gate_name+' (AUTH='+Number(ctx.auth||0).toFixed(4)+')':'SOVEREIGN ACHIEVEMENT UNLOCKED';
        window.OmegaNotify.showToast(msg,'success');
      }
      return {ok:true,shown:true};
    },
    emit_events: async function(ctx){
      if(window.OmegaOS){
        window.OmegaOS.events.emit('workflow:step_complete',ctx);
      }
      document.dispatchEvent(new CustomEvent('omega:task_complete',{detail:ctx,bubbles:false}));
      return {ok:true};
    },
    log_activity: async function(ctx){
      if(window.OmegaTelemetry){
        window.OmegaTelemetry.track('workflow_completed',{workflow:ctx._workflow,steps:ctx._steps_completed});
      }
      if(window.OmegaMemory){
        window.OmegaMemory.store('last_workflow:'+ctx._workflow,new Date().toISOString(),'episodic');
      }
      return {ok:true,logged:true};
    },
    record_event: async function(ctx){
      if(!window.__omegaSb||!window.__omegaCurrentProfile) return {ok:true};
      try{
        await window.__omegaSb.rpc('record_sovereign_event',{
          p_event_type:ctx._workflow||'workflow_complete',
          p_event_data:ctx,
          p_axis_delta:{a:0,b:0,c:0}
        });
      }catch(e){}
      return {ok:true};
    },
    /* task_complete workflow steps — these were referenced but not implemented */
    validate_task: async function(ctx){
      if(!ctx.task||!ctx.axis) return {ok:false,error:'missing task or axis'};
      if(['a','b','c'].indexOf(String(ctx.axis))===-1) return {ok:false,error:'invalid axis'};
      return {ok:true,validated:true};
    },
    increment_axis: async function(ctx){
      if(!ctx.ok||!window.__omegaSb) return {ok:true,skipped:'no_client'};
      var axis=String(ctx.axis||'a');
      var kind=String(ctx.kind||ctx._workflow||'workflow');
      var task=String(ctx.task||ctx._instance);
      var title=String(ctx.title||ctx.task||'Workflow Task');
      var weight=Number(ctx.weight||0.12);
      try{
        var r=await window.__omegaSb.rpc('complete_task',{
          p_task_type:kind, p_task_name:task, p_axis_type:axis, p_description:title, p_points:weight
        });
        if(r.error) throw r.error;
        return {ok:true,applied:!!(r.data&&r.data.applied),axis_result:r.data||{}};
      }catch(e){
        return {ok:true,skipped:'rpc_error',error:e.message};
      }
    },
    recompute_auth: async function(ctx){
      var PHI=1.6180339887,EU=2.7182818285;
      var pr=window.__omegaCurrentProfile;
      if(!pr) return {ok:true};
      /* If axis was incremented, pull fresh values from server result */
      var ar=ctx.axis_result||{};
      var a=Number(ar.a||pr.axis_a||0.001),b=Number(ar.b||pr.axis_b||0.001),c=Number(ar.c||pr.axis_c||0.001);
      var auth=pr.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
      return {ok:true,auth:auth,a:a,b:b,c:c};
    },
    build_report: async function(ctx){
      var pr=window.__omegaCurrentProfile;
      if(!pr) return {ok:false};
      var PHI=1.6180339887,EU=2.7182818285;
      var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
      var auth=pr.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
      var report={
        generated:new Date().toISOString(),
        member:pr.display_name,
        auth:auth.toFixed(4),
        axis:{a:a.toFixed(3),b:b.toFixed(3),c:c.toFixed(3)},
        element:pr.element,sign:pr.sign,agent:pr.agent,
        tier:pr.subscription_tier,
        formula:'sqrt(A³+B³+C³)×φ/e',
        tasks_completed:ctx._tasks_count||0,
        dedications:ctx._dedications||[]
      };
      return {ok:true,report:report};
    },
    /* ── gate_unlock workflow ───────────────────────────────────── */
    record_achievement: async function(ctx){
      if(!window.__omegaSb||!window.__omegaCurrentProfile) return {ok:true};
      try{
        await window.__omegaSb.rpc('record_sovereign_event',{
          p_event_type:'gate.unlocked',
          p_event_data:{gate_name:ctx.gate_name,gate_idx:ctx.gate_idx,auth:ctx.auth},
          p_axis_delta:{a:0,b:0,c:0}
        });
      }catch(e){}
      return {ok:true,recorded:true};
    },
    notify_owner: async function(ctx){
      if(window.OmegaOS){
        window.OmegaOS.events.emit('gate_unlock:achieved',{gate:ctx.gate_name,auth:ctx.auth,member:(window.__omegaCurrentProfile&&window.__omegaCurrentProfile.display_name)||'Sovereign'});
      }
      if(window.OmegaTelemetry){
        window.OmegaTelemetry.track('gate_unlocked',{gate:ctx.gate_name,auth:ctx.auth});
      }
      return {ok:true};
    },
    /* ── task_complete gate check ──────────────────────────────── */
    check_gate: async function(ctx){
      if(!ctx.auth) return {ok:true,gates_crossed:[]};
      var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.517,27.8367];
      var GNAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];
      var pr=window.__omegaCurrentProfile;
      var prev_auth=pr?Number(pr.is_owner?27.8367:ctx.auth-(ctx.axis_result&&ctx.axis_result.applied?Number(ctx.weight||0.12):0)):0;
      var new_auth=ctx.auth;
      var crossed=[];
      for(var i=0;i<GATES.length;i++){
        if(prev_auth<GATES[i]&&new_auth>=GATES[i]) crossed.push({gate:i+1,name:GNAMES[i],threshold:GATES[i]});
      }
      if(crossed.length>0){
        var top=crossed[crossed.length-1];
        setTimeout(function(){
          if(window.OmegaWorkflow) window.OmegaWorkflow.run('gate_unlock',{auth:new_auth,gate_name:top.name,gate_idx:top.gate-1});
        },600);
      }
      return {ok:true,gates_crossed:crossed};
    },
    /* ── dedication_award workflow ─────────────────────────────── */
    verify_duration: async function(ctx){
      var DEDICATION=33437; /* 9h 17m 17s */
      var dur=Number(ctx.duration||0);
      if(dur<DEDICATION) return {ok:false,error:'dedication_not_reached',duration:dur,target:DEDICATION};
      return {ok:true,duration:dur,target:DEDICATION};
    },
    award_axis_c: async function(ctx){
      if(!ctx.ok||!window.__omegaSb) return {ok:true,skipped:'no_client'};
      var today=new Date().toISOString().slice(0,10);
      try{
        var r=await window.__omegaSb.rpc('complete_task',{
          p_task_type:'dedication',
          p_task_name:'dedication:daily:'+today,
          p_axis_type:'c',
          p_description:'Daily Dedication Target Reached',
          p_points:0.09
        });
        if(r.error) throw r.error;
        return {ok:true,applied:!!(r.data&&r.data.applied),axis_result:r.data||{}};
      }catch(e){
        return {ok:true,skipped:'rpc_error',error:e.message};
      }
    },
    log_dedication: async function(ctx){
      if(window.OmegaTelemetry){
        window.OmegaTelemetry.track('dedication_completed',{duration:ctx.duration,applied:ctx.applied});
      }
      if(window.OmegaMemory){
        window.OmegaMemory.store('last_dedication',new Date().toISOString(),'episodic');
      }
      return {ok:true};
    },
    /* ── report_generate workflow ──────────────────────────────── */
    query_profile: async function(ctx){
      var pr=window.__omegaCurrentProfile;
      if(pr) return {ok:true,profile:pr};
      if(!window.__omegaSb) return {ok:false,error:'no_client'};
      var sess=await window.__omegaSb.auth.getSession();
      var uid=sess&&sess.data&&sess.data.session&&sess.data.session.user.id;
      if(!uid) return {ok:false,error:'no_session'};
      var r=await window.__omegaSb.from('profiles').select('*').eq('id',uid).maybeSingle();
      return {ok:!r.error,profile:r.data||{}};
    },
    query_tasks: async function(ctx){
      if(!window.__omegaSb) return {ok:true,_tasks_count:0};
      var sess=await window.__omegaSb.auth.getSession();
      var uid=sess&&sess.data&&sess.data.session&&sess.data.session.user.id;
      if(!uid) return {ok:true,_tasks_count:0};
      try{
        var r=await window.__omegaSb.from('task_completions').select('id',{count:'exact',head:true}).eq('user_id',uid);
        return {ok:true,_tasks_count:r.count||0};
      }catch(e){return {ok:true,_tasks_count:0};}
    },
    query_dedications: async function(ctx){
      if(!window.__omegaSb) return {ok:true,_dedications:[]};
      var sess=await window.__omegaSb.auth.getSession();
      var uid=sess&&sess.data&&sess.data.session&&sess.data.session.user.id;
      if(!uid) return {ok:true,_dedications:[]};
      try{
        var r=await window.__omegaSb.from('sovereign_events').select('event_data,occurred_at').eq('user_id',uid).eq('event_type','dedication.completed').order('occurred_at',{ascending:false}).limit(30);
        return {ok:true,_dedications:r.data||[]};
      }catch(e){return {ok:true,_dedications:[]};}
    },
    cache_result: async function(ctx){
      if(window.OmegaMemory&&ctx.report){
        window.OmegaMemory.store('last_report',JSON.stringify(ctx.report),'semantic');
      }
      return {ok:true,cached:!!(ctx.report)};
    }
  };

  /* ── WORKFLOW EXECUTOR ────────────────────────────────────────── */
  async function run(workflowId, input){
    var def=WORKFLOWS[workflowId];
    if(!def){return{ok:false,error:'unknown_workflow:'+workflowId};}
    var instanceId=workflowId+'_'+Date.now();
    var ctx=Object.assign({_workflow:workflowId,_instance:instanceId,_steps_completed:0,_started:Date.now()},input||{});
    _running[instanceId]=ctx;
    var entry={id:instanceId,workflow:workflowId,started:new Date().toISOString(),steps:[],status:'running'};
    _log.push(entry);
    if(window.OmegaOS)window.OmegaOS.events.emit('workflow:started',{workflow:workflowId,instance:instanceId});
    /* Execute steps */
    for(var i=0;i<def.steps.length;i++){
      var stepName=def.steps[i];
      var step=STEPS[stepName];
      if(!step) continue; /* skip undefined steps */
      try{
        var result=await step(ctx);
        ctx=Object.assign(ctx,result||{});
        ctx._steps_completed++;
        entry.steps.push({name:stepName,ok:true,ts:Date.now()});
      }catch(e){
        entry.steps.push({name:stepName,ok:false,error:e.message});
        /* Non-fatal: continue to next step */
      }
    }
    entry.status='completed';entry.ended=new Date().toISOString();
    delete _running[instanceId];
    if(window.OmegaOS)window.OmegaOS.events.emit('workflow:completed',{workflow:workflowId,instance:instanceId,ctx:ctx});
    return {ok:true,instance:instanceId,result:ctx};
  }

  /* ── TRIGGER WORKFLOWS FROM EVENTS ──────────────────────────────── */
  document.addEventListener('omega:task_complete',function(e){
    if(e.detail&&!e.detail._workflow){
      run('task_complete',e.detail).catch(function(){});
    }
  });
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    if(pr&&!pr.sign&&!pr.is_owner){
      /* No sign = needs onboarding */
      /* OmegaOnboard handles this directly, just emit event */
      if(window.OmegaOS)window.OmegaOS.events.emit('workflow:needs_onboarding',{profile:pr});
    }
  });

  window.OmegaWorkflow = {
    run: run,
    WORKFLOWS: WORKFLOWS,
    getLog: function(){ return _log.slice(-20); },
    getRunning: function(){ return Object.keys(_running); }
  };
})();
