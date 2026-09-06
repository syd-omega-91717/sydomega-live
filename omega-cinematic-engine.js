/* Ω SYD OMEGA 91717 — CINEMATIC ENGINE v1.2
   Lightweight, dependency-free 2.5D visual layer.

   NOT LOADED BY ANY PAGE, and deliberately so -- see FIXES_LOG.md 111.
   Its depth() writes box-shadow straight onto .card/.kpi, which
   omega-visual-evolution.css owns, and its canvas() paints a second
   particle field over the one omega-particles.js already draws per
   member element. Wiring it in would regress both surfaces.

   Its stylesheet guard is #omega-cine-engine-css, NOT the
   #omega-cinematic-css that bg.js uses for omega-cinematic-system.css.
   Both once claimed that one id, so whichever ran first would have
   satisfied the other's guard: this module would have appended its HUD,
   scanlines and corner marks with NO stylesheet, leaving an unpositioned
   block and the literal text 'Ω // SOVEREIGN VISUAL SYSTEM' in the page
   flow. That is CLAUDE.md 8.1 class 5b -- a guard attribute is the
   module's identity, not the feature area's.
*/
(function(){
'use strict';
if(window.__omegaCinematicEngine)return;window.__omegaCinematicEngine=true;
var reduced=false;try{reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
var mobile=innerWidth<760;
function inject(){if(document.getElementById('omega-cine-engine-css'))return;var s=document.createElement('style');s.id='omega-cine-engine-css';s.textContent=''
+'.omega-cine-hud{position:fixed;inset:0;pointer-events:none;z-index:9985;overflow:hidden;contain:strict}'
+'.omega-cine-vignette{position:absolute;inset:-4%;background:radial-gradient(ellipse at center,transparent 46%,rgba(0,0,0,.20) 78%,rgba(0,0,0,.62) 100%);mix-blend-mode:multiply}'
+'.omega-cine-scan{position:absolute;inset:0;opacity:.10;background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(255,255,255,.025) 4px);mix-blend-mode:screen}'
+'.omega-cine-corners:before,.omega-cine-corners:after{content:"";position:absolute;width:42px;height:42px;border-color:rgba(201,168,76,.38);border-style:solid}'
+'.omega-cine-corners:before{top:18px;left:18px;border-width:1px 0 0 1px}.omega-cine-corners:after{right:18px;bottom:18px;border-width:0 1px 1px 0}'
+'.omega-cine-label{position:absolute;left:28px;bottom:24px;font:9px var(--M,monospace);letter-spacing:3px;color:rgba(201,168,76,.48);text-transform:uppercase}'
+'.omega-cine-crosshair{position:absolute;left:50%;top:50%;width:22px;height:22px;transform:translate(-50%,-50%);opacity:.06}'
+'.omega-cine-crosshair:before,.omega-cine-crosshair:after{content:"";position:absolute;background:var(--cyan,#00e5ff)}'
+'.omega-cine-crosshair:before{left:10px;top:0;width:1px;height:22px}.omega-cine-crosshair:after{left:0;top:10px;width:22px;height:1px}'
+'.omega-cine-depth{transform-style:preserve-3d;backface-visibility:hidden}'
+'@media (prefers-reduced-motion:reduce){.omega-cine-hud{display:none!important}}';document.head.appendChild(s);}
function hud(){if(reduced||document.querySelector('.omega-cine-hud'))return;var h=document.createElement('div');h.className='omega-cine-hud';h.setAttribute('aria-hidden','true');h.innerHTML='<div class="omega-cine-vignette"></div><div class="omega-cine-scan"></div><div class="omega-cine-corners"></div><div class="omega-cine-crosshair"></div><div class="omega-cine-label">Ω // SOVEREIGN VISUAL SYSTEM</div>';document.body.appendChild(h);}
function canvas(){if(reduced||mobile||document.getElementById('omega-cine-canvas'))return;var c=document.createElement('canvas');c.id='omega-cine-canvas';c.setAttribute('aria-hidden','true');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.34';document.body.appendChild(c);var x=c.getContext('2d'),w=0,h=0,d=1,pts=[],mx=.5,my=.5,raf=0,last=0;
function resize(){d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);}function seed(){pts=[];var n=Math.min(72,Math.max(34,Math.floor(w*h/24000)));for(var i=0;i<n;i++)pts.push({x:Math.random()*w,y:Math.random()*h,z:.2+Math.random()*.8,r:.5+Math.random()*1.5,p:Math.random()*6.28});}
function draw(ts){if(ts-last<28){raf=requestAnimationFrame(draw);return;}last=ts;x.clearRect(0,0,w,h);var ox=(mx-.5)*18,oy=(my-.5)*12;for(var i=0;i<pts.length;i++){var p=pts[i],px=p.x+ox*p.z,py=p.y+oy*p.z+Math.sin(ts*.00025+p.p)*1.5*p.z;x.globalAlpha=.10+.30*p.z;x.fillStyle=p.z>.65?'#00e5ff':'#c9a84c';x.beginPath();x.arc(px,py,p.r*p.z,0,Math.PI*2);x.fill();if(p.z>.58&&i%4===0){var q=pts[(i+7)%pts.length],qx=q.x+ox*q.z,qy=q.y+oy*q.z;x.globalAlpha=.03*p.z;x.strokeStyle='#c9a84c';x.beginPath();x.moveTo(px,py);x.lineTo(qx,qy);x.stroke();}}raf=requestAnimationFrame(draw);}
addEventListener('resize',function(){resize();seed();},{passive:true});addEventListener('pointermove',function(e){mx=e.clientX/w;my=e.clientY/h;},{passive:true});resize();seed();raf=requestAnimationFrame(draw);}
function depth(){if(reduced||mobile)return;document.querySelectorAll('.card,.kpi,.kpi-card,.tile,.widget').forEach(function(el){if(el.dataset.omegaDepth)return;el.dataset.omegaDepth='1';el.classList.add('omega-cine-depth');el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--omega-lx',Math.round((nx+.5)*100)+'%');el.style.setProperty('--omega-ly',Math.round((ny+.5)*100)+'%');el.style.setProperty('--omega-depth-glow','rgba(0,229,255,'+(0.035+Math.abs(nx+ny)*.02)+')');el.style.boxShadow='inset 0 1px 0 rgba(255,255,255,.07),0 0 0 1px rgba(0,229,255,.08),0 14px 34px -20px rgba(0,0,0,.92),0 0 26px '+el.style.getPropertyValue('--omega-depth-glow');},{passive:true});el.addEventListener('pointerleave',function(){el.style.removeProperty('--omega-lx');el.style.removeProperty('--omega-ly');el.style.removeProperty('box-shadow');},{passive:true});});}
function boot(){inject();hud();canvas();depth();document.documentElement.dataset.omegaCinematic='ready';}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
