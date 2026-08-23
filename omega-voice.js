/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN VOICE INTERFACE (omega-voice.js)
   
   Voice commands and text-to-speech for the sovereign platform.
   Inspired by:
   - Apple Siri: natural language commands, system integration
   - Google Assistant: contextual awareness, multimodal
   - Amazon Alexa: skills model, intent recognition
   
   Commands supported (intents):
   - "What is my authority?" → get_status
   - "Go to [page]" → navigate
   - "Open [agent]" → agent_activate
   - "How do I [task]?" → ask_intelligence
   - "Read this page" → text_to_speech (reads page content)
   - "Stop" → cancel
   
   Accessibility note: Voice is a supplement, never the only path.
   Every voice action has a visual equivalent. Reduce-motion/hearing
   preferences are respected.
   ========================================================================== */
(function(){
  if(window.__omegaVoiceActive) return;
  window.__omegaVoiceActive = true;

  var SR = window.SpeechRecognition||window.webkitSpeechRecognition||null;
  var SS = window.speechSynthesis||null;
  var _recognition=null,_listening=false,_btn=null;

  /* ── INTENT MAP ───────────────────────────────────────────────── */
  var INTENTS=[
    {p:/my authority|my auth|what is my score/i, handler:async function(){
      var pr=window.__omegaCurrentProfile;if(!pr){speak('No profile loaded.');return;}
      if(window.OmegaIntelligence){
        var r=await window.OmegaIntelligence.tools.get_member_status.execute();
        speak('Your authority score is '+r.auth+'. Axis A is '+r.axis_a+', B is '+r.axis_b+', C is '+r.axis_c+'. Your next gate is '+r.gate_name+'.');
      }
    }},
    {p:/go to dashboard|open dashboard/i, handler:function(){speak('Opening dashboard.');location.href='/dashboard.html';}},
    {p:/go to vault|open vault/i, handler:function(){speak('Opening vault.');location.href='/vault.html';}},
    {p:/go to gaming|open gaming/i, handler:function(){speak('Opening gaming universe.');location.href='/gaming.html';}},
    {p:/go to agents|open agents/i, handler:function(){speak('Opening sovereign agents.');location.href='/sovereign-ai.html';}},
    {p:/go to leaderboard|open leaderboard/i, handler:function(){speak('Opening leaderboard.');location.href='/leaderboard.html';}},
    {p:/go to analytics|open analytics/i, handler:function(){speak('Opening analytics.');location.href='/analytics.html';}},
    {p:/read (?:this )?page/i, handler:function(){
      var main=document.querySelector('.main,main');
      if(!main){speak('Nothing to read.');return;}
      var text=main.innerText.slice(0,500).replace(/\s+/g,' ');
      speak(text);
    }},
    {p:/stop|cancel|quiet/i, handler:function(){if(SS)SS.cancel();_setListening(false);}},
    {p:/.+/, handler:async function(q){
      speak('Let me think about that.');
      if(window.OmegaIntelligence){
        var r=await window.OmegaIntelligence.ask(q);
        if(r)speak(r.slice(0,300));
      } else {speak('Intelligence engine loading.');}
    }}
  ];

  /* ── SPEECH SYNTHESIS ─────────────────────────────────────────── */
  function speak(text){
    if(!SS||!text) return;
    SS.cancel();
    var u=new SpeechSynthesisUtterance(text);
    u.rate=1.1;u.pitch=1;u.volume=.85;
    /* Prefer English voice */
    var voices=SS.getVoices();
    var eng=voices.find(function(v){return v.lang.startsWith('en')&&v.name.includes('Google');})
      ||voices.find(function(v){return v.lang.startsWith('en');});
    if(eng) u.voice=eng;
    SS.speak(u);
  }

  /* ── SPEECH RECOGNITION ───────────────────────────────────────── */
  function processQuery(q){
    q=q.trim();
    if(window.OmegaNotify)window.OmegaNotify.showToast('VOICE: "'+q.slice(0,40)+'"','info');
    if(window.OmegaTelemetry)window.OmegaTelemetry.track('voice_command',{query:q.slice(0,100)});
    for(var i=0;i<INTENTS.length;i++){
      if(INTENTS[i].p.test(q)){INTENTS[i].handler(q);break;}
    }
  }

  function _setListening(state){
    _listening=state;
    if(_btn){
      _btn.title=state?'Click to stop listening':'Click to speak (Voice Command)';
      _btn.style.background=state?'rgba(0,229,255,.2)':'linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.05))';
      _btn.style.borderColor=state?'var(--cyan,#00E5FF)':'rgba(201,168,76,.3)';
      _btn.setAttribute('aria-pressed',state?'true':'false');
      _btn.textContent=state?'\uD83C\uDFA4':'';  /* mic emoji when listening */
      _btn.style.fontSize=state?'18px':'14px';
    }
  }

  function startListening(){
    if(!SR){
      speak('Voice commands are not supported in this browser. Try Chrome or Edge.');
      if(window.OmegaNotify)window.OmegaNotify.showToast('Voice not supported. Use Chrome or Edge.','error');
      return;
    }
    if(_listening){stopListening();return;}
    _recognition=new SR();
    _recognition.continuous=false;
    _recognition.interimResults=false;
    _recognition.lang='en-US';
    _recognition.onresult=function(e){
      var q=e.results[e.results.length-1][0].transcript;
      processQuery(q);
    };
    _recognition.onend=function(){_setListening(false);};
    _recognition.onerror=function(e){_setListening(false);if(e.error!=='no-speech')speak('Voice error: '+e.error);};
    _recognition.start();
    _setListening(true);
    speak('Listening. Say a command.');
  }

  function stopListening(){
    if(_recognition){try{_recognition.stop();}catch(e){}}
    _setListening(false);
  }

  /* ── INJECT VOICE BUTTON ──────────────────────────────────────── */
  function injectVoiceButton(){
    if(document.getElementById('omega-voice-btn')||!SR) return;
    _btn=document.createElement('button');
    _btn.id='omega-voice-btn';
    _btn.setAttribute('aria-label','Voice command (press to speak)');
    _btn.setAttribute('aria-pressed','false');
    _btn.setAttribute('role','button');
    _btn.title='Voice Commands — Click to speak';
    _btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    _btn.style.cssText='position:fixed;bottom:90px;left:24px;z-index:4500;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.05));border:1px solid rgba(201,168,76,.3);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--gold,#C9A84C);transition:.2s;box-shadow:0 2px 12px rgba(0,0,0,.3)';
    /* bottom:90px overlaps the controls dock, which sits at bottom:74px on a
       phone to clear nav.js's 66px bar. left:24px would also collide with
       #ofb-btn once both are lifted, so this goes to the right of it. */
    if(!document.getElementById('omega-voice-btn-css')){
      var vs=document.createElement('style');
      vs.id='omega-voice-btn-css';
      vs.textContent='@media(max-width:760px){#omega-voice-btn{bottom:150px!important;left:120px!important}}';
      (document.head||document.documentElement).appendChild(vs);
    }
    _btn.addEventListener('click',startListening);
    _btn.addEventListener('mouseenter',function(){_btn.style.background='rgba(201,168,76,.12)';});
    _btn.addEventListener('mouseleave',function(){if(!_listening)_btn.style.background='rgba(201,168,76,.05)';});
    document.body.appendChild(_btn);
  }

  /* ── KEYBOARD SHORTCUT: Ctrl+Shift+V ─────────────────────────── */
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey&&e.shiftKey&&e.key==='V'){e.preventDefault();startListening();}
  });

  /* Init voice button after profile loads */
  document.addEventListener('omega:populated',function(){
    if(!document.getElementById('omega-voice-btn')) injectVoiceButton();
  });

  window.OmegaVoice={start:startListening,stop:stopListening,speak:speak,supported:!!SR};
})();
