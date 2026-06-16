/* SYD OMEGA 91717 — generative ambient score. No audio files; all synthesized. Shared across pages. */
(function () {
  if (window.__omegaAudio) return; window.__omegaAudio = true;

  var TRACKS = [
    { n:'Genesis Drone',   root:130.81, type:'sine',     iv:[0,7,12],     lfo:0.08, cut:1100 },
    { n:'9.17 Resonance',  root:174.61, type:'sine',     iv:[0,7,12,19],  lfo:0.0917,cut:1400 },
    { n:'Fire Ember',      root:164.81, type:'triangle', iv:[0,4,7],      lfo:0.12, cut:1600 },
    { n:'Water Deep',      root:110.00, type:'sine',     iv:[0,7,12],     lfo:0.06, cut:900  },
    { n:'Wind Veil',       root:196.00, type:'sine',     iv:[0,5,12],     lfo:0.10, cut:1500 },
    { n:'Metal Hum',       root:123.47, type:'triangle', iv:[0,7],        lfo:0.05, cut:1000 },
    { n:'Sand Shimmer',    root:220.00, type:'sine',     iv:[0,12,19],    lfo:0.14, cut:1800 },
    { n:'Omega Choir',     root:130.81, type:'sine',     iv:[0,4,7,12],   lfo:0.07, cut:1300 },
    { n:'Frequency Grid',  root:146.83, type:'triangle', iv:[0,7,14],     lfo:0.11, cut:1500 },
    { n:'Void Pulse',      root:98.00,  type:'sine',     iv:[0,12],       lfo:0.04, cut:800  },
    { n:'Sovereign Pad',   root:174.61, type:'sine',     iv:[0,4,7,11],   lfo:0.09, cut:1400 },
    { n:'Apex Bloom',      root:261.63, type:'sine',     iv:[0,7,12],     lfo:0.10, cut:1700 }
  ];

  function ls(k,d){ try{ var v=localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } }
  function lss(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  var state = {
    on:  ls('omega_music_on','0')==='1',
    idx: Math.max(0,Math.min(11, parseInt(ls('omega_music_track','0'),10)||0)),
    vol: Math.max(0,Math.min(1, parseFloat(ls('omega_music_vol','0.5'))||0.5))
  };

  var ctx=null, master=null, voices=[], started=false;

  function ensure(){ if(!ctx){ var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false; ctx=new AC(); master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination); } return true; }

  function buildVoices(actx, preset, dest){
    var arr=[];
    var lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=preset.cut; lp.connect(dest);
    var trem=actx.createGain(); trem.gain.value=0.82; trem.connect(lp);
    var lfo=actx.createOscillator(); var lg=actx.createGain(); lg.gain.value=0.16; lfo.frequency.value=preset.lfo; lfo.connect(lg); lg.connect(trem.gain); lfo.start(); arr.push(lfo);
    preset.iv.forEach(function(semi){
      var o=actx.createOscillator(); o.type=preset.type; o.frequency.value=preset.root*Math.pow(2,semi/12);
      var d=(Math.random()*4-2); o.detune.value=d;
      var g=actx.createGain(); g.gain.value=0.5/preset.iv.length;
      o.connect(g); g.connect(trem); o.start(); arr.push(o);
    });
    return arr;
  }

  function stopVoices(){ voices.forEach(function(n){ try{n.stop();}catch(e){} }); voices=[]; }

  function play(){
    if(!ensure()) return;
    if(ctx.state==='suspended'){ ctx.resume(); }
    stopVoices();
    voices=buildVoices(ctx, TRACKS[state.idx], master);
    started=true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(state.vol*0.6, ctx.currentTime+1.5);
  }
  function stop(){
    if(!ctx||!started) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime+1.0);
    var v=voices.slice(); voices=[];
    setTimeout(function(){ v.forEach(function(n){ try{n.stop();}catch(e){} }); },1100);
    started=false;
  }

  function setOn(on){ state.on=on; lss('omega_music_on',on?'1':'0'); if(on) play(); else stop(); render(); }
  function setTrack(i){ state.idx=i; lss('omega_music_track',String(i)); if(state.on) play(); render(); }
  function setVol(v){ state.vol=v; lss('omega_music_vol',String(v)); if(ctx&&started){ master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(v*0.6, ctx.currentTime+0.2); } }

  /* ---- download (offline render -> WAV) ---- */
  function bufToWav(buf){
    var sr=buf.sampleRate, ch=buf.getChannelData(0), n=ch.length;
    var ab=new ArrayBuffer(44+n*2), v=new DataView(ab), o=0;
    function ws(s){ for(var i=0;i<s.length;i++) v.setUint8(o++,s.charCodeAt(i)); }
    function u32(d){ v.setUint32(o,d,true); o+=4; } function u16(d){ v.setUint16(o,d,true); o+=2; }
    ws('RIFF'); u32(36+n*2); ws('WAVE'); ws('fmt '); u32(16); u16(1); u16(1); u32(sr); u32(sr*2); u16(2); u16(16); ws('data'); u32(n*2);
    for(var i=0;i<n;i++){ var s=Math.max(-1,Math.min(1,ch[i])); v.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
    return new Blob([ab],{type:'audio/wav'});
  }
  function download(i){
    var OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext; if(!OAC) return;
    var sr=22050, sec=24, oc=new OAC(1, sr*sec, sr);
    var m=oc.createGain(); m.gain.setValueAtTime(0,0); m.gain.linearRampToValueAtTime(0.5,2); m.gain.setValueAtTime(0.5,sec-2); m.gain.linearRampToValueAtTime(0,sec); m.connect(oc.destination);
    buildVoices(oc, TRACKS[i], m);
    oc.startRendering().then(function(b){
      var url=URL.createObjectURL(bufToWav(b)); var a=document.createElement('a');
      a.href=url; a.download='OMEGA_91717_'+TRACKS[i].n.replace(/[^A-Za-z0-9]+/g,'_')+'.wav';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},2000);
    }).catch(function(){});
  }

  /* ---- UI ---- */
  var st=document.createElement('style');
  st.textContent=''
    +'#oaud{position:fixed;right:18px;bottom:18px;z-index:120;font-family:"Courier Prime",monospace}'
    +'#oaud .knob{width:46px;height:46px;border-radius:50%;border:1px solid rgba(201,168,76,.5);background:rgba(10,10,17,.85);color:#C9A84C;font-family:"Cinzel Decorative",serif;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);box-shadow:0 0 16px rgba(201,168,76,.18)}'
    +'#oaud .knob.on{color:#E2C86D;border-color:#C9A84C;box-shadow:0 0 22px rgba(201,168,76,.45)}'
    +'#oaud .panel{position:absolute;right:0;bottom:58px;width:236px;background:rgba(10,10,17,.96);border:1px solid rgba(201,168,76,.3);padding:14px;display:none;backdrop-filter:blur(6px)}'
    +'#oaud.open .panel{display:block}'
    +'#oaud .ph{display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:2px;color:#00E5FF;margin-bottom:10px}'
    +'#oaud .sw{cursor:pointer;color:#C9A84C;border:1px solid rgba(201,168,76,.4);padding:3px 9px;font-size:9px;letter-spacing:1px}'
    +'#oaud .sw.on{color:#07070b;background:#C9A84C}'
    +'#oaud .vol{width:100%;margin:4px 0 12px}'
    +'#oaud .list{max-height:210px;overflow-y:auto}'
    +'#oaud .trk{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:6px 6px;font-size:11px;letter-spacing:1px;color:#e9e6dc;cursor:pointer;border-left:2px solid transparent}'
    +'#oaud .trk:hover{background:rgba(201,168,76,.06);border-left-color:#C9A84C}'
    +'#oaud .trk.sel{color:#C9A84C;border-left-color:#C9A84C}'
    +'#oaud .trk .dl{color:#00E5FF;font-size:12px;padding:0 4px;opacity:.7}'
    +'#oaud .trk .dl:hover{opacity:1;color:#C9A84C}'
    +'#oaud .foot{font-size:8px;letter-spacing:1px;color:#85837b;margin-top:8px;text-align:center}';
  document.head.appendChild(st);

  var wrap=document.createElement('div'); wrap.id='oaud';
  wrap.innerHTML='<button class="knob" id="oaknob" title="The Score">\u266A</button>'
    +'<div class="panel"><div class="ph"><span>THE SCORE</span><span class="sw" id="oasw">OFF</span></div>'
    +'<input class="vol" id="oavol" type="range" min="0" max="1" step="0.01">'
    +'<div class="list" id="oalist"></div>'
    +'<div class="foot">\u03A9 12 SOVEREIGN TRACKS · GENERATIVE</div></div>';
  document.body.appendChild(wrap);

  function render(){
    document.getElementById('oaknob').classList.toggle('on',state.on);
    var sw=document.getElementById('oasw'); sw.textContent=state.on?'ON':'OFF'; sw.classList.toggle('on',state.on);
    document.getElementById('oavol').value=state.vol;
    var lst=document.getElementById('oalist'); lst.innerHTML='';
    TRACKS.forEach(function(t,i){
      var row=document.createElement('div'); row.className='trk'+(i===state.idx?' sel':'');
      row.innerHTML='<span class="nm">'+t.n+'</span><span class="dl" title="Download">\u2193</span>';
      row.querySelector('.nm').addEventListener('click',function(){ setTrack(i); if(!state.on) setOn(true); });
      row.querySelector('.dl').addEventListener('click',function(e){ e.stopPropagation(); download(i); });
      lst.appendChild(row);
    });
  }

  document.getElementById('oaknob').addEventListener('click',function(){ wrap.classList.toggle('open'); });
  document.getElementById('oasw').addEventListener('click',function(e){ e.stopPropagation(); setOn(!state.on); });
  document.getElementById('oavol').addEventListener('input',function(){ setVol(parseFloat(this.value)); });
  render();

  // autoplay policy: if saved ON, resume softly on first interaction
  if(state.on){
    var resume=function(){ if(state.on){ play(); } window.removeEventListener('pointerdown',resume); window.removeEventListener('keydown',resume); };
    window.addEventListener('pointerdown',resume); window.addEventListener('keydown',resume);
  }
})();
