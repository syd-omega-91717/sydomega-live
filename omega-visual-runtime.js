/* Ω VISUAL RUNTIME — page identity + the visual-universe sheet, for pages that
   do not link it themselves.

   THE GUARD IS ON THE RESOURCE, NOT JUST ON THIS MODULE. It used to check only
   for its own #omega-visual-runtime-css, which stops this module injecting
   twice but never notices the page ALREADY links the same stylesheet in its
   <head>. index.html does exactly that, so omega-visual-universe.css loaded
   TWICE there (measured: styleSheets order 1 and 16, two matching <link> tags),
   and the second copy — landing after omega-cinematic-system.css — beat
   `.omega-depth-card` at equal (0,1,0) specificity. The six front-page cards
   the author explicitly marked `omega-card omega-depth-card` therefore painted
   omega-visual-universe's panel, never the cinematic one (FIXES_LOG.md 115).

   That is CLAUDE.md 8.1 class 5 in a new shape: a guard keyed to the module's
   identity when the thing that must not be duplicated is the RESOURCE. */
(function(){'use strict';if(window.__OMEGA_VISUAL_RUNTIME__)return;window.__OMEGA_VISUAL_RUNTIME__=true;var d=document.documentElement;var p=(location.pathname.split('/').pop()||'index.html').replace(/\.html?$/i,'').toLowerCase()||'home';d.dataset.omegaPage=p;d.dataset.omegaVisual='active';if(!document.getElementById('omega-visual-runtime-css')&&!document.querySelector('link[rel="stylesheet"][href$="omega-visual-universe.css"]')){var l=document.createElement('link');l.id='omega-visual-runtime-css';l.rel='stylesheet';l.href='/omega-visual-universe.css';document.head.appendChild(l)}if(!document.querySelector('[data-omega-runtime-mark]')){var m=document.createElement('span');m.dataset.omegaRuntimeMark='true';m.setAttribute('aria-hidden','true');m.style.cssText='position:fixed;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden';m.textContent='SYD OMEGA visual runtime active: '+p;document.body.appendChild(m)}})();