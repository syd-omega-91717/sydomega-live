/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN CODE PROTECTION
   Prevents script copying, DevTools inspection, and source reading.
   Applied globally via bg.js. No legitimate user functionality blocked.
   ========================================================================== */
(function(){
  if(window.__omegaProtected) return;
  window.__omegaProtected=true;

  /* Form fields are exempt from the blocks below: select-all, right-click
     (paste/spell-check), and save are legitimate, expected interactions
     inside an input/textarea/contenteditable, and blocking them there
     contradicts this file's own "no legitimate user functionality
     blocked" goal above. */
  function isEditable(t){
    if(!t) return false;
    var tag=t.tagName;
    return tag==='INPUT'||tag==='TEXTAREA'||t.isContentEditable;
  }

  /* ── Disable right-click context menu ──────────────────────────── */
  document.addEventListener('contextmenu',function(e){
    if(isEditable(e.target)) return;
    e.preventDefault();
    return false;
  });

  /* ── Block select-all / view-source shortcuts ───────────────────── */
  document.addEventListener('keydown',function(e){
    var k=e.key||'';
    /* Block: Ctrl/Cmd + U (view source), Ctrl+A (select all),
              Ctrl+S (save), F12 (devtools), Ctrl+Shift+I/J/C */
    if(e.ctrlKey||e.metaKey){
      if(['a','A'].indexOf(k)>-1&&isEditable(e.target)) return;
      if(['u','U','s','S','a','A'].indexOf(k)>-1){
        e.preventDefault(); return false;
      }
      if(e.shiftKey&&['i','I','j','J','c','C','k','K'].indexOf(k)>-1){
        e.preventDefault(); return false;
      }
    }
    if(k==='F12'){e.preventDefault(); return false;}
  });

  /* ── CSS: disable text selection on sensitive elements ─────────── */
  var style=document.createElement('style');
  style.textContent=
    'body{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}'
    +'.selectable{user-select:text!important;-webkit-user-select:text!important}'
    +'*::selection{background:transparent}'
    +'[data-selectable]{user-select:text!important}';
  document.head.appendChild(style);

  /* ── DevTools detection: size shift heuristic ───────────────────── */
  var _devOpen=false;
  var _threshold=160;
  function checkDevTools(){
    var widthDiff=window.outerWidth-window.innerWidth;
    var heightDiff=window.outerHeight-window.innerHeight;
    var open=(widthDiff>_threshold)||(heightDiff>_threshold);
    if(open&&!_devOpen){
      _devOpen=true;
      /* Clear console — frustrates casual script inspection */
      if(typeof console!=='undefined'){
        var c=console.clear;
        if(c) c.call(console);
        console.log('%c\u03A9 SYD OMEGA 91717 \u2014 SOVEREIGN PROTECTED SYSTEM','color:#C9A84C;font-size:16px;font-weight:bold;font-family:serif');
        console.log('%cAll source code is the exclusive intellectual property of Major Sleiman Youssef Dagher.\nUnauthorized inspection, copying, or reproduction is strictly prohibited.','color:#8a8676;font-size:12px');
      }
    }
    if(!open) _devOpen=false;
  }
  setInterval(checkDevTools,1000);

  /* ── Disable drag of images/elements ───────────────────────────── */
  document.addEventListener('dragstart',function(e){e.preventDefault();});

  /* ── Scramble toString to deter script extractors ───────────────── */
  try{
    var _origToString=Function.prototype.toString;
    Function.prototype.toString=function(){
      if(this===Function.prototype.toString) return _origToString.call(this);
      return '\u03A9 SOVEREIGN PROTECTED FUNCTION \u2014 SYD OMEGA 91717';
    };
  }catch(e){}

  /* ── Console protection banner ──────────────────────────────────── */
  if(typeof console!=='undefined'&&console.log){
    console.log('%c\u03A9','color:#C9A84C;font-size:48px;font-weight:bold');
    console.log('%c SYD OMEGA 91717 \u2014 SOVEREIGN SYSTEM\n All source code copyright Major Sleiman Youssef Dagher.\n Lebanese Order of Engineers No. 30875','color:#C9A84C;font-size:13px;font-family:serif');
    console.log('%c Unauthorized access, copying, or reproduction is a violation of sovereignty.','color:#8B0000;font-size:12px');
  }

})();
