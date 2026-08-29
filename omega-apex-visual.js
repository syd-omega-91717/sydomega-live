/* Ω SYD OMEGA 91717 — APEX VISUAL SYSTEM v1.0
   Platform-wide art direction layer. Dependency-free, progressive enhancement.
   Motion is explanatory, never required for comprehension.
*/
(function(){
  'use strict';
  if(window.__omegaApexVisual)return;
  window.__omegaApexVisual=true;
  var reduced=false, mobile=innerWidth<820;
  try{reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}

  function css(){
    if(document.getElementById('omega-apex-css'))return;
    var s=document.createElement('style');s.id='omega-apex-css';
    s.textContent=''
    +':root{--omega-apex-gold:#c9a84c;--omega-apex-cyan:#00e5ff;--omega-apex-violet:#9b6bf0;--omega-apex-bg:#05050a}'
    +'.omega-apex-stage{position:fixed;inset:0;z-index:9970;pointer-events:none;overflow:hidden;contain:strict}'
    +'.omega-apex-spot{position:absolute;width:min(44vw,680px);height:min(44vw,680px);border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(0,229,255,.075),rgba(201,168,76,.025) 34%,transparent 70%);filter:blur(18px);opacity:.8;will-change:left,top}'
    +'.omega-apex-star{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--omega-apex-gold);box-shadow:0 0 9px var(--omega-apex-gold);opacity:.22}'
    +'.omega-apex-scan{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,229,255,.18),rgba(201,168,76,.22),transparent);opacity:.5}'
    +'.omega-apex-reveal{opacity:0;transform:translateY(14px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}'
    +'.omega-apex-reveal.omega-apex-visible{opacity:1;transform:none}'
    +'.omega-apex-depth{transform-style:preserve-3d;will-change:transform}'
    +'.omega-apex-depth:after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at var(--apex-x,50%) var(--apex-y,50%),rgba(255,255,255,.055),transparent 42%);opacity:0;transition:opacity .25s ease}'
    +'.omega-apex-depth:hover:after{opacity:1}'
    +'.omega-apex-pulse{animation:omega-apex-pulse 2.8s ease-in-out infinite}'
    +'@keyframes omega-apex-pulse{0%,100%{filter:drop-shadow(0 0 0 rgba(0,229,255,0))}50%{filter:drop-shadow(0 0 8px rgba(0,229,255,.18))}}'
    +'@media(max-width:819px){.omega-apex-stage{display:none}.omega-apex-depth{transform:none!important}.omega-apex-reveal{opacity:1;transform:none;transition:none}}'
    +'@media(prefers-reduced-motion:reduce){.omega-apex-stage{display:none}.omega-apex-reveal{opacity:1;transform:none;transition:none}.omega-apex-pulse{animation:none}}';
    document.head.appendChild(s);
  }
  function stage(){
    if(reduced||mobile||document.querySelector('.omega-apex-stage'))return;
    var st=document.createElement('div');st.className='omega-apex-stage';st.setAttribute('aria-hidden','true');
    var spot=document.createElement('div');spot.className='omega-apex-spot';spot.style.left='50%';spot.style.top='38%';st.appendChild(spot);
    for(var i=0;i<26;i++){var p=document.createElement('i');p.className='omega-apex-star';p.style.left=(Math.random()*100)+'%';p.style.top=(Math.random()*100)+'%';p.style.opacity=(.08+Math.random()*.22).toFixed(2);st.appendChild(p);}
    var scan=document.createElement('i');scan.className='omega-apex-scan';scan.style.top='18%';st.appendChild(scan);document.body.appendChild(st);
    var mx=.5,my=.38;
    addEventListener('pointermove',function(e){mx=e.clientX/innerWidth;my=e.clientY/innerHeight;spot.style.left=(mx*100)+'%';spot.style.top=(my*100)+'%';},{passive:true});
    setInterval(function(){scan.style.top=(12+Math.random()*76)+'%';},9000);
  }
  function reveals(){
    var els=document.querySelectorAll('main .card,main .panel,main .kpi,main .kpi-card,main .module,main .tile,main .widget,main .section,main .hero');
    if(!els.length)return;
    if(reduced||!('IntersectionObserver' in window)){return;}
    var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('omega-apex-visible');io.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px -5%'});
    Array.prototype.forEach.call(els,function(el,i){if(i<40){el.classList.add('omega-apex-reveal');el.style.transitionDelay=Math.min(i*.018,.22)+'s';io.observe(el);}});
  }
  function depth(){
    if(reduced||mobile)return;
    var els=document.querySelectorAll('.card,.kpi,.kpi-card,.panel,.module,.tile,.widget,.hero');
    Array.prototype.forEach.call(els,function(el){if(el.dataset.apexDepth)return;el.dataset.apexDepth='1';el.classList.add('omega-apex-depth');
      el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,nx=x/r.width-.5,ny=y/r.height-.5;el.style.setProperty('--apex-x',(x/r.width*100)+'%');el.style.setProperty('--apex-y',(y/r.height*100)+'%');el.style.transform='perspective(1100px) rotateX('+(-ny*2.2)+'deg) rotateY('+(nx*2.6)+'deg) translateZ(3px)';},{passive:true});
      el.addEventListener('pointerleave',function(){el.style.transform='';},{passive:true});
    });
  }
  function boot(){css();stage();reveals();depth();document.documentElement.dataset.omegaApex='ready';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
