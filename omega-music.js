/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN MUSIC ENGINE (omega-music.js)
   Tone.js v14 (MIT) via esm.sh — generative musical compositions per element.
   Each of the 9 sovereign elements has a unique scale, timbre, and rhythm.
   More sophisticated than omega-ambient.js (which uses raw Web Audio API).
   Public API: window.OmegaMusic = { play(elem), stop(), toggle(), isPlaying() }
   Trigger: [data-music-toggle] elements toggle playback.
   ========================================================================== */
(function(){
'use strict';

var _Tone=null,_loaded=false,_playing=false,_currentElem='Void';
var _parts=[],_synths=[],_loop=null;

/* Element → musical recipe */
var RECIPES={
  /* Scale: array of semitones from root (C2). Timbre, BPM, pattern */
  Fire:{
    root:'C2', scale:[0,2,4,7,9],      /* pentatonic major — assertive */
    bpm:132, timbre:'sawtooth',
    bass:[0,0,7,0], treble:[12,9,12,7,4,7],
    reverb:0.2, delay:0.1
  },
  Water:{
    root:'F2', scale:[0,3,5,7,10,12],  /* minor pentatonic + octave */
    bpm:72, timbre:'sine',
    bass:[0,5,7,5], treble:[12,10,7,5,3,5,7],
    reverb:0.7, delay:0.4
  },
  Wind:{
    root:'G2', scale:[0,2,4,6,9,11],   /* whole-tone adjacent — airy */
    bpm:116, timbre:'triangle',
    bass:[0,0,4,7], treble:[11,9,7,4,2,4,7,9],
    reverb:0.5, delay:0.3
  },
  Metal:{
    root:'D2', scale:[0,2,5,7,9],      /* dorian — disciplined */
    bpm:88, timbre:'square',
    bass:[0,0,5,0,7,0,5,0], treble:[9,7,5,2,0,2,5,7],
    reverb:0.15, delay:0.1
  },
  Sand:{
    root:'A2', scale:[0,2,3,7,9],      /* sparse — granular */
    bpm:96, timbre:'triangle',
    bass:[0,2,3,7], treble:[9,7,3,2,0,3,7],
    reverb:0.35, delay:0.25
  },
  Soul:{
    root:'Bb2', scale:[0,3,5,6,10,12], /* phrygian dominant — deep */
    bpm:60, timbre:'sine',
    bass:[0,0,6,10], treble:[12,10,6,5,3,6,10,12],
    reverb:0.9, delay:0.6
  },
  Space:{
    root:'E2', scale:[0,4,7,10,14],    /* dominant 7th extended — cosmic */
    bpm:52, timbre:'sine',
    bass:[0,4,7,14], treble:[14,10,7,4,0,4,7,10,14],
    reverb:1.0, delay:0.8
  },
  Void:{
    root:'C1', scale:[0,7,12],         /* open fifth — dark */
    bpm:40, timbre:'sine',
    bass:[0,0,7,12], treble:[12,7,0],
    reverb:0.95, delay:0.9
  },
  'The All':{
    root:'C2', scale:[0,2,4,5,7,9,11,12], /* major scale — complete */
    bpm:108, timbre:'sine',
    bass:[0,4,7,9], treble:[12,11,9,7,5,4,2,0,2,4,5,7,9,11,12],
    reverb:0.5, delay:0.35
  }
};

var NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function semitoneToNote(root,semis){
  /* root like 'C2' → parse octave */
  var rootName=root.slice(0,-1);
  var rootOct=parseInt(root.slice(-1));
  var rootIdx=NOTE_NAMES.indexOf(rootName);
  var totalSemis=rootIdx+semis;
  var noteIdx=((totalSemis%12)+12)%12;
  var octOffset=Math.floor(totalSemis/12);
  return NOTE_NAMES[noteIdx]+(rootOct+octOffset);
}

function loadTone(){
  if(_Tone) return Promise.resolve(_Tone);
  return import('https://esm.sh/tone@14.9.17').then(function(mod){
    _Tone=mod;
    _loaded=true;
    return _Tone;
  });
}

function stopAll(){
  _parts.forEach(function(p){try{p.stop();p.dispose();}catch(e){}});
  _synths.forEach(function(s){try{s.dispose();}catch(e){}});
  if(_loop){try{_loop.stop();_loop.dispose();}catch(e){}}
  _parts=[];_synths=[];_loop=null;
  try{_Tone.getTransport().stop();}catch(e){}
  _playing=false;
}

function play(elemName){
  if(!_loaded||!_Tone) return;
  stopAll();
  var elem=elemName||_currentElem;
  _currentElem=elem;
  var r=RECIPES[elem]||RECIPES['Void'];
  var T=_Tone;

  /* Resume AudioContext */
  T.start().catch(function(){});

  /* Reverb + delay shared effects */
  var rev=new T.Reverb({decay:r.reverb*5+0.5,wet:r.reverb}).toDestination();
  var dly=new T.FeedbackDelay({delayTime:r.delay,feedback:0.3,wet:r.delay*0.5}).connect(rev);
  var limiter=new T.Limiter(-3).connect(rev);

  /* Bass synth */
  var bassSynth=new T.Synth({
    oscillator:{type:r.timbre},
    envelope:{attack:0.08,decay:0.3,sustain:0.6,release:1.2},
    volume:-14
  }).connect(limiter);
  _synths.push(bassSynth);

  /* Melody synth */
  var melSynth=new T.Synth({
    oscillator:{type:'sine'},
    envelope:{attack:0.15,decay:0.5,sustain:0.4,release:2},
    volume:-18
  }).connect(dly);
  _synths.push(melSynth);

  /* Pad synth — slow chord */
  var padSynth=new T.PolySynth(T.Synth,{
    oscillator:{type:'sine'},
    envelope:{attack:1.2,decay:0.5,sustain:0.8,release:3},
    volume:-22
  }).connect(rev);
  _synths.push(padSynth);

  /* Convert recipe to note sequences */
  var bassNotes=r.bass.map(function(s){return semitoneToNote(r.root,s);});
  var melNotes=r.treble.map(function(s){return semitoneToNote(r.root,s+12);});

  /* Build bass sequence */
  var bassStep=0;
  var bassPart=new T.Sequence(function(time){
    bassSynth.triggerAttackRelease(bassNotes[bassStep%bassNotes.length],'8n',time);
    bassStep++;
  },bassNotes,'4n');
  _parts.push(bassPart);

  /* Build melody sequence */
  var melStep=0;
  var melPart=new T.Sequence(function(time){
    if(Math.random()>0.3){
      melSynth.triggerAttackRelease(melNotes[melStep%melNotes.length],'8n',time);
    }
    melStep++;
  },melNotes,'8n');
  _parts.push(melPart);

  /* Pad chord every bar */
  var padNotes=r.scale.slice(0,4).map(function(s){return semitoneToNote(r.root,s+7);});
  var padPart=new T.Loop(function(time){
    padSynth.triggerAttackRelease(padNotes,'1m',time);
  },'1m');
  _parts.push(padPart);

  /* Transport */
  T.getTransport().bpm.value=r.bpm;
  T.getTransport().start();
  _parts.forEach(function(p){p.start(0);});
  _playing=true;

  /* Update toggle buttons */
  _updateButtons();
}

function stop(){
  stopAll();
  try{_Tone&&_Tone.getTransport().stop();}catch(e){}
  _updateButtons();
}

function toggle(){
  loadTone().then(function(){
    if(_playing) stop();
    else play(_currentElem);
  });
}

function _updateButtons(){
  document.querySelectorAll('[data-music-toggle]').forEach(function(el){
    el.setAttribute('aria-pressed',String(_playing));
    el.textContent=_playing?'♬ MUSIC ON':'♬ MUSIC OFF';
    el.setAttribute('title',_playing?'Stop generative music':'Play generative music');
  });
}

/* ── Public API ── */
window.OmegaMusic={
  play:function(elem){
    _currentElem=elem||_currentElem;
    loadTone().then(function(){play(_currentElem);});
  },
  stop:stop,
  toggle:toggle,
  isPlaying:function(){return _playing;}
};

/* ── Wire toggle buttons ── */
document.addEventListener('click',function(e){
  if(e.target.closest('[data-music-toggle]')) toggle();
});

/* ── React to profile ── */
var SIGN_ELEM={Aries:'Fire',Taurus:'Metal',Gemini:'Wind',Cancer:'Water',Leo:'Fire',Virgo:'Sand',Libra:'Wind',Scorpio:'Water',Sagittarius:'Fire',Capricorn:'Metal',Aquarius:'Wind',Pisces:'Water'};
window.addEventListener('omega:user-loaded',function(e){
  if(e&&e.detail&&e.detail.profile){
    var elem=(e.detail.profile.sign&&SIGN_ELEM[e.detail.profile.sign])||'Void';
    _currentElem=elem;
  }
});

/* ── Auto-inject music toggle into topbar ── */
window.addEventListener('omega:user-loaded',function(){
  var topbar=document.querySelector('.topbar');
  if(!topbar||document.querySelector('[data-music-toggle]')) return;
  var btn=document.createElement('button');
  btn.setAttribute('data-music-toggle','1');
  btn.setAttribute('aria-pressed','false');
  btn.setAttribute('title','Play generative music');
  btn.setAttribute('aria-label','Toggle generative music');
  btn.textContent='♬ MUSIC OFF';
  btn.style.cssText='font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1.5px;padding:5px 10px;border:1px solid rgba(201,168,76,.3);color:var(--muted,#8a8676);background:none;cursor:pointer;border-radius:1px;flex-shrink:0;transition:.18s;';
  btn.addEventListener('mouseenter',function(){this.style.borderColor='var(--solar,#E2C86D)';this.style.color='var(--solar,#E2C86D)';});
  btn.addEventListener('mouseleave',function(){this.style.borderColor='rgba(201,168,76,.3)';this.style.color='var(--muted,#8a8676)';});
  topbar.appendChild(btn);
});

})();
