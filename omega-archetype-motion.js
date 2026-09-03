/**
 * Phase C.5: Archetype-Specific Motion & Visual Styling
 * Applies animation intensity, timing functions, and visual hierarchy
 * to pages based on their archetype identity and motion level.
 */
(function(){
  if(window.OmegaArchetypeMotion) return;
  var API = window.OmegaArchetypeMotion = {
    applyMotionStyling:function(){
      if(!window.OmegaArchetype) return false;
      var archetype=window.OmegaArchetype.getCurrent(); if(!archetype) return false;
      var motionLevel=window.OmegaArchetype.getMotionLevel(archetype);
      injectMotionStylesheet(motionLevel,archetype); return true;
    },
    getMotionTiming:function(level){return ({0:0,1:400,2:300,3:200,4:150,5:100})[level]||300;},
    getEasingFunction:function(level){return ({0:'linear',1:'cubic-bezier(0.4,0,0.2,1)',2:'cubic-bezier(0.4,0,0.6,1)',3:'cubic-bezier(0.34,1.56,0.64,1)',4:'cubic-bezier(0.68,-0.55,0.27,1.55)',5:'cubic-bezier(0.6,-0.6,0.4,1.6)'})[level]||'ease';},
    getStaggerDelay:function(level,itemIndex){return API.getMotionTiming(level)*(0.1-level*0.01)*itemIndex;}
  };
  function injectMotionStylesheet(level,archetype){
    var styleId='omega-archetype-motion-'+level+'-'+archetype;
    if(document.getElementById(styleId)) return;
    var timing=API.getMotionTiming(level),easing=API.getEasingFunction(level),style=document.createElement('style');
    style.id=styleId; style.textContent=buildMotionCSS(level,timing,easing,archetype); document.head.appendChild(style);
  }
  function buildMotionCSS(level,timing,easing){
    var rules='';
    rules+='[data-motion-level="'+level+'"] .card,[data-motion-level="'+level+'"] .kpi{transition:transform '+timing+'ms '+easing+',opacity '+timing+'ms linear,box-shadow '+timing+'ms ease,border-color '+timing+'ms ease;transform-style:preserve-3d;backface-visibility:hidden;}';
    rules+='[data-motion-level="'+level+'"] .card{position:relative;overflow:hidden;}';
    if(level>=1){
      rules+='[data-motion-level="'+level+'"] .card:hover{transform:translateY('+(-2+level*2)+'px) translateZ(8px);box-shadow:0 '+(8+level*3)+'px '+(20+level*7)+'px rgba(0,0,0,.38),0 0 24px rgba(201,168,76,'+(0.04+level*.012)+');}';
      rules+='[data-motion-level="'+level+'"] .btn:hover{transition:transform '+Math.max(80,timing*.75)+'ms '+easing+';transform:translateY(-1px) scale('+(1+level*.015)+');filter:brightness(1.1);}';
    }
    rules+='[data-motion-level="'+level+'"] .card::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.055) 50%,transparent 70%);background-size:220% 100%;opacity:0;transition:opacity .35s ease,background-position .8s ease;}';
    rules+='[data-motion-level="'+level+'"] .card:hover::after{opacity:1;background-position:100% 0;}';
    if(level>=3){
      rules+='@keyframes omega-motion-'+level+'-entrance{from{opacity:0;transform:translateY('+(level*8)+'px)}to{opacity:1;transform:none}}';
      rules+='[data-motion-level="'+level+'"] .card{animation:omega-motion-'+level+'-entrance '+timing+'ms '+easing+' both;}';
    }
    rules+='@media(prefers-reduced-motion:reduce){[data-motion-level] .card,[data-motion-level] .kpi,[data-motion-level] .btn{animation:none!important;transition:none!important;transform:none!important}.omega-cinematic-layer{display:none!important}}';
    return rules;
  }
  function autoInit(){API.applyMotionStyling();}
  document.addEventListener('DOMContentLoaded',autoInit);
  if(document.readyState!=='loading') autoInit();
})();