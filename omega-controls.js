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

  /* The dock is positioned entirely with inline styles, which no media query
     can reach. Measured at a 375px viewport it came out 389px wide (clipped
     past BOTH edges -- and invisibly so, since translateX(-50%) overflow to
     the left never grows scrollWidth, so an overflow scan finds nothing), and
     bottom:16px put 33 of its 44px behind nav.js's #omega-mob bar, which is
     z-index 9990 against this dock's 2000. Every control in here -- the only
     language switcher, the sound toggle, the search trigger -- was therefore
     untappable on a phone. This stylesheet lifts it clear of the 66px nav and
     tightens the buttons enough to fit one row, with wrapping as the fallback
     on narrower devices. */
  function injectDockCss(){
    if(document.getElementById('omega-controls-css'))return;
    var st=document.createElement('style');
    st.id='omega-controls-css';
    st.textContent=[
      /* Seven language buttons are what made this dock 389px wide. Squeezing
         them to fit would have taken each control under the 24px WCAG 2.5.8
         touch floor -- fixing reachability by making the targets too small to
         hit is not a fix. So on a phone the seven collapse into one compact
         <select> (built alongside them, swapped by CSS rather than by JS, so
         a rotate or resize needs no listener and cannot desync), leaving
         three full-size controls in a single row. */
      '#omega-lang-select{display:none}',
      /* THE MOBILE BOTTOM LADDER (<=760px), measured at 375x667. Every band
         below is occupied by a fixed widget from a different module; if you
         move one, re-run scan.js chrome and the mutual-overlap check, because
         they were all landing on each other before this was laid out:
             0..66    #omega-mob            nav.js       (z 9990)
            66..94    #omega-ticker-strip   omega-realtime.js
           102..142   #omega-controls-dock  this file
           150..      #ofb-btn / #omega-voice-btn / #omega-ded-widget
           215..      transient toasts      omega-sdt / omega-keyboard / bg.js
         #omega-cap-badge is hidden below 760px -- it was 100% covered. */
      '@media(max-width:760px){',
      /* left:50% + width:auto caps a fixed element's available width at
         100% - left, i.e. 50vw -- 187px on a 375px phone. That is what made
         the original dock overflow (its content needed 389px and simply spilled
         past both edges) and what kept forcing a wrap here even with room to
         spare. Anchoring both edges instead gives it the real viewport width
         and centres the contents inside it. */
      '#omega-controls-dock{bottom:102px!important;left:6px!important;right:6px;',
      'transform:none!important;justify-content:center;flex-wrap:wrap;row-gap:4px}',
      '#omega-controls-dock button{padding:7px 8px!important;min-height:24px}',
      '#omega-controls-dock button[data-lang]{display:none}',
      /* max-width keeps the closed control compact so the dock stays one row;
         the dropdown itself still shows each option in full. Without it the
         select sizes to its widest option ("HI · हिन्दी") at 165px and pushes
         the dock to two rows, which then collides with the dedication widget
         and the feedback button. */
      '#omega-lang-select{display:block;min-height:24px;max-width:96px}',
      '}'
    ].join('');
    (document.head||document.documentElement).appendChild(st);
  }

  function buildDock(){
    if(document.getElementById('omega-controls-dock'))return;
    injectDockCss();
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
        if(sel) sel.value=lg.code;   /* keep the mobile <select> in step */
        if(window.OmegaI18n){window.OmegaI18n.translate(lg.code);}
        else{localStorage.setItem('omega_lang',lg.code);location.reload();}
      };
      dock.appendChild(btn);
    });

    /* Compact equivalent of the seven buttons above, shown only under 760px
       (see injectDockCss). Same handler, so the two can never disagree. */
    var sel=document.createElement('select');
    sel.id='omega-lang-select';
    sel.setAttribute('aria-label','Language');
    sel.title='Language';
    sel.style.cssText='font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:1px;padding:4px 6px;border:1px solid rgba(201,168,76,.2);color:#C9A84C;background:rgba(2,2,6,.9);cursor:pointer;border-radius:2px';
    LANGS.forEach(function(lg){
      var o=document.createElement('option');
      o.value=lg.code; o.textContent=lg.label+' · '+lg.name;
      sel.appendChild(o);
    });
    sel.value=localStorage.getItem('omega_lang')||'en';
    sel.onchange=function(){
      var code=sel.value;
      dock.querySelectorAll('[data-lang]').forEach(function(b){
        var on=b.getAttribute('data-lang')===code;
        b.style.color=on?'#C9A84C':'#8a8676';
        b.style.borderColor=on?'rgba(201,168,76,.5)':'rgba(201,168,76,.2)';
        b.style.background=on?'rgba(201,168,76,.07)':'transparent';
      });
      if(window.OmegaI18n){window.OmegaI18n.translate(code);}
      else{localStorage.setItem('omega_lang',code);location.reload();}
    };
    dock.appendChild(sel);

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
