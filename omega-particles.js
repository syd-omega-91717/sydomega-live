/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN PARTICLE ENGINE (omega-particles.js)
   tsParticles (MIT) — element-specific live particle backgrounds.
   Each of the nine sovereign elements has a unique particle signature.
   Fires after the user profile loads and their element is known.
   ========================================================================== */
(function(){
'use strict';

var ELEM_CONFIGS = {
  /* Primal Triad */
  'Fire':   { color:['#E2C86D','#FF6B35','#C9A84C'], shape:'circle', speed:1.8, size:{min:1.5,max:4}, opacity:{min:.15,max:.65}, move:{direction:'top-right',outMode:'out'}, count:55, glow:'#FF6B35' },
  'Water':  { color:['#00E5FF','#0077FF','#00B4D8'], shape:'circle', speed:0.9, size:{min:2,max:6},   opacity:{min:.1,max:.45},  move:{direction:'bottom',outMode:'out'},       count:40, glow:'#00E5FF' },
  'Wind':   { color:['#E0E0E0','#B0BEC5','#78909C'], shape:'circle', speed:3.2, size:{min:.5,max:2.5},opacity:{min:.05,max:.35}, move:{direction:'right',outMode:'out'},         count:80, glow:'#90CAF9' },
  /* Middle Triad */
  'Metal':  { color:['#E2C86D','#C9A84C','#8D6E63'], shape:'triangle',speed:0.6, size:{min:2,max:5},  opacity:{min:.12,max:.55}, move:{direction:'none',outMode:'bounce'},       count:30, glow:'#C9A84C' },
  'Sand':   { color:['#C9A84C','#FFD54F','#A1887F'], shape:'circle', speed:1.2, size:{min:1,max:3},   opacity:{min:.08,max:.5},  move:{direction:'bottom-right',outMode:'out'},   count:70, glow:'#FFD54F' },
  'Soul':   { color:['#9B6BF0','#CE93D8','#E040FB'], shape:'circle', speed:1.0, size:{min:3,max:8},   opacity:{min:.05,max:.35}, move:{direction:'none',outMode:'bounce'},        count:20, glow:'#E040FB' },
  /* Supreme Triad */
  'Space':  { color:['#00E5FF','#7C4DFF','#E040FB'], shape:'star',   speed:0.4, size:{min:1,max:3},   opacity:{min:.1,max:.8},   move:{direction:'none',outMode:'bounce'},        count:90, glow:'#7C4DFF' },
  'Void':   { color:['#1A1A2E','#16213E','#0F3460'], shape:'circle', speed:0.3, size:{min:2,max:7},   opacity:{min:.04,max:.25}, move:{direction:'none',outMode:'bounce'},        count:18, glow:'#0A0A0F' },
  'The All':{ color:['#E2C86D','#00E5FF','#9B6BF0','#3fb27f','#FF6B35'], shape:'circle', speed:1.5, size:{min:1,max:5}, opacity:{min:.1,max:.6}, move:{direction:'none',outMode:'bounce'}, count:50, glow:'#E2C86D' }
};

/* Map sign to element (matches canon in character.html) */
var SIGN_ELEM = {
  Aries:'Fire',Taurus:'Water',Gemini:'Wind',Cancer:'Water',
  Leo:'Fire',Virgo:'Sand',Libra:'Wind',Scorpio:'Soul',
  Sagittarius:'Fire',Capricorn:'Metal',Aquarius:'Metal',Pisces:'Water'
};

function resolveElement(pr){
  if(pr&&pr.zodiac_sign&&SIGN_ELEM[pr.zodiac_sign]) return SIGN_ELEM[pr.zodiac_sign];
  return 'Void';
}

function buildConfig(elem){
  var c=ELEM_CONFIGS[elem]||ELEM_CONFIGS['Void'];
  return {
    fpsLimit:40,
    particles:{
      number:{value:c.count,density:{enable:true,width:1200,height:800}},
      color:{value:c.color},
      shape:{type:c.shape||'circle'},
      opacity:{value:c.opacity.max,random:{enable:true,minimumValue:c.opacity.min},animation:{enable:true,speed:0.5,minimumValue:c.opacity.min,sync:false}},
      size:{value:c.size.max,random:{enable:true,minimumValue:c.size.min}},
      move:{enable:true,speed:c.speed,direction:c.move.direction,outModes:{default:c.move.outMode},random:true,straight:false},
      twinkle:{particles:{enable:true,frequency:0.04,opacity:0.85}}
    },
    interactivity:{
      events:{onHover:{enable:true,mode:'repulse'},onClick:{enable:false}},
      modes:{repulse:{distance:80,duration:0.4}}
    },
    detectRetina:true,
    background:{color:'transparent'}
  };
}

function injectCanvas(elem){
  if(document.getElementById('omega-particles-canvas')) return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var cv=document.createElement('canvas');
  cv.id='omega-particles-canvas';
  cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0;transition:opacity 2s ease;';
  document.body.insertBefore(cv,document.body.firstChild);
  /* Fade in after brief delay */
  setTimeout(function(){cv.style.opacity='1';},400);
  return cv;
}

function launch(elemName){
  var cv=injectCanvas(elemName);
  if(!cv) return;
  import('https://esm.sh/tsparticles-slim@2').then(function(mod){
    var tsP=mod.tsParticles||mod.default;
    if(!tsP||typeof tsP.load!=='function') return;
    tsP.load({id:'omega-particles-canvas',element:cv,options:buildConfig(elemName)}).catch(function(){});
  }).catch(function(){});
}

/* Listen for profile load event from bg.js auth chain */
function handleProfile(pr){
  var elem=resolveElement(pr);
  launch(elem);
  if(window.OmegaParticles) return;
  window.OmegaParticles={element:elem,launch:launch,stop:function(){
    var cv=document.getElementById('omega-particles-canvas');
    if(cv) cv.style.opacity='0';
    setTimeout(function(){if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);},2000);
  }};
}

/* Hook into omega user loaded event */
window.addEventListener('omega:user-loaded',function(e){
  if(e&&e.detail&&e.detail.profile) handleProfile(e.detail.profile);
});
/* Fallback: poll for __omegaProfile */
var _poll=0,_pollMax=30;
(function poll(){
  if(window.__omegaProfile){handleProfile(window.__omegaProfile);return;}
  if(++_poll<_pollMax) setTimeout(poll,600);
})();

})();
