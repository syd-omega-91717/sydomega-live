/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN AMBIENT ENGINE (omega-ambient.js)
   Web Audio API procedural ambient soundscapes — one per element.
   Starts muted; user must click [data-ambient-toggle] to unmute.
   No external libraries. Pure Web Audio API.
   ========================================================================== */
(function(){
'use strict';

var ctx=null, master=null, active=[], muted=true, currentElem='Void';

/* Element → sonic recipe */
var RECIPES = {
  Fire: function(c,g){
    /* Crackling warmth — filtered noise + low sub drone */
    var buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.3;
    var src=c.createBufferSource(); src.buffer=buf; src.loop=true;
    var bf=c.createBiquadFilter(); bf.type='bandpass'; bf.frequency.value=800; bf.Q.value=0.5;
    var osc=c.createOscillator(); osc.type='sawtooth'; osc.frequency.value=55;
    var oscGain=c.createGain(); oscGain.gain.value=0.08;
    src.connect(bf); bf.connect(g); osc.connect(oscGain); oscGain.connect(g);
    src.start(); osc.start();
    return [src,osc];
  },
  Water: function(c,g){
    /* Flowing tones — sine chords + white noise low-pass */
    var freqs=[220,330,440,528];
    var nodes=freqs.map(function(f){
      var o=c.createOscillator(); o.type='sine'; o.frequency.value=f;
      var og=c.createGain(); og.gain.value=0.04;
      var lfo=c.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.08+Math.random()*0.12;
      var lg=c.createGain(); lg.gain.value=8;
      lfo.connect(lg); lg.connect(o.frequency);
      o.connect(og); og.connect(g); o.start(); lfo.start();
      return [o,lfo];
    });
    return nodes.flat();
  },
  Wind: function(c,g){
    /* Sweeping wind — filtered white noise with slow LFO */
    var buf=c.createBuffer(1,c.sampleRate*4,c.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
    var src=c.createBufferSource(); src.buffer=buf; src.loop=true;
    var bf=c.createBiquadFilter(); bf.type='bandpass'; bf.frequency.value=400; bf.Q.value=2;
    var lfo=c.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.05;
    var lg=c.createGain(); lg.gain.value=300;
    lfo.connect(lg); lg.connect(bf.frequency);
    src.connect(bf); bf.connect(g); src.start(); lfo.start();
    return [src,lfo];
  },
  Metal: function(c,g){
    /* Ringing metal — high partial harmonics */
    var freqs=[432,864,1296,1728];
    var nodes=freqs.map(function(f,i){
      var o=c.createOscillator(); o.type='sine'; o.frequency.value=f;
      var og=c.createGain(); og.gain.value=0.025/(i+1);
      o.connect(og); og.connect(g); o.start();
      return o;
    });
    return nodes;
  },
  Sand: function(c,g){
    /* Granular shimmer — short burst noise + high-pass */
    var buf=c.createBuffer(1,c.sampleRate,c.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.4;
    var src=c.createBufferSource(); src.buffer=buf; src.loop=true;
    var hpf=c.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=3000;
    src.connect(hpf); hpf.connect(g); src.start();
    return [src];
  },
  Soul: function(c,g){
    /* Pulsing warmth — pad chords, slow vibrato */
    var freqs=[174.6,220,261.6,329.6,392];
    var nodes=freqs.map(function(f){
      var o=c.createOscillator(); o.type='sine'; o.frequency.value=f;
      var og=c.createGain(); og.gain.value=0.05;
      var lfo=c.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.15;
      var lg=c.createGain(); lg.gain.value=3;
      lfo.connect(lg); lg.connect(o.frequency);
      o.connect(og); og.connect(g); o.start(); lfo.start();
      return [o,lfo];
    });
    return nodes.flat();
  },
  Space: function(c,g){
    /* Deep space — sub-bass drone + sparse high shimmer */
    var sub=c.createOscillator(); sub.type='sine'; sub.frequency.value=40;
    var sg=c.createGain(); sg.gain.value=0.12;
    var hi=c.createOscillator(); hi.type='sine'; hi.frequency.value=2200;
    var hg=c.createGain(); hg.gain.value=0.03;
    sub.connect(sg); sg.connect(g); hi.connect(hg); hg.connect(g);
    sub.start(); hi.start();
    return [sub,hi];
  },
  Void: function(c,g){
    /* Dark matter — ultra-low sub + deep silence shimmer */
    var o=c.createOscillator(); o.type='sine'; o.frequency.value=28;
    var og=c.createGain(); og.gain.value=0.09;
    o.connect(og); og.connect(g); o.start();
    return [o];
  },
  'The All': function(c,g){
    /* Omnichord — all element frequencies layered at low volume */
    var freqs=[28,55,174.6,220,432,528,864,1200,2200];
    var nodes=freqs.map(function(f,i){
      var o=c.createOscillator(); o.type='sine'; o.frequency.value=f;
      var og=c.createGain(); og.gain.value=0.018/(i+1);
      o.connect(og); og.connect(g); o.start();
      return o;
    });
    return nodes;
  }
};

var SIGN_ELEM={Aries:'Fire',Taurus:'Metal',Gemini:'Wind',Cancer:'Water',Leo:'Fire',Virgo:'Sand',Libra:'Wind',Scorpio:'Water',Sagittarius:'Fire',Capricorn:'Metal',Aquarius:'Wind',Pisces:'Water'};

function initAudio(){
  if(ctx) return true;
  try{
    ctx=new(window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain(); master.gain.value=0; /* muted by default */
    master.connect(ctx.destination);
    return true;
  }catch(e){return false;}
}

function stopActive(){
  active.forEach(function(n){try{n.stop?n.stop():n.disconnect&&n.disconnect();}catch(e){}});
  active=[];
}

function playElement(elem){
  if(!initAudio()) return;
  stopActive();
  currentElem=elem;
  var recipe=RECIPES[elem]||RECIPES['Void'];
  try{ active=recipe(ctx,master)||[]; }catch(e){}
}

function setMuted(m){
  muted=m;
  if(!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(m?0:0.22,ctx.currentTime,1.5);
  /* Update all toggle buttons */
  document.querySelectorAll('[data-ambient-toggle]').forEach(function(el){
    el.setAttribute('aria-pressed',String(!m));
    el.setAttribute('title',m?'Enable ambient sound':'Disable ambient sound');
    el.textContent=m?'♪ SOUND OFF':'♪ SOUND ON';
  });
}

function toggle(){
  if(!initAudio()) return;
  if(ctx.state==='suspended') ctx.resume();
  setMuted(!muted);
}

/* Public API */
window.OmegaAmbient={
  play:playElement,
  mute:function(){setMuted(true);},
  unmute:function(){setMuted(false);},
  toggle:toggle,
  isPlaying:function(){return !muted;}
};

/* Wire toggle buttons */
document.addEventListener('click',function(e){
  if(e.target.closest('[data-ambient-toggle]')) toggle();
});

/* Listen for profile */
function handleProfile(pr){
  var elem=(pr&&pr.sign&&SIGN_ELEM[pr.sign])||'Void';
  if(initAudio()) playElement(elem);
}
window.addEventListener('omega:user-loaded',function(e){
  if(e&&e.detail&&e.detail.profile) handleProfile(e.detail.profile);
});
var _p=0;(function poll(){
  if(window.__omegaProfile){handleProfile(window.__omegaProfile);return;}
  if(++_p<20) setTimeout(poll,800);
})();

/* Inject ambient toggle button into topbar on pages that have one */
window.addEventListener('omega:user-loaded',function(){
  var topbar=document.querySelector('.topbar');
  if(!topbar||document.querySelector('[data-ambient-toggle]')) return;
  var btn=document.createElement('button');
  btn.setAttribute('data-ambient-toggle','1');
  btn.setAttribute('aria-pressed','false');
  btn.setAttribute('title','Enable ambient sound');
  btn.setAttribute('aria-label','Toggle ambient sound');
  btn.textContent='♪ SOUND OFF';
  btn.style.cssText='font-family:var(--M,"Courier Prime",monospace);font-size:12px;letter-spacing:1.5px;padding:5px 10px;border:1px solid rgba(201,168,76,.3);color:var(--muted,#8a8676);background:none;cursor:pointer;border-radius:1px;flex-shrink:0;transition:.18s;';
  btn.addEventListener('mouseenter',function(){this.style.borderColor='var(--solar,#E2C86D)';this.style.color='var(--solar,#E2C86D)';});
  btn.addEventListener('mouseleave',function(){this.style.borderColor='rgba(201,168,76,.3)';this.style.color='var(--muted,#8a8676)';});
  topbar.appendChild(btn);
});

})();
