/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN REALM ENGINE (omega-realm.js)
   Three.js r160 (MIT) — 3-D element sphere on any canvas[data-realm].
   Automatically mounts when omega:user-loaded fires; reads __omegaProfile.
   Public API: window.OmegaRealm = { mount(canvas, elem), unmount(), setElement(elem) }
   ========================================================================== */
(function(){
'use strict';

var ELEM_PALETTE={
  Fire:  {core:'#FF6B35',mid:'#C9A84C',outer:'#8B0000',bg:'#1A0800'},
  Water: {core:'#00E5FF',mid:'#0077FF',outer:'#003366',bg:'#00060F'},
  Wind:  {core:'#E0E0E0',mid:'#90CAF9',outer:'#546E7A',bg:'#080C10'},
  Metal: {core:'#E2C86D',mid:'#C9A84C',outer:'#5D4037',bg:'#0A0800'},
  Sand:  {core:'#FFD54F',mid:'#C9A84C',outer:'#A1887F',bg:'#0E0A00'},
  Soul:  {core:'#CE93D8',mid:'#9B6BF0',outer:'#4A148C',bg:'#060010'},
  Space: {core:'#00E5FF',mid:'#7C4DFF',outer:'#1A0033',bg:'#000005'},
  Void:  {core:'#334466',mid:'#1A1A2E',outer:'#0A0A0F',bg:'#000000'},
  'The All':{core:'#E2C86D',mid:'#3fb27f',outer:'#9B6BF0',bg:'#050510'}
};

var ELEM_PARTICLE_COUNTS={Fire:800,Water:600,Wind:1200,Metal:400,Sand:1000,Soul:500,Space:1500,Void:300,'The All':900};

var _three=null,_renderer=null,_scene=null,_camera=null,_raf=null,_mounted=false;
var _sphere=null,_particles=null,_ring=null,_lights=[];
var _currentElem='Void';

/* ── Load Three.js ── */
function loadThree(){
  if(_three) return Promise.resolve(_three);
  return import('https://esm.sh/three@0.160.1').then(function(mod){
    _three=mod;
    return _three;
  });
}

function hexToRgb(hex){
  var r=parseInt(hex.slice(1,3),16)/255;
  var g=parseInt(hex.slice(3,5),16)/255;
  var b=parseInt(hex.slice(5,7),16)/255;
  return [r,g,b];
}

/* profiles.element is stored lowercase ('fire'), but ELEM_PALETTE/
   ELEM_PARTICLE_COUNTS keys are capitalized ('Fire') -- a plain
   ELEM_PALETTE[elem] lookup on the raw column value always misses and
   silently falls back to the generic Void palette. Confirmed live: every
   page that mounts via window.OmegaRealm.mount(canvas, pr.element) --
   profile.html (pre-existing) and dashboard/identity/ascension/character
   (this session) -- rendered every member's sphere in the same dark
   grey-blue Void colours regardless of their real element. Case-insensitive
   match against the real palette keys fixes every caller at once, including
   "The All" which a naive charAt(0).toUpperCase() alone would not. */
function normalizeElem(e){
  if(!e) return 'Void';
  var keys=Object.keys(ELEM_PALETTE);
  for(var i=0;i<keys.length;i++){ if(keys[i].toLowerCase()===String(e).toLowerCase()) return keys[i]; }
  return 'Void';
}

function mount(canvas,elemName){
  if(_mounted) unmount();
  var elem=normalizeElem(elemName||_currentElem||'Void');
  _currentElem=elem;
  var pal=ELEM_PALETTE[elem]||ELEM_PALETTE['Void'];
  var T=_three;

  /* Renderer */
  _renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  _renderer.setSize(canvas.clientWidth,canvas.clientHeight);
  _renderer.setClearColor(0x000000,0);

  /* Scene */
  _scene=new T.Scene();

  /* Camera */
  _camera=new T.PerspectiveCamera(55,canvas.clientWidth/canvas.clientHeight,0.1,1000);
  _camera.position.set(0,0,3.5);

  /* Sphere core */
  var rgb=hexToRgb(pal.core);
  var coreGeo=new T.IcosahedronGeometry(1,4);
  var coreMat=new T.MeshPhongMaterial({
    color:new T.Color(rgb[0],rgb[1],rgb[2]),
    emissive:new T.Color(rgb[0]*0.15,rgb[1]*0.15,rgb[2]*0.15),
    wireframe:false,shininess:60,transparent:true,opacity:0.88
  });
  _sphere=new T.Mesh(coreGeo,coreMat);
  _scene.add(_sphere);

  /* Wire frame layer */
  var wireMat=new T.MeshBasicMaterial({
    color:new T.Color(...hexToRgb(pal.mid)),
    wireframe:true,transparent:true,opacity:0.12
  });
  var wireGeo=new T.IcosahedronGeometry(1.01,2);
  var wireMesh=new T.Mesh(wireGeo,wireMat);
  _scene.add(wireMesh);

  /* Equatorial ring */
  var ringGeo=new T.TorusGeometry(1.35,0.008,8,80);
  var ringMat=new T.MeshBasicMaterial({
    color:new T.Color(...hexToRgb(pal.mid)),
    transparent:true,opacity:0.4
  });
  _ring=new T.Mesh(ringGeo,ringMat);
  _ring.rotation.x=Math.PI/2.2;
  _scene.add(_ring);

  /* Particle cloud */
  var count=ELEM_PARTICLE_COUNTS[elem]||600;
  var positions=new Float32Array(count*3);
  var colors=new Float32Array(count*3);
  var coreRgb=hexToRgb(pal.core);
  var outerRgb=hexToRgb(pal.outer);
  for(var i=0;i<count;i++){
    var theta=Math.random()*Math.PI*2;
    var phi=Math.acos(2*Math.random()-1);
    var r=1.5+Math.random()*1.8;
    positions[i*3]=r*Math.sin(phi)*Math.cos(theta);
    positions[i*3+1]=r*Math.sin(phi)*Math.sin(theta);
    positions[i*3+2]=r*Math.cos(phi);
    var t=Math.random();
    colors[i*3]=coreRgb[0]*(1-t)+outerRgb[0]*t;
    colors[i*3+1]=coreRgb[1]*(1-t)+outerRgb[1]*t;
    colors[i*3+2]=coreRgb[2]*(1-t)+outerRgb[2]*t;
  }
  var partGeo=new T.BufferGeometry();
  partGeo.setAttribute('position',new T.BufferAttribute(positions,3));
  partGeo.setAttribute('color',new T.BufferAttribute(colors,3));
  var partMat=new T.PointsMaterial({size:0.025,vertexColors:true,transparent:true,opacity:0.7});
  _particles=new T.Points(partGeo,partMat);
  _scene.add(_particles);

  /* Lights */
  var ambient=new T.AmbientLight(0xffffff,0.3);
  _scene.add(ambient);
  _lights.push(ambient);

  var crgb=hexToRgb(pal.core);
  var pt=new T.PointLight(new T.Color(crgb[0],crgb[1],crgb[2]),2,8);
  pt.position.set(2,2,2);
  _scene.add(pt);
  _lights.push(pt);

  var pt2=new T.PointLight(new T.Color(...hexToRgb(pal.mid)),1.2,6);
  pt2.position.set(-2,-1,1);
  _scene.add(pt2);
  _lights.push(pt2);

  /* Mouse drag rotation */
  var drag={active:false,lastX:0,lastY:0,vx:0,vy:0};
  canvas.addEventListener('mousedown',function(e){drag.active=true;drag.lastX=e.clientX;drag.lastY=e.clientY;drag.vx=0;drag.vy=0;});
  window.addEventListener('mouseup',function(){drag.active=false;});
  canvas.addEventListener('mousemove',function(e){
    if(!drag.active||!_sphere)return;
    var dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;
    drag.vx=dy*0.005;drag.vy=dx*0.005;
    drag.lastX=e.clientX;drag.lastY=e.clientY;
  });
  canvas.addEventListener('touchstart',function(e){if(e.touches.length===1){drag.active=true;drag.lastX=e.touches[0].clientX;drag.lastY=e.touches[0].clientY;}},{passive:true});
  canvas.addEventListener('touchmove',function(e){
    if(!drag.active||!_sphere||e.touches.length!==1)return;
    var dx=e.touches[0].clientX-drag.lastX,dy=e.touches[0].clientY-drag.lastY;
    drag.vx=dy*0.005;drag.vy=dx*0.005;
    drag.lastX=e.touches[0].clientX;drag.lastY=e.touches[0].clientY;
  },{passive:true});
  canvas.addEventListener('touchend',function(){drag.active=false;});

  /* Resize */
  function onResize(){
    if(!_renderer||!_camera)return;
    _renderer.setSize(canvas.clientWidth,canvas.clientHeight);
    _camera.aspect=canvas.clientWidth/canvas.clientHeight;
    _camera.updateProjectionMatrix();
  }
  window.addEventListener('resize',onResize);

  /* Animate */
  var t=0;
  function animate(){
    _raf=requestAnimationFrame(animate);
    t+=0.008;
    if(_sphere){
      if(!drag.active){_sphere.rotation.y+=0.003;_sphere.rotation.x+=0.001;}
      else{_sphere.rotation.x+=drag.vx;_sphere.rotation.y+=drag.vy;drag.vx*=0.9;drag.vy*=0.9;}
      wireMesh.rotation.copy(_sphere.rotation);
    }
    if(_ring){_ring.rotation.z+=0.002;}
    if(_particles){
      _particles.rotation.y-=0.001;
      _particles.rotation.x+=0.0005;
    }
    /* Pulsing light */
    pt.intensity=2+Math.sin(t*2.1)*0.4;
    _renderer.render(_scene,_camera);
  }
  _mounted=true;
  animate();
}

function unmount(){
  if(_raf){cancelAnimationFrame(_raf);_raf=null;}
  if(_renderer){_renderer.dispose();_renderer=null;}
  _scene=null;_camera=null;_sphere=null;_particles=null;_ring=null;
  _lights=[];_mounted=false;
}

function setElement(elem){
  if(!_mounted)return;
  var canvas=_renderer&&_renderer.domElement;
  if(canvas)mount(canvas,elem);
}

/* ── Auto-mount on [data-realm] canvases ── */
function autoMount(elem){
  /* Check for a realm canvas BEFORE downloading Three.js, not after. This
     guard used to sit inside the .then(), so every page where a profile
     loaded fetched three@0.160.1 from esm.sh -- hundreds of KB, on a page
     that then found no canvas[data-realm] and did nothing with it. Measured
     2026-09-06: three.js was requested on 10 of 10 sampled pages, and only
     the realm page has a canvas to mount. */
  if(!document.querySelector('canvas[data-realm]')) return;
  loadThree().then(function(){
    /* Re-query after the load: the canvas set can grow while it is in flight. */
    var canvases=document.querySelectorAll('canvas[data-realm]');
    canvases.forEach(function(cv){mount(cv,elem);});
  }).catch(function(e){
    console.warn('[OmegaRealm] Three.js load failed',e);
    /* Same reasoning as the public mount(): warning alone left every
       [data-realm] canvas at its default 300x150. */
    document.querySelectorAll('canvas[data-realm]').forEach(function(cv){
      drawFallback(cv,elem);
    });
  });
}

/* ── Static fallback when the 3-D engine cannot load ──────────────────
   loadThree() resolves a dynamic import from a third-party CDN, and an
   import that never resolves runs NONE of its .then() -- the same shape
   CLAUDE.md §4 records for the Supabase client and FIXES_LOG 128 for the
   particle engine.

   MEASURED on realm / identity / ascension / character, with the import
   both blocked and allowed:

     mount() CALLED elem=Fire canvasId=realm-canvas clientW=1344 clientH=672
     mount() returned
     UNHANDLED_REJECTION: TypeError: Failed to fetch dynamically imported
                          module: https://esm.sh/three@0.160.1

   So mount() is reached with a correctly sized canvas -- this is NOT the
   zero-size class-3 bug -- and then the engine never arrives. Because the
   public mount() below had no .catch(), that rejection went unhandled and
   the canvas kept the browser's DEFAULT 300x150 buffer stretched across
   its 1270x268 box: a visibly broken artifact on four pages, with nothing
   said to the member. autoMount() already had a .catch(), but it only
   warned, and no page uses that path -- all five call OmegaRealm.mount()
   directly.

   The failure path now draws something true instead of nothing: a layered
   radial orb in the member's OWN element colours, from the same
   ELEM_PALETTE the 3-D sphere uses. It does not imitate the sphere and
   does not pretend the engine loaded -- it is the same palette in 2D, so a
   member on a blocked or flaky network sees their element rather than a
   stretched blank. Nothing here is invented: the colour comes from the
   element already resolved for that member. */
function drawFallback(canvas,elemName){
  if(!canvas||!canvas.getContext) return false;
  var pal=ELEM_PALETTE[normalizeElem(elemName||_currentElem||'Void')]||ELEM_PALETTE['Void'];
  /* Size the BUFFER from the live box, not from the attribute defaults --
     leaving 300x150 is the whole defect this function exists to end. A box
     that is still zero means the canvas is in a hidden tab; observe it and
     draw when it is revealed (the approval guard fires no resize event). */
  function paint(){
    var w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h) return false;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);
    canvas.height=Math.round(h*dpr);
    var g=canvas.getContext('2d');
    if(!g) return false;              /* a WebGL context may already be bound */
    g.setTransform(dpr,0,0,dpr,0,0);
    g.clearRect(0,0,w,h);
    var cx=w/2, cy=h/2, r=Math.max(24,Math.min(w,h)*0.34);
    var halo=g.createRadialGradient(cx,cy,0,cx,cy,r*2.4);
    halo.addColorStop(0,   pal.mid+'33');
    halo.addColorStop(0.55,pal.outer+'1A');
    halo.addColorStop(1,   'rgba(0,0,0,0)');
    g.fillStyle=halo; g.fillRect(0,0,w,h);
    var orb=g.createRadialGradient(cx-r*0.3,cy-r*0.35,r*0.08,cx,cy,r);
    orb.addColorStop(0,   pal.core);
    orb.addColorStop(0.55,pal.mid);
    orb.addColorStop(1,   pal.outer);
    g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.fillStyle=orb; g.fill();
    g.beginPath(); g.arc(cx,cy,r*1.32,0,Math.PI*2);
    g.strokeStyle=pal.mid+'55'; g.lineWidth=1; g.stroke();
    canvas.setAttribute('data-realm-fallback','1');
    return true;
  }
  var ok=paint();
  /* Keep observing rather than disconnecting after the first success. The
     box can still change afterwards: measured on realm.html the fallback
     painted at clientWidth 1344 and the column settled to 1244 a moment
     later, leaving an 8% horizontal stretch. A canvas whose buffer is
     derived from its box has to track the box for as long as it lives, not
     once. Re-paints only when the size actually changes, so this is idle
     while nothing moves. */
  if(typeof ResizeObserver==='function'){
    var lastW=canvas.width,lastH=canvas.height;
    var ro=new ResizeObserver(function(){
      var dpr=Math.min(window.devicePixelRatio||1,2);
      var w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
      if(!w||!h||(w===lastW&&h===lastH)) return;
      if(paint()){ lastW=canvas.width; lastH=canvas.height; }
    });
    ro.observe(canvas);
  }
  return ok;
}

/* ── Public API ── */
window.OmegaRealm={
  mount:function(canvas,elem){
    var want=elem||_currentElem;
    return loadThree().then(function(){
      mount(canvas,want);
    }).catch(function(e){
      /* Never leave a default-sized canvas stretched across its box. */
      console.warn('[OmegaRealm] 3-D engine unavailable, drawing static fallback',e);
      drawFallback(canvas,want);
    });
  },
  unmount:unmount,
  setElement:setElement,
  isActive:function(){return _mounted;},
  drawFallback:drawFallback
};

/* ── Hook into profile load ── */
var SIGN_ELEM={Aries:'Fire',Taurus:'Metal',Gemini:'Wind',Cancer:'Water',Leo:'Fire',Virgo:'Sand',Libra:'Wind',Scorpio:'Water',Sagittarius:'Fire',Capricorn:'Metal',Aquarius:'Wind',Pisces:'Water'};

function handleProfile(pr){
  var elem=(pr&&pr.sign&&SIGN_ELEM[pr.sign])||'Void';
  _currentElem=elem;
  autoMount(elem);
}

window.addEventListener('omega:user-loaded',function(e){
  if(e&&e.detail&&e.detail.profile)handleProfile(e.detail.profile);
});

var _p=0;(function poll(){
  if(window.__omegaProfile){handleProfile(window.__omegaProfile);return;}
  if(++_p<20)setTimeout(poll,700);
})();

})();
