/* Ω SYD OMEGA 91717 — UNIFIED INTERFACE V2
   Global, dependency-free enhancement layer.
   Adds readable command affordances, live status telemetry, and
   consistent interaction states without changing page business logic. */
(function(){
  'use strict';
  if(window.__omegaInterfaceV2) return;
  window.__omegaInterfaceV2 = true;

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',fn,{once:true});
    else fn();
  }
  function inject(src, attr){
    if(document.querySelector('script['+attr+']')) return;
    var s=document.createElement('script'); s.src=src; s.defer=true; s.setAttribute(attr,'1');
    (document.body||document.head).appendChild(s);
  }
  function injectStyle(href, attr){
    if(document.querySelector('link['+attr+']')) return;
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=href; l.setAttribute(attr,'1');
    document.head.appendChild(l);
  }

  function mount(){
    if(document.querySelector('[data-omega-interface-v2]')) return;
    inject('/omega-command-catalog.js','data-omega-command-catalog');
    injectStyle('/omega-command-palette.css','data-omega-command-style');
    inject('/omega-command-palette.js','data-omega-command-palette');

    var root=document.createElement('div');
    root.setAttribute('data-omega-interface-v2','1');
    root.className='omega-v2-hud';
    root.innerHTML='<div class="omega-v2-signal" aria-hidden="true"></div><div class="omega-v2-label"><span>Ω</span> SYSTEM ONLINE</div><button class="omega-v2-command" type="button" aria-label="Open Omega command interface">COMMAND <kbd>/</kbd></button>';
    document.body.appendChild(root);

    var btn=root.querySelector('.omega-v2-command');
    function requestCommand(){
      document.dispatchEvent(new CustomEvent('omega:command_request',{detail:{source:'global-hud'}}));
      var input=document.querySelector('.omega-command-input');
      if(input){
        var palette=document.getElementById('omega-command-palette');
        if(palette) palette.hidden=false;
        input.focus();
      }
    }
    btn.addEventListener('click',requestCommand);

    document.addEventListener('keydown',function(e){
      if((e.key==='/' || (e.metaKey && e.key.toLowerCase()==='k')) && !/input|textarea|select/i.test(document.activeElement.tagName)){
        e.preventDefault(); btn.click();
      }
    });

    document.addEventListener('omega:command_request',function(){
      var input=document.querySelector('.omega-command-input');
      if(input){ var palette=document.getElementById('omega-command-palette'); if(palette) palette.hidden=false; input.focus(); }
    });

    if(window.OmegaOS && OmegaOS.events){
      OmegaOS.events.on('page_loaded',function(){root.classList.add('is-live');});
      OmegaOS.events.on('js_error',function(){root.classList.add('is-alert');setTimeout(function(){root.classList.remove('is-alert');},3500);});
      OmegaOS.events.on('promise_error',function(){root.classList.add('is-alert');setTimeout(function(){root.classList.remove('is-alert');},3500);});
    }
  }
  ready(mount);
})();
