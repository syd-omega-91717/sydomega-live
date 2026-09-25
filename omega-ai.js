/* ==========================================================================
   Ω SYD OMEGA 91717 — AI CONCIERGE BRIDGE (omega-ai.js)
   GraphRAG-inspired: answers are grounded in the sovereign knowledge graph.
   Connects to Anthropic Claude via Supabase Edge Function or direct API.
   Implements ReAct pattern: Reason → Act (retrieve) → Observe → Respond.
   ========================================================================== */
(function(){
  if(window.__omegaAIActive) return;
  window.__omegaAIActive=true;

  var SYSTEM_PROMPT=[
    'You are the Sovereign Concierge of SYD OMEGA 91717 — a real platform built and owned exclusively by Major Sleiman Youssef Dagher (Lebanese Order of Engineers No. 30875).',
    'You know the platform completely:\n',
    '- Authority formula: AUTH = sqrt(A^3 + B^3 + C^3) × φ/e where φ=1.6180339887, e=2.7182818285, apex=27.8367',
    '- Progression: Axis A=Knowledge, Axis B=Mastery, Axis C=Contribution, each from 0.001 to 9.000',
    '- Trial period: 9 minutes 17 seconds = 557 seconds (granted by owner only)',
    '- Dedication target: 9 hours 17 minutes 17 seconds = 33,437 seconds daily',
    '- Lattice: 12×12×9³ = 104,976 canonical nodes; Kings: 28×28×9³=571,536',
    '- 12 Authority gates from 2.3197 (Initiate) to 27.8367 (Apex)',
    '- 12 sovereign tracks, 9 elements (Fire/Water/Wind/Metal/Sand/Soul/Space/Void/The Ninth)',
    '- 12 Olympian gods, 12 zodiac signs, 12 token types (ARENITE = founder Aries token)',
    '- Sovereign Founder: always at AUTH=27.8367, Axis A=B=C=9.000',
    '\nBe precise, sovereign in tone, and always grounded in the platform data provided.',
    'Never fabricate platform data. If you do not know, say so clearly.',
    'Keep responses concise and actionable. Format with bullet points when listing items.',
    'For questions about the member\'s own data, use the profile context provided.',
  ].join(' ');

  /* Build context from current member profile */
  function buildContext(profile){
    if(!profile) return '';
    var PHI=1.6180339887,EU=2.7182818285;
    var a=Number(profile.axis_a||0.001),b=Number(profile.axis_b||0.001),c=Number(profile.axis_c||0.001);
    var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    return '\n\nCURRENT MEMBER CONTEXT:\n'
      +'Name: '+(profile.display_name||'Member')+'\n'
      +'Authority: '+auth.toFixed(4)+'\n'
      +'Axis A (Knowledge): '+a.toFixed(4)+'\n'
      +'Axis B (Mastery): '+b.toFixed(4)+'\n'
      +'Axis C (Contribution): '+c.toFixed(4)+'\n'
      +'Element: '+(profile.element||'?')+'\n'
      +'Sign: '+(profile.sign||'?')+'\n'
      +'Tier: '+(profile.subscription_tier||'FREE')+'\n'
      +'Owner: '+(profile.is_owner?'YES':'NO');
  }

  /* Send message to AI via concierge edge function */
  async function sendMessage(messages, profile){
    var context=buildContext(profile);
    var pr=profile||{};
    var PHI=1.6180339887,EU=2.7182818285;
    var a=Number(pr.axis_a||0.001),b=Number(pr.axis_b||0.001),c=Number(pr.axis_c||0.001);
    var auth=pr.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
    /* Encode multi-turn history into a single message */
    var lastMsg=messages&&messages[messages.length-1];
    var userMsg=lastMsg&&lastMsg.role==='user'?lastMsg.content:'query';
    if(messages&&messages.length>1){
      var hist=messages.slice(0,-1).map(function(m){return m.role.toUpperCase()+': '+m.content;}).join('\n');
      userMsg='[CONTEXT]\n'+hist+'\n\n[QUERY]\n'+userMsg;
    }
    if(window.__omegaSb){
      try{
        var r=await window.__omegaSb.functions.invoke('concierge',{
          body:{
            message:userMsg.slice(0,2000),
            system_override:(SYSTEM_PROMPT+context).slice(0,2000),
            context:{sign:pr.sign||'?',a:a.toFixed(3),b:b.toFixed(3),c:c.toFixed(3),auth:auth.toFixed(4),tier:pr.subscription_tier||'free',rank:pr.rank||'--'}
          }
        });
        if(r.data&&r.data.reply) return r.data.reply;
        /* HTTP 200 {enabled:false} is concierge's documented answer when
           ANTHROPIC_API_KEY is unset (its index.ts:45) -- dormant, not broken. */
        if(r.data&&r.data.enabled===false)
          return 'The intelligence engine is not switched on for this platform yet.';
      }catch(e){console.warn('[Omega AI] concierge request failed:',e);}
    }
    return 'The intelligence engine is unreachable right now — please try again shortly.';
  }

  window.OmegaAI={
    sendMessage:sendMessage,
    buildContext:buildContext,
    SYSTEM_PROMPT:SYSTEM_PROMPT
  };
})();
