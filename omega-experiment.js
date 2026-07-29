/* ==========================================================================
   Ω SYD OMEGA 91717 — EXPERIMENTATION ENGINE (omega-experiment.js)
   
   A/B testing, feature flags, champion-challenger model evaluation,
   and safe progressive rollouts for the sovereign platform.
   
   Inspired by:
   - Netflix: controlled experiments, canary deployments, Chaos Monkey
   - Google: randomised controlled trials, holdback groups
   - LinkedIn: PRIME experimentation platform
   - Anthropic: champion-challenger model evaluation
   
   Capabilities:
   A. FEATURE FLAGS    — Enable/disable features without redeploy
   B. A/B VARIANTS     — Show different UI/logic to different cohorts
   C. ROLLOUT GATES    — Progressive rollout: 1%→10%→50%→100%
   D. EXPERIMENT LOG   — Track every variant assignment for analysis
   E. MODEL EVALUATION — Compare AI model responses for quality
   ========================================================================== */
(function(){
  if(window.__omegaExperimentActive) return;
  window.__omegaExperimentActive = true;

  /* ── FEATURE FLAG REGISTRY ────────────────────────────────────── */
  /* Default flags — can be overridden from Supabase */
  var FLAGS = {
    'voice_interface':      {enabled:true,  rollout:100, description:'omega-voice.js voice commands and TTS'},
    'ai_memory':            {enabled:true,  rollout:100, description:'omega-memory.js cross-session AI memory'},
    'workflow_engine':      {enabled:true,  rollout:100, description:'omega-workflow.js automated workflows'},
    'finops_tracking':      {enabled:true,  rollout:100, description:'omega-finops.js cost tracking'},
    'capability_badges':    {enabled:true,  rollout:100, description:'Capability identity badges on pages'},
    'chart_visualisations': {enabled:true,  rollout:100, description:'Chart.js axis radar and auth-line charts'},
    'markdown_rendering':   {enabled:true,  rollout:100, description:'marked.js markdown in chatbot responses'},
    'guardian_score':       {enabled:true,  rollout:100, description:'Zero Trust guardian score in topbar'},
    'token_economy':        {enabled:false, rollout:0,   description:'ΩSYD token transactions — dormant pending legal'},
    'payments':             {enabled:false, rollout:0,   description:'Stripe payment processing — dormant'},
    'kyc_verification':     {enabled:false, rollout:0,   description:'Full KYC/AML verification — pending legal'},
    'enterprise_api':       {enabled:false, rollout:10,  description:'Enterprise API key access — limited beta'},
    'dark_mode_toggle':     {enabled:false, rollout:50,  description:'Light/dark mode selector in settings'},
  };

  /* ── A/B EXPERIMENTS ──────────────────────────────────────────── */
  var EXPERIMENTS = {
    'copilot_position': {
      status:'running',
      variants:['bottom_right','bottom_left'],
      weights:[70,30],
      hypothesis:'Bottom-right copilot button increases engagement vs bottom-left',
      metric:'copilot_opens_per_session',
    },
    'tab_bar_style': {
      status:'running',
      variants:['underline','pill'],
      weights:[50,50],
      hypothesis:'Pill-style tabs increase tab switching engagement',
      metric:'tab_switches_per_session',
    },
    'auth_formula_display': {
      status:'running',
      variants:['short','full'],
      weights:[50,50],
      hypothesis:'Displaying full formula increases member trust in authority scores',
      metric:'formula_clicks_per_session',
    },
  };

  /* ── COHORT ASSIGNMENT (deterministic from uid) ───────────────── */
  function hashUid(uid,salt){
    var s=String(uid||'anon')+String(salt||'');
    var h=0;
    for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h;}
    return Math.abs(h)%100;
  }

  function getVariant(experimentId, uid){
    var exp=EXPERIMENTS[experimentId];
    if(!exp||exp.status!=='running') return null;
    var bucket=hashUid(uid,experimentId);
    var cumWeight=0;
    for(var i=0;i<exp.variants.length;i++){
      cumWeight+=exp.weights[i];
      if(bucket<cumWeight) return exp.variants[i];
    }
    return exp.variants[0];
  }

  /* ── FEATURE FLAG CHECK ───────────────────────────────────────── */
  function isEnabled(flag, uid){
    var f=FLAGS[flag];
    if(!f) return false;
    if(!f.enabled) return false;
    if(f.rollout>=100) return true;
    /* Progressive rollout: deterministic cohort */
    var bucket=hashUid(uid||'anon',flag);
    return bucket<f.rollout;
  }

  /* ── EXPERIMENT TRACKING ──────────────────────────────────────── */
  var _assignments={};
  function track(experimentId, variant, metric, value){
    _assignments[experimentId]=variant;
    if(window.OmegaTelemetry){
      window.OmegaTelemetry.track('experiment_event',{
        experiment:experimentId,variant:variant,metric:metric,value:value||1
      });
    }
  }

  /* ── APPLY EXPERIMENTS ON LOAD ────────────────────────────────── */
  document.addEventListener('omega:populated',function(e){
    var pr=e.detail&&e.detail.profile;
    var uid=pr&&pr.id;
    /* Apply copilot position experiment */
    var copilotPos=getVariant('copilot_position',uid);
    if(copilotPos==='bottom_left'){
      setTimeout(function(){
        var btn=document.getElementById('omega-copilot');
        if(btn) btn.style.right='auto',btn.style.left='24px';
        var voiceBtn=document.getElementById('omega-voice-btn');
        if(voiceBtn) voiceBtn.style.left='auto',voiceBtn.style.right='24px';
      },1000);
    }
    track('copilot_position',copilotPos,'assignment',1);
    /* Load flags from Supabase (async, don't block) */
    if(window.__omegaSb){
      window.__omegaSb.from('feature_flags').select('flag_id,is_enabled,rollout_pct').then(function(r){
        if(r.data) r.data.forEach(function(f){
          FLAGS[f.flag_id]={enabled:f.is_enabled,rollout:f.rollout_pct||0};
        });
      }).catch(function(){});
    }
  });

  window.OmegaExperiment={
    isEnabled:isEnabled,
    getVariant:getVariant,
    track:track,
    FLAGS:FLAGS,
    EXPERIMENTS:EXPERIMENTS,
    getAssignments:function(){return Object.assign({},_assignments);}
  };
})();
