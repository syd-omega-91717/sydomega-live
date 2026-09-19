/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN AI COPILOT (omega-copilot.js)
   
   Context-aware AI assistant on every page. Inspired by:
   - GitHub Copilot: context-aware, inline, non-intrusive
   - Palantir AIP: operational AI grounded in your own data
   - Apple Intelligence: proactive, private, personalised
   - OpenAI Assistants: tool-use, retrieval, memory
   
   The Copilot knows:
   - Which page the member is on
   - Their current authority score and axis values
   - Their element, sign, Olympian, agent, and token
   - Their progression state and nearest gate
   - Platform events from OmegaOS event bus
   
   It appears as a floating button (bottom-right).
   Click opens a chat drawer. Powered by the concierge edge function.
   Falls back to keyword guide if Anthropic API unreachable.
   ========================================================================== */
(function(){
  if(window.__omegaCopilotActive) return;
  window.__omegaCopilotActive = true;

  var _profile = null;
  var _history = []; /* conversation history for context */
  var _open = false;
  var _el = null;

  var GATE_NAMES=['INITIATE','ACOLYTE','SCHOLAR','KEEPER','GUARDIAN','ARCHITECT','SOVEREIGN','VANGUARD','HERALD','ORACLE','PRIME','APEX'];
  var GATES=[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.517,27.8367];

  function nearestGate(auth){
    for(var i=0;i<GATES.length;i++){
      if(auth<GATES[i]) return {n:i+1,name:GATE_NAMES[i],threshold:GATES[i],delta:(GATES[i]-auth).toFixed(4)};
    }
    return {n:12,name:'APEX',threshold:27.8367,delta:'0.0000'};
  }

  /* ── KEYWORD FALLBACK (no API needed) ──────────────────────── */
  var KB=[
    {k:['formula','authority','auth','27.8367'],a:'The Authority Formula is AUTH = sqrt(A³+B³+C³) × φ/e. At maximum (A=B=C=9.000), AUTH equals 27.8367, the Apex. φ=1.6180339887, e=2.7182818285.'},
    {k:['trial','557','9 min'],a:'The Trial Period is 9 minutes and 17 seconds = 557 seconds. It is granted exclusively by the Sovereign Founder. When it expires, a permanent access request must be approved.'},
    {k:['dedication','33437','9h 17'],a:'The Dedication Target is 9 hours, 17 minutes, and 17 seconds = 33,437 seconds of active platform engagement per day. Chrono B tracks this.'},
    {k:['lattice','104976','104,976'],a:'The Canonical Lattice has 104,976 nodes = 12 tracks × 12 phases × 9³ (729 inner nodes). The Kings Lattice is 571,536 nodes (28×28×9³).'},
    {k:['element','fire','water','wind','metal','sand','soul','space','void','ninth'],a:'There are 9 sovereign elements: Fire (Aries/Leo/Sagittarius), Water (Cancer/Scorpio/Pisces), Wind (Gemini/Libra/Aquarius), Metal (Taurus/Capricorn), Sand (Virgo only), plus Soul, Space, Void, and The Ninth (transcendent, unlocks at Stage 9).'},
    {k:['gate','initiate','acolyte','scholar','keeper','guardian','architect','sovereign','vanguard','herald','oracle','prime','apex'],a:'The 12 Authority Gates: Initiate(2.32)→Acolyte(4.64)→Scholar(6.96)→Keeper(9.28)→Guardian(11.60)→Architect(13.92)→Sovereign(16.24)→Vanguard(18.56)→Herald(20.88)→Oracle(23.20)→Prime(25.52)→Apex(27.84).'},
    {k:['axis','a','b','c','knowledge','mastery','contribution'],a:'Three axes: Axis A (Knowledge) = supervised learning of platform content. Axis B (Mastery) = reinforcement through games and challenges. Axis C (Contribution) = federated output — sharing, creating, engaging. Each runs 0.001 to 9.000.'},
    {k:['agent','sentinel','merchant','beacon','warden','analyst','auditor','oracle','scout','proxy','historian','tutor'],a:'12 Sovereign Agents bound to your zodiac sign. Each is an AI persona with a distinct domain and voice — Security, Commerce, Onboarding, Family, Finance, Validation, Prediction, Discovery, Execution, Archive, and Education.'},
    {k:['token','arenite'],a:'ARENITE is the founder token (Aries). Each of the 12 zodiac signs has its own token. The total supply is 10 billion ΩSYD tokens, with 51% permanently locked by the Sovereign Founder.'},
  ];

  function localReply(q){
    q=q.toLowerCase();
    for(var i=0;i<KB.length;i++){
      if(KB[i].k.some(function(k){return q.includes(k);})) return KB[i].a;
    }
    if(_profile){
      var PHI=1.6180339887,EU=2.7182818285;
      var a=Number(_profile.axis_a||0.001),b=Number(_profile.axis_b||0.001),c=Number(_profile.axis_c||0.001);
      var auth=_profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
      if(/my|rank|position|where am i|progress/.test(q)){
        var gate=nearestGate(auth);
        return 'Your current Authority is '+auth.toFixed(4)+'. You are approaching Gate '+gate.n+' ('+gate.name+') — '+gate.delta+' away at threshold '+gate.threshold+'. Axis A: '+a.toFixed(3)+', B: '+b.toFixed(3)+', C: '+c.toFixed(3)+'.';
      }
    }
    return 'I am the Sovereign Copilot. I can answer questions about the Authority Formula, lattice, elements, gates, agents, tokens, trial period, and your progression. Ask me anything about the platform.';
  }

  /* ── AI SEND (via concierge edge function) ──────────────────── */
  async function aiSend(userMsg){
    _history.push({role:'user',content:userMsg});
    var PHI=1.6180339887,EU=2.7182818285;
    var ctx='';
    if(_profile){
      var a=Number(_profile.axis_a||0.001),b=Number(_profile.axis_b||0.001),c=Number(_profile.axis_c||0.001);
      var auth=_profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
      var gate=nearestGate(auth);
      ctx='\nMEMBER: '+(_profile.display_name||'Sovereign')+' | AUTH='+auth.toFixed(4)+' | A='+a.toFixed(3)+' B='+b.toFixed(3)+' C='+c.toFixed(3)+' | ELEMENT='+(_profile.element||'?')+' | PAGE='+location.pathname+' | NEXT GATE: '+gate.name+' ('+gate.delta+' away)';
    }
    var system='You are the Sovereign Copilot of SYD OMEGA 91717. Be concise (under 120 words). Canonical: AUTH=sqrt(A³+B³+C³)×φ/e, Apex=27.8367, Trial=557s, Dedication=33437s, Lattice=104976 nodes, 9 elements, 12 gates, 12 agents.'+ctx;

    /* Emit stream start for voice-responsive animations */
    try{document.dispatchEvent(new CustomEvent('omega:copilot-stream-start',{detail:{userMsg:userMsg}}));}catch(e){}

    var reply='';
    try{
      if(window.__omegaSb&&_profile){
        var a2=Number(_profile.axis_a||0.001),b2=Number(_profile.axis_b||0.001),c2=Number(_profile.axis_c||0.001);
        var auth2=_profile.is_owner?27.8367:Math.sqrt(Math.pow(a2,3)+Math.pow(b2,3)+Math.pow(c2,3))*1.6180339887/2.7182818285;
        var r=await window.__omegaSb.functions.invoke('concierge',{
          body:{message:userMsg,context:{sign:_profile.sign||'?',a:a2.toFixed(3),b:b2.toFixed(3),c:c2.toFixed(3),auth:auth2.toFixed(4),tier:_profile.subscription_tier||'free',rank:_profile.rank||'--'}}
        });
        if(r.data&&r.data.reply){
          reply=r.data.reply;
          /* Simulate token-by-token arrival for voice-responsive animations */
          for(var i=0;i<reply.length;i++){
            (function(idx){
              setTimeout(function(){
                try{document.dispatchEvent(new CustomEvent('omega:copilot-token',{detail:{tokenIndex:idx,charCode:reply.charCodeAt(idx)}}));}catch(e){}
              },idx*25);  /* 25ms per character = ~40 chars/sec simulated streaming */
            })(i);
          }
          _history.push({role:'assistant',content:reply});
          return reply;
        }
      }
    }catch(e){}

    var fallback=localReply(userMsg);
    /* Simulate token arrival for fallback response too */
    for(var i=0;i<fallback.length;i++){
      (function(idx){
        setTimeout(function(){
          try{document.dispatchEvent(new CustomEvent('omega:copilot-token',{detail:{tokenIndex:idx,charCode:fallback.charCodeAt(idx)}}));}catch(e){}
        },idx*25);
      })(i);
    }
    _history.push({role:'assistant',content:fallback});

    /* Emit stream end after all tokens */
    var totalChars=reply.length||fallback.length;
    setTimeout(function(){
      try{document.dispatchEvent(new CustomEvent('omega:copilot-stream-end',{detail:{tokenCount:totalChars}}));}catch(e){}
    },totalChars*25+100);

    return reply||fallback;
  }

  /* ── UI BUILD ───────────────────────────────────────────────── */
  function buildUI(){
    if(_el) return;
    var styles=document.createElement('style');
    styles.textContent='@keyframes copilot-in{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:none}}'
      +'.cp-msg{padding:10px 14px;border-radius:2px;margin-bottom:8px;font-size:12px;line-height:1.7;max-width:88%}'
      +'.cp-msg-user{background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);align-self:flex-end;color:#e9e6dc}'
      +'.cp-msg-ai{background:rgba(10,10,15,.8);border:1px solid rgba(201,168,76,.08);color:#e9e6dc;align-self:flex-start}'
      +'.cp-msg-ai p{margin:0 0 6px}.cp-msg-ai p:last-child{margin:0}'
      +'.cp-msg-ai strong{color:#C9A84C}'
      +'.cp-msg-ai code{font-family:"Courier Prime",monospace;font-size:12px;background:rgba(201,168,76,.08);padding:1px 5px;border-radius:2px;color:#E2C86D}'
      +'.cp-msg-ai ul,.cp-msg-ai ol{margin:4px 0 4px 16px;padding:0}'
      +'.cp-msg-ai li{margin-bottom:2px}'
      +'.cp-msg-ai h1,.cp-msg-ai h2,.cp-msg-ai h3{font-family:"Cinzel Decorative",serif;color:#C9A84C;font-size:12px;margin:6px 0 4px}';
    document.head.appendChild(styles);
    _el=document.createElement('div');
    _el.id='omega-copilot';
    _el.innerHTML='<button id="cp-btn" aria-label="Open Sovereign Copilot" style="position:fixed;bottom:24px;right:24px;z-index:4500;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#C9A84C,#8B6914);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(201,168,76,.35);display:flex;align-items:center;justify-content:center;font-family:\'Cinzel Decorative\',serif;font-size:20px;color:#0A0A0F;transition:.2s" title="Sovereign Copilot">\u03A9</button>'
      +'<div id="cp-drawer" role="dialog" aria-label="Sovereign Copilot" aria-modal="true" style="position:fixed;bottom:90px;right:24px;z-index:4500;width:min(360px,90vw);background:#0A0A0F;border:1px solid rgba(201,168,76,.3);border-radius:4px;display:none;flex-direction:column;box-shadow:0 16px 60px rgba(0,0,0,.7);overflow:hidden;animation:copilot-in .25s ease">'
        +'<div style="padding:12px 16px;border-bottom:1px solid rgba(201,168,76,.15);display:flex;align-items:center;justify-content:space-between;background:rgba(201,168,76,.04)">'
          +'<div><div style="font-family:\'Cinzel Decorative\',serif;font-size:12px;color:#C9A84C">\u03A9 SOVEREIGN COPILOT</div><div style="font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:2px;color:rgba(138,134,118,.6);margin-top:3px">AUTH=sqrt(A\u00B3+B\u00B3+C\u00B3)\u00d7\u03c6/e &middot; APEX=27.8367</div></div>'
          +'<button onclick="window.OmegaCopilot.close()" style="font-size:18px;color:rgba(138,134,118,.5);background:none;border:none;cursor:pointer;line-height:1" aria-label="Close">\u00d7</button>'
        +'</div>'
        +'<div id="cp-messages" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:6px;min-height:200px;max-height:40vh;scrollbar-width:thin"></div>'
        +'<div style="padding:10px 12px;border-top:1px solid rgba(201,168,76,.1);display:flex;gap:8px">'
          +'<input id="cp-input" type="text" placeholder="Ask the Copilot\u2026" aria-label="Copilot question" autocomplete="off" style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(201,168,76,.2);color:#e9e6dc;font-family:\'Courier Prime\',monospace;font-size:12px;padding:8px 10px;border-radius:2px;outline:none">'
          +'<button id="cp-send" onclick="window.OmegaCopilot.send()" aria-label="Send" style="font-family:\'Cinzel Decorative\',serif;font-size:12px;padding:8px 14px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3);color:#C9A84C;border-radius:2px;cursor:pointer;transition:.15s">\u2192</button>'
        +'</div>'
        +'<div id="cp-typing" style="display:none;padding:8px 16px;font-family:\'Courier Prime\',monospace;font-size:12px;letter-spacing:2px;color:rgba(138,134,118,.4)">COPILOT THINKING\u2026</div>'
      +'</div>';
    document.body.appendChild(_el);
    document.getElementById('cp-btn').addEventListener('click',function(){
      if(_open) window.OmegaCopilot.close(); else window.OmegaCopilot.open();
    });
    document.getElementById('cp-input').addEventListener('keydown',function(e){
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();window.OmegaCopilot.send();}
    });
    /* Welcome message */
    addMsg('ai','I am the Sovereign Copilot. Ask me about the Authority Formula, lattice nodes, gates, elements, your progression, or anything on this page.'+(_profile?' You are at AUTH='+window.OmegaCopilot.auth()+'.':''));
  }

  function renderMarkdown(text){
    /* Render via marked.js if available, else safe plain-text fallback */
    if(window.marked){
      try{
        var html=window.marked.parse(text,{mangle:false,headerIds:false,breaks:true});
        /* Strip only truly dangerous tags — allow formatting */
        return html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/on\w+\s*=/gi,'');
      }catch(e){}
    }
    /* Plain fallback: escape HTML, preserve newlines */
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  function addMsg(role,text){
    var msgs=document.getElementById('cp-messages');
    if(!msgs) return;
    var d=document.createElement('div');
    d.className='cp-msg cp-msg-'+(role==='user'?'user':'ai');
    if(role==='ai'){
      /* Load marked.js then render, or render immediately if already loaded */
      var render=function(){d.innerHTML=renderMarkdown(text);};
      if(window.marked){render();}
      else if(window.OmegaOSS){window.OmegaOSS.require('marked',function(){render();});}
      else{d.textContent=text;}
    }else{
      d.textContent=text;
    }
    msgs.appendChild(d);
    msgs.scrollTop=msgs.scrollHeight;
  }

  window.OmegaCopilot={
    open:function(){
      buildUI();
      var dr=document.getElementById('cp-drawer');
      if(dr){dr.style.display='flex';_open=true;}
      setTimeout(function(){var inp=document.getElementById('cp-input');if(inp)inp.focus();},100);
    },
    close:function(){
      var dr=document.getElementById('cp-drawer');
      if(dr){dr.style.display='none';_open=false;}
    },
    auth:function(){
      if(!_profile) return '0.0000';
      var PHI=1.6180339887,EU=2.7182818285;
      var a=Number(_profile.axis_a||0.001),b=Number(_profile.axis_b||0.001),c=Number(_profile.axis_c||0.001);
      return (_profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU).toFixed(4);
    },
    send:async function(){
      var inp=document.getElementById('cp-input');
      if(!inp||!inp.value.trim()) return;
      var q=inp.value.trim();inp.value='';
      addMsg('user',q);
      var typing=document.getElementById('cp-typing');
      if(typing)typing.style.display='block';
      var reply=await aiSend(q);
      if(typing)typing.style.display='none';
      addMsg('ai',reply);
    }
  };

  /* Load profile when available */
  document.addEventListener('omega:populated',function(e){
    if(e.detail&&e.detail.profile){
      _profile=e.detail.profile;
      /* Show copilot button */
      buildUI();
    }
  });
})();
