/* SYD OMEGA 91717 -- Generative Ambient Score v2.0
   All sounds synthesized via Web Audio API. Zero external files. Zero copyright.
   Page-specific contexts: each page gets a unique sonic signature.
   Respects prefers-reduced-motion (also treats as prefers-reduced-sound). */
(function(){
  if(window.__omegaAudio) return; window.__omegaAudio=true;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext) return;

  /* Detect page context from data-page attribute */
  function getPageContext(){
    var el=document.getElementById('omega-side');
    return (el&&el.getAttribute('data-page'))||
           ((location.pathname.split('/').pop()||'').replace('.html',''))||
           'default';
  }

  /* PAGE AUDIO PROFILES
     Each defines: base (Hz), harmonics[], filter (Hz), reverb, gain, lfoRate, lfoDepth */
  var PROFILES={
    dashboard:{base:91.7,harmonics:[183.4,274.1,364.8],filter:800,reverb:0.4,gain:0.06,lfoRate:0.09,lfoDepth:8,label:'Command Frequency'},
    matrix:   {base:55,  harmonics:[110,165,220,440],   filter:400,reverb:0.8,gain:0.05,lfoRate:0.04,lfoDepth:12,label:'Matrix Resonance'},
    academy:  {base:432, harmonics:[648,864],            filter:2000,reverb:0.2,gain:0.04,lfoRate:0.12,lfoDepth:4,label:'Focus Frequency 432Hz'},
    gaming:   {base:220, harmonics:[330,440,880],        filter:3000,reverb:0.1,gain:0.07,lfoRate:0.3, lfoDepth:20,label:'Arena Pulse'},
    agents:   {base:73.4,harmonics:[146.8,220.2,440.4],  filter:600,reverb:0.6,gain:0.05,lfoRate:0.07,lfoDepth:6,label:'Neural Mesh'},
    horoscope:{base:396, harmonics:[528,741],            filter:3500,reverb:0.5,gain:0.04,lfoRate:0.06,lfoDepth:5,label:'Celestial Tone'},
    elements: {base:174, harmonics:[285,396,528],        filter:2200,reverb:0.7,gain:0.05,lfoRate:0.08,lfoDepth:7,label:'Elemental Field'},
    research: {base:528, harmonics:[741,963],            filter:4000,reverb:0.3,gain:0.04,lfoRate:0.1, lfoDepth:5,label:'Discovery Frequency'},
    heritage: {base:111, harmonics:[222,333],            filter:500,reverb:0.9,gain:0.04,lfoRate:0.05,lfoDepth:4,label:'Ancient Resonance'},
    bloodline:{base:91.7,harmonics:[183.4,367.8],        filter:400,reverb:0.8,gain:0.04,lfoRate:0.05,lfoDepth:6,label:'Bloodline Pulse'},
    prediction:{base:963,harmonics:[741,528],            filter:5000,reverb:0.4,gain:0.03,lfoRate:0.11,lfoDepth:3,label:'Oracle Frequency'},
    city:     {base:40,  harmonics:[80,120,240],         filter:350,reverb:0.9,gain:0.05,lfoRate:0.03,lfoDepth:15,label:'City Infrastructure'},
    compliance:{base:256,harmonics:[384,512],            filter:1800,reverb:0.3,gain:0.04,lfoRate:0.08,lfoDepth:4,label:'Order Frequency'},
    cinema:   {base:60,  harmonics:[120,180,300],        filter:600,reverb:1.0,gain:0.06,lfoRate:0.05,lfoDepth:10,label:'Cinematic Score'},
    universe: {base:32,  harmonics:[64,128,256,512],     filter:300,reverb:1.0,gain:0.05,lfoRate:0.04,lfoDepth:12,label:'Universe Resonance'},
    'default':{base:91.7,harmonics:[183.4,274.1],        filter:700,reverb:0.5,gain:0.05,lfoRate:0.09,lfoDepth:8,label:'Sovereign Frequency'},
  };

  var ctx=null, masterGain=null, oscillators=[], started=false;
  var muted=localStorage.getItem('omega_audio_muted')==='true';

  function buildGraph(profile){
    if(!ctx) return;
    /* Master gain */
    masterGain=ctx.createGain(); masterGain.gain.value=muted?0:profile.gain;
    /* Reverb via convolver */
    var conv=ctx.createConvolver();
    (function(){
      var len=ctx.sampleRate*profile.reverb*2;
      var buf=ctx.createBuffer(2,len,ctx.sampleRate);
      for(var c=0;c<2;c++){
        var d=buf.getChannelData(c);
        for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.5);
      }
      conv.buffer=buf;
    })();
    /* Filter */
    var flt=ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=profile.filter; flt.Q.value=0.5;
    /* Chain: osc -> flt -> conv -> masterGain -> out */
    flt.connect(conv); conv.connect(masterGain); masterGain.connect(ctx.destination);
    /* LFO */
    var lfo=ctx.createOscillator(); lfo.frequency.value=profile.lfoRate;
    var lfoGain=ctx.createGain(); lfoGain.gain.value=profile.lfoDepth;
    lfo.connect(lfoGain);
    /* Base oscillator */
    var osc0=ctx.createOscillator(); osc0.type='sine'; osc0.frequency.value=profile.base;
    lfoGain.connect(osc0.frequency);
    var og0=ctx.createGain(); og0.gain.value=0.5; osc0.connect(og0); og0.connect(flt);
    oscillators.push(osc0); lfo.start();
    /* Harmonic oscillators */
    profile.harmonics.forEach(function(hz,i){
      var osc=ctx.createOscillator(); osc.type=i%2===0?'sine':'triangle'; osc.frequency.value=hz;
      var og=ctx.createGain(); og.gain.value=0.15/(i+1); osc.connect(og); og.connect(flt);
      oscillators.push(osc);
    });
    /* Sub-bass pulse (the 9.17 signature) */
    var sub=ctx.createOscillator(); sub.type='sine'; sub.frequency.value=9.17;
    var subG=ctx.createGain(); subG.gain.value=0.08; sub.connect(subG); subG.connect(masterGain);
    oscillators.push(sub);
    oscillators.forEach(function(o){ o.start(); });
  }

  function start(){
    if(started) return; started=true;
    try{
      ctx=new AudioContext();
      var page=getPageContext();
      var profile=PROFILES[page]||PROFILES['default'];
      buildGraph(profile);
      if(window.__omegaAudioLabel) window.__omegaAudioLabel(profile.label);
    }catch(e){}
  }

  function stop(){
    oscillators.forEach(function(o){ try{ o.stop(); }catch(e){} });
    oscillators=[];
    if(ctx){ ctx.close(); ctx=null; }
    started=false; masterGain=null;
  }

  function setMuted(m){
    muted=m; localStorage.setItem('omega_audio_muted',m?'true':'false');
    if(masterGain) masterGain.gain.setTargetAtTime(m?0:0.06,ctx?ctx.currentTime:0,0.3);
  }

  /* Inject audio control button */
  function injectControl(){
    if(document.getElementById('omega-audio-btn')) return;
    var btn=document.createElement('button'); btn.id='omega-audio-btn';
    btn.style.cssText='position:fixed;bottom:62px;left:18px;z-index:9995;font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;padding:6px 12px;background:rgba(7,7,11,0.9);border:1px solid rgba(201,168,76,0.2);color:#85837b;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px';
    btn.innerHTML='<span id="audio-icon">\u266A</span><span id="audio-lbl">SOUND</span>';
    btn.title='Toggle ambient sound';
    /* Start on first click (browser autoplay policy) */
    btn.addEventListener('click',function(){
      if(!started){ start(); setMuted(false); }
      else { setMuted(!muted); }
      update();
    });
    document.body.appendChild(btn);
    window.__omegaAudioLabel=function(lbl){
      var el=document.getElementById('audio-lbl');
      if(el) el.textContent=lbl||'SOUND';
    };
    update();
    function update(){
      var on=started&&!muted;
      btn.style.borderColor=on?'rgba(201,168,76,0.5)':'rgba(201,168,76,0.15)';
      btn.style.color=on?'#C9A84C':'#85837b';
      document.getElementById('audio-icon').textContent=on?'\u266B':'\u266A';
    }
  }

  /* Boot after page loads */
  function boot(){ injectControl(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
