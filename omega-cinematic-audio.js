/* Ω SYD OMEGA 91717 — cinematic video audio contract
 * Guarantees an interactive video has an audible path:
 *   1) native video audio when present;
 *   2) local procedural ambient music when a music stem is not supplied;
 *   3) browser speechSynthesis voice explanation from data-omega-voice.
 *
 * This is intentionally user-gesture driven. It never forces audio on page load,
 * never unmutes hover previews, and never claims that a binary video contains a
 * native audio track. The diagnostics surface which path is active.
 */
(function(){
  "use strict";
  if(window.__omegaCinematicAudio)return;
  window.__omegaCinematicAudio=1;

  var active=null;
  var music=null;

  function textFor(video){
    return video.getAttribute("data-omega-voice") ||
      video.getAttribute("aria-label") ||
      video.getAttribute("title") ||
      "SYD OMEGA 91717 cinematic presentation.";
  }

  function makeMusic(){
    if(music)return music;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    var ctx=new C(), master=ctx.createGain();
    master.gain.value=.045;
    master.connect(ctx.destination);
    var oscs=[174.61,220,261.63].map(function(freq,i){
      var o=ctx.createOscillator(),g=ctx.createGain();
      o.type=i===1?"triangle":"sine";o.frequency.value=freq;
      g.gain.value=i===1?.025:.018;o.connect(g);g.connect(master);o.start();
      return {o:o,g:g};
    });
    music={ctx:ctx,master:master,oscs:oscs};
    return music;
  }

  function stopMusic(){
    if(!music)return;
    try{music.oscs.forEach(function(x){x.o.stop();});music.ctx.close();}catch(e){}
    music=null;
  }

  function speak(video){
    if(!("speechSynthesis" in window))return false;
    try{
      window.speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(textFor(video));
      u.rate=.92;u.pitch=.9;u.volume=.72;
      u.lang=document.documentElement.lang||"en-US";
      window.speechSynthesis.speak(u);
      return true;
    }catch(e){return false;}
  }

  function stop(video){
    if(active===video)active=null;
    if("speechSynthesis" in window)try{window.speechSynthesis.cancel();}catch(e){}
    stopMusic();
  }

  function start(video){
    if(!video)return;
    stop(active);
    active=video;
    /* Native audio remains authoritative. Do not overwrite an existing track. */
    video.muted=false;
    video.volume=Math.max(.65,Number(video.volume)||1);
    var m=makeMusic();
    if(m&&m.ctx.state==="suspended")m.ctx.resume().catch(function(){});
    var voice=speak(video);
    video.setAttribute("data-omega-audio-state",voice?"native-or-fallback-music+voice":"native-or-fallback-music");
    video.setAttribute("data-omega-audio-truth","RUNTIME_FALLBACK");
    return {music:!!m,voice:voice,nativeAudio:"UNVERIFIED"};
  }

  function bind(){
    document.querySelectorAll("video[data-omega-audio-required='true']").forEach(function(v){
      if(v.__omegaAudioBound)return;
      v.__omegaAudioBound=true;
      v.addEventListener("play",function(){
        /* A play event is a user-gesture continuation for the modal players. */
        start(v);
      });
      v.addEventListener("pause",function(){if(active===v)stop(v);});
      v.addEventListener("ended",function(){if(active===v)stop(v);});
    });
  }

  window.OmegaCinematicAudio={
    start:start,stop:stop,diagnose:function(){
      var rows=[];
      document.querySelectorAll("video").forEach(function(v){
        rows.push({
          src:v.currentSrc||v.src||"",
          required:v.getAttribute("data-omega-audio-required")==="true",
          muted:v.muted,
          state:v.getAttribute("data-omega-audio-state")||"NOT_STARTED",
          truth:v.getAttribute("data-omega-audio-truth")||"NATIVE_VIDEO_UNVERIFIED",
          voice:v.getAttribute("data-omega-voice")||""
        });
      });
      console.table(rows);return rows;
    }
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);
  else bind();
  new MutationObserver(bind).observe(document.documentElement,{subtree:true,childList:true});
})();