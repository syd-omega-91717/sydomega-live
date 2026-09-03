/** Ω SYD OMEGA 91717 — global archetype motion + cinematic surface layer. */
(function(){'use strict';if(window.OmegaArchetypeMotion)return;
var API=window.OmegaArchetypeMotion={
 getMotionTiming:function(level){return ({0:0,1:400,2:300,3:200,4:150,5:100})[level]??300},
 getEasingFunction:function(level){return ({0:'linear',1:'cubic-bezier(.4,0,.2,1)',2:'cubic-bezier(.4,0,.6,1)',3:'cubic-bezier(.34,1.56,.64,1)',4:'cubic-bezier(.68,-.55,.27,1.55)',5:'cubic-bezier(.6,-.6,.4,1.6)'})[level]||'ease'},
 getStaggerDelay:function(level,index){return API.getMotionTiming(level)*(0.1-level*.01)*index},
 applyMotionStyling:function(){var a=window.OmegaArchetype&&window.OmegaArchetype.getCurrent?window.OmegaArchetype.getCurrent():null;if(!a)return false;var l=window.OmegaArchetype.getMotionLevel(a);inject(l,a);return true}
};
function inject(level,archetype){var id='omega-archetype-motion-'+level+'-'+archetype;if(document.getElementById(id))return;var t=API.getMotionTiming(level),e=API.getEasingFunction(level),s=document.createElement('style');s.id=id;s.textContent='\
[data-motion-level="'+level+'"] .card,[data-motion-level="'+level+'"] .kpi{transition:transform '+t+'ms '+e+',opacity '+t+'ms ease,box-shadow '+t+'ms ease,border-color '+t+'ms ease;transform-style:preserve-3d;backface-visibility:hidden}\
[data-motion-level="'+level+'"] .card:hover{transform:translateY('+(-2+level*2)+'px) translateZ(8px);box-shadow:0 '+(8+level*3)+'px '+(20+level*7)+'px rgba(0,0,0,.38),0 0 24px rgba(201,168,76,'+(0.04+level*.012)+')}\
[data-motion-level="'+level+'"] .btn:hover{transform:translateY(-1px) scale('+(1+level*.015)+');filter:brightness(1.1)}\
[data-motion-level="'+level+'"] .card::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.055) 50%,transparent 70%);background-size:220% 100%;opacity:0;transition:opacity .35s ease,background-position .8s ease}\
[data-motion-level="'+level+'"] .card:hover::after{opacity:1;background-position:100% 0}\
@media(prefers-reduced-motion:reduce){[data-motion-level] .card,[data-motion-level] .kpi,[data-motion-level] .btn{animation:none!important;transition:none!important;transform:none!important}.omega-cinematic-layer{display:none!important}}';document.head.appendChild(s)}
function ready(){API.applyMotionStyling();document.documentElement.classList.add('omega-motion-ready')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();