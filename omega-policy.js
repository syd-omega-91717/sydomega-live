/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN POLICY ENGINE (omega-policy.js)
   
   Externalises business rules, compliance policies, approval workflows,
   and AI guardrails into configurable policies instead of hard-coded logic.
   
   Inspired by:
   - Open Policy Agent (OPA): declarative policy as code
   - AWS IAM: effect/principal/action/resource/condition model
   - Salesforce Einstein Rules: business rule externalisation
   - NIST SP 800-162: ABAC (Attribute-Based Access Control)
   
   Policy Types:
   A. GATE_POLICY     — Authority thresholds for content/feature access
   B. APPROVAL_POLICY — Which actions need human approval
   C. AI_GUARDRAIL    — What the AI concierge can and cannot say/do
   D. COMPLIANCE_RULE — GDPR, CCPA, ISO 27001 compliance checks
   E. RATE_POLICY     — Per-member/per-session rate limits
   F. BUSINESS_RULE   — Platform-specific business logic
   ========================================================================== */
(function(){
  if(window.__omegaPolicyActive) return;
  window.__omegaPolicyActive = true;

  /* ── POLICY STORE ─────────────────────────────────────────────── */
  /* Canonical policies. Can be overridden from Supabase governance_policies. */
  var POLICIES = {
    /* GATE POLICIES — auth threshold required per feature */
    'gate:cinema':          {type:'gate',  effect:'allow', condition:{auth:{gte:0}},     description:'Cinema available to all approved members'},
    'gate:enterprise':      {type:'gate',  effect:'allow', condition:{is_owner:true},    description:'Enterprise panel: owner only'},
    'gate:observatory':     {type:'gate',  effect:'allow', condition:{is_owner:true},    description:'Observatory: owner only'},
    'gate:governance':      {type:'gate',  effect:'allow', condition:{auth:{gte:9.28}},  description:'Governance visible at Gate 4 (Keeper)'},
    'gate:sovereign_ai':    {type:'gate',  effect:'allow', condition:{auth:{gte:6.96}},  description:'AI command at Gate 3 (Scholar)'},
    'gate:leaderboard':     {type:'gate',  effect:'allow', condition:{auth:{gte:0}},     description:'Leaderboard: all approved members'},
    'gate:investment':      {type:'gate',  effect:'allow', condition:{auth:{gte:4.64}},  description:'Investment at Gate 2 (Acolyte)'},
    'gate:blockchain':      {type:'gate',  effect:'deny',  condition:{payments_active:false}, description:'Blockchain dormant until token economy activates'},
    /* APPROVAL POLICIES — which actions need human oversight */
    'approve:erasure':      {type:'approval', effect:'require_confirm', approver:'member',     description:'GDPR erasure requires member to type CONFIRM'},
    'approve:payment':      {type:'approval', effect:'require_confirm', approver:'member',     description:'Payment requires explicit member confirmation'},
    'approve:token_launch': {type:'approval', effect:'block',           approver:'legal',      description:'Token launch requires licensed legal counsel'},
    'approve:access_grant': {type:'approval', effect:'require_owner',   approver:'owner',      description:'Trial/permanent access requires owner approval'},
    /* AI GUARDRAILS — what the AI can and cannot do */
    'ai:fabricate_data':    {type:'guardrail', effect:'deny',  description:'AI must never fabricate platform data, balances, or metrics'},
    'ai:legal_advice':      {type:'guardrail', effect:'deny',  description:'AI must not give legal/financial/medical advice'},
    'ai:owner_impersonate': {type:'guardrail', effect:'deny',  description:'AI must never claim to be the platform owner'},
    'ai:canon_override':    {type:'guardrail', effect:'deny',  description:'AI must not override canonical formula/lattice/gates'},
    'ai:max_tokens':        {type:'guardrail', effect:'limit', value:300,  description:'AI responses capped at 300 tokens for conciseness'},
    /* COMPLIANCE RULES — GDPR/CCPA/ISO */
    'compliance:data_retention': {type:'compliance', effect:'enforce', rule:'Delete user data within 30 days of erasure request (GDPR Art.17)', standard:'GDPR'},
    'compliance:consent_before_analytics':{type:'compliance',effect:'require',rule:'Collect analytics only after analytics consent (GDPR Art.6)',standard:'GDPR'},
    'compliance:no_sensitive_logging':{type:'compliance',effect:'deny',rule:'Never log passwords, keys, or PII in plain text (ISO 27001 A.8.15)',standard:'ISO27001'},
    /* BUSINESS RULES — platform-specific */
    'biz:formula_cubic':    {type:'business', effect:'enforce', rule:'Authority formula must use cubic exponents: sqrt(A³+B³+C³)×φ/e',  critical:true},
    'biz:apex_constant':    {type:'business', effect:'enforce', rule:'Authority apex is permanently 27.8367',                            critical:true},
    'biz:trial_duration':   {type:'business', effect:'enforce', rule:'Trial period is exactly 557 seconds (9 min 17 sec)',              critical:true},
    'biz:no_fake_data':     {type:'business', effect:'deny',    rule:'No fabricated balances, token values, or financial figures',       critical:true},
    'biz:static_production':{type:'business', effect:'enforce', rule:'Live site uses static HTML/JS only. No React/build-step in prod', critical:true},
    /* RATE POLICIES */
    'rate:api_calls':       {type:'rate', effect:'limit', max:100, window:3600,  unit:'calls/hour', description:'API calls per member per hour'},
    'rate:ai_queries':      {type:'rate', effect:'limit', max:50,  window:86400, unit:'queries/day', description:'AI concierge queries per member per day'},
    'rate:task_completions':{type:'rate', effect:'limit', max:200, window:86400, unit:'tasks/day',   description:'Task completions per member per day'},
  };

  /* ── POLICY EVALUATION ────────────────────────────────────────── */
  function evaluate(policyId, context){
    var policy = POLICIES[policyId];
    if(!policy) return {effect:'allow',reason:'no_policy_found',policyId:policyId};
    var ctx = context || {};
    /* Gate policies */
    if(policy.type==='gate'){
      if(policy.condition.is_owner&&!ctx.is_owner) return {effect:'deny',reason:'owner_only',policy:policyId};
      if(policy.condition.auth&&ctx.auth!==undefined){
        if(policy.condition.auth.gte!==undefined&&ctx.auth<policy.condition.auth.gte){
          return {effect:'deny',reason:'insufficient_auth',required:policy.condition.auth.gte,actual:ctx.auth,policy:policyId};
        }
      }
      if(policy.condition.payments_active===false&&!ctx.payments_active){
        return {effect:'deny',reason:'feature_dormant',policy:policyId,description:policy.description};
      }
    }
    /* Guardrail policies */
    if(policy.type==='guardrail'&&policy.effect==='deny'){
      if(window.OmegaTelemetry) window.OmegaTelemetry.track('policy_guardrail',{policy:policyId});
      return {effect:'deny',reason:'ai_guardrail',policy:policyId,description:policy.description};
    }
    /* Approval policies */
    if(policy.type==='approval'&&policy.effect==='block'){
      return {effect:'deny',reason:'legal_block',approver:policy.approver,policy:policyId,description:policy.description};
    }
    return {effect:policy.effect||'allow',policy:policyId,description:policy.description};
  }

  /* ── BATCH EVALUATE (check multiple policies at once) ─────────── */
  function evaluateAll(policyIds, context){
    var results={};var anyDeny=false;
    policyIds.forEach(function(id){
      var r=evaluate(id,context);results[id]=r;
      if(r.effect==='deny')anyDeny=true;
    });
    return {allowed:!anyDeny,results:results};
  }

  /* ── GATE CHECK (for page-level access control) ───────────────── */
  function gateCheck(pageName, profile){
    var policyId='gate:'+pageName.replace('-','_').replace('.html','');
    var PHI=1.6180339887,EU=2.7182818285;
    var a=Number(profile.axis_a||0.001),b=Number(profile.axis_b||0.001),c=Number(profile.axis_c||0.001);
    var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    var ctx={is_owner:profile.is_owner||false,auth:auth,payments_active:false};
    return evaluate(policyId,ctx);
  }

  /* ── AI GUARDRAIL CHECK ───────────────────────────────────────── */
  function checkAIResponse(response){
    /* Check if AI response violates guardrails */
    var violations=[];
    var resp=(response||'').toLowerCase();
    if(/i am.*owner|i am.*major|sleiman dagher/i.test(resp)){
      violations.push(evaluate('ai:owner_impersonate',{}));
    }
    if(/sqrt\s*\(.*\^2|a\s*squared|a²/i.test(resp)){
      violations.push({effect:'deny',reason:'formula_violation',policy:'biz:formula_cubic'});
    }
    return {clean:violations.length===0,violations:violations};
  }

  /* ── LOAD POLICIES FROM SUPABASE ──────────────────────────────── */
  async function syncFromDB(){
    if(!window.__omegaSb) return;
    try{
      var r=await window.__omegaSb.from('governance_policies').select('policy_id,description').eq('status','active');
      if(r.data) r.data.forEach(function(p){
        if(!POLICIES[p.policy_id]) POLICIES[p.policy_id]={type:'business',effect:'enforce',rule:p.description};
      });
    }catch(e){}
  }

  /* Init */
  document.addEventListener('omega:populated',function(){syncFromDB();});

  window.OmegaPolicy={
    evaluate:evaluate,
    evaluateAll:evaluateAll,
    gateCheck:gateCheck,
    checkAIResponse:checkAIResponse,
    POLICIES:POLICIES,
    getAll:function(){return Object.assign({},POLICIES);},
    add:function(id,policy){POLICIES[id]=policy;}
  };
})();
