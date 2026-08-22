/* ═══════════════════════════════════════════════════════════════════════════
   Ω SYD OMEGA 91717 — OMEGA CONTROLS
   Unified language selector + sound toggle dock
   Injected into every page via bg.js or direct <script> include
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  var LANGS=[
    {code:'en',label:'EN',name:'English'},
    {code:'ar',label:'AR',name:'العربية',rtl:true},
    {code:'fr',label:'FR',name:'Français'},
    {code:'es',label:'ES',name:'Español'},
    {code:'nl',label:'NL',name:'Nederlands'},
    {code:'zh',label:'ZH',name:'中文'},
    {code:'hi',label:'HI',name:'हिन्दी'},
  ];

  var _soundOn=localStorage.getItem('omega_sound')!=='off';

  function buildDock(){
    if(document.getElementById('omega-controls-dock'))return;
    var dock=document.createElement('div');
    dock.id='omega-controls-dock';
    dock.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:2000;display:flex;align-items:center;gap:6px;background:rgba(2,2,6,.92);border:1px solid rgba(201,168,76,.2);border-radius:3px;padding:6px 10px;box-shadow:0 0 20px rgba(201,168,76,.08);backdrop-filter:blur(8px)';

    /* Language buttons */
    LANGS.forEach(function(lg){
      var btn=document.createElement('button');
      btn.setAttribute('data-lang',lg.code);
      btn.title=lg.name;
      btn.style.cssText='font-family:"Courier Prime",monospace;font-size:8.5px;letter-spacing:1.5px;padding:4px 8px;border:1px solid rgba(201,168,76,.2);color:#8a8676;background:transparent;cursor:pointer;border-radius:2px;transition:.2s;white-space:nowrap';
      btn.textContent=lg.label;
      if((localStorage.getItem('omega_lang')||'en')===lg.code){
        btn.style.color='#C9A84C';btn.style.borderColor='rgba(201,168,76,.5)';btn.style.background='rgba(201,168,76,.07)';
      }
      btn.onclick=function(){
        dock.querySelectorAll('[data-lang]').forEach(function(b){
          b.style.color='#8a8676';b.style.borderColor='rgba(201,168,76,.2)';b.style.background='transparent';
        });
        btn.style.color='#C9A84C';btn.style.borderColor='rgba(201,168,76,.5)';btn.style.background='rgba(201,168,76,.07)';
        if(window.OmegaI18n){window.OmegaI18n.translate(lg.code);}
        else{localStorage.setItem('omega_lang',lg.code);location.reload();}
      };
      dock.appendChild(btn);
    });

    /* Separator */
    var sep=document.createElement('div');
    sep.style.cssText='width:1px;height:16px;background:rgba(201,168,76,.15);margin:0 2px';
    dock.appendChild(sep);

    /* Sound toggle */
    var snd=document.createElement('button');
    snd.id='omega-sound-btn';
    snd.title='Toggle ambient sound';
    snd.style.cssText='font-family:"Courier Prime",monospace;font-size:8.5px;letter-spacing:1.5px;padding:4px 8px;border:1px solid rgba(201,168,76,.2);color:#8a8676;background:transparent;cursor:pointer;border-radius:2px;transition:.2s';
    snd.textContent=_soundOn?'\u266a ON':'\u266a OFF';
    snd.onclick=function(){
      // audio.js exposes __omegaAudioToggle specifically for this dock to
      // call (see its own header comment) -- previously this button only
      // toggled its own label/localStorage and never actually reached the
      // audio engine
      _soundOn=window.__omegaAudioToggle?window.__omegaAudioToggle():!_soundOn;
      localStorage.setItem('omega_sound',_soundOn?'on':'off');
      snd.textContent=_soundOn?'\u266a ON':'\u266a OFF';
      snd.style.color=_soundOn?'#00E5FF':'#8a8676';
      document.dispatchEvent(new CustomEvent('omega:sound',{detail:{on:_soundOn}}));
    };
    if(_soundOn)snd.style.color='#00E5FF';
    dock.appendChild(snd);

    /* Search trigger. omega-search.js has always been reachable by Ctrl+K
       only -- an unadvertised shortcut, and one a touch device cannot press
       at all, so on phones and tablets the platform's search was simply
       unreachable. data-search-trigger is the attribute that file already
       listens for. */
    var srch=document.createElement('button');
    srch.id='omega-search-btn';
    srch.setAttribute('data-search-trigger','');
    srch.title='Search the platform (Ctrl+K)';
    srch.setAttribute('aria-label','Search the platform');
    srch.style.cssText='font-family:"Courier Prime",monospace;font-size:8.5px;letter-spacing:1.5px;padding:4px 8px;border:1px solid rgba(201,168,76,.2);color:#8a8676;background:transparent;cursor:pointer;border-radius:2px;transition:.2s';
    srch.textContent='⌕ SEARCH';
    srch.onmouseenter=function(){srch.style.color='#C9A84C';srch.style.borderColor='rgba(201,168,76,.5)';};
    srch.onmouseleave=function(){srch.style.color='#8a8676';srch.style.borderColor='rgba(201,168,76,.2)';};
    dock.appendChild(srch);

    document.body.appendChild(dock);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',buildDock);
  } else {
    buildDock();
  }
})();
