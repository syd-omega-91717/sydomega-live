/* ==========================================================================
   Ω SYD OMEGA 91717 — SOVEREIGN SIGIL GENERATOR (omega-sigil-gen.js)
   Procedural SVG sigil generation from sovereign identity parameters.
   Each sovereign receives a unique, deterministic sigil based on:
   - Authority score (shape complexity)
   - Element (color palette and primary motif)
   - Axis values A/B/C (geometric proportions)
   - Gate level (stroke weight and glow intensity)
   Public API: window.OmegaSigil = { generate(opts), mount(el, opts), download(opts) }
   ========================================================================== */
(function(){
'use strict';

var ELEM_PALETTES={
  Fire:   {primary:'#FF6B35',secondary:'#FFA07A',bg:'#1a0500',glow:'rgba(255,107,53,.4)'},
  Water:  {primary:'#00B4D8',secondary:'#90E0EF',bg:'#000d1a',glow:'rgba(0,180,216,.4)'},
  Wind:   {primary:'#B0BEC5',secondary:'#ECEFF1',bg:'#0a0d0f',glow:'rgba(176,190,197,.3)'},
  Metal:  {primary:'#E2C86D',secondary:'#FFF9E6',bg:'#0d0a00',glow:'rgba(226,200,109,.4)'},
  Sand:   {primary:'#FFD54F',secondary:'#FFECB3',bg:'#0d0a00',glow:'rgba(255,213,79,.3)'},
  Soul:   {primary:'#9B6BF0',secondary:'#CE93D8',bg:'#0a0014',glow:'rgba(155,107,240,.5)'},
  Space:  {primary:'#7C4DFF',secondary:'#B388FF',bg:'#030012',glow:'rgba(124,77,255,.5)'},
  Void:   {primary:'#334466',secondary:'#5577AA',bg:'#000005',glow:'rgba(51,68,102,.3)'},
  'The All':{primary:'#E2C86D',secondary:'#FFFFFF',bg:'#050508',glow:'rgba(226,200,109,.6)'}
};

/* Seeded pseudo-random for deterministic output */
function seeded(seed){
  var s=Math.abs(seed)|0||1;
  return function(){
    s=(s*1664525+1013904223)>>>0;
    return s/4294967296;
  };
}

/* Hash a string to a seed number */
function strHash(str){
  var h=0;
  for(var i=0;i<str.length;i++){h=((h<<5)-h+str.charCodeAt(i))|0;}
  return Math.abs(h);
}

/* Generate SVG path points for a sovereign sigil */
function generateSigil(opts){
  var auth=opts.auth||5;
  var elem=opts.elem||'Void';
  var a=opts.axisA||3;
  var b=opts.axisB||3;
  var c=opts.axisC||3;
  var name=opts.name||'Sovereign';
  var gate=opts.gate||1;
  var size=opts.size||300;

  var seed=strHash(name+elem+String(Math.round(auth*100)));
  var rng=seeded(seed);
  var pal=ELEM_PALETTES[elem]||ELEM_PALETTES['Void'];
  var cx=size/2,cy=size/2,r=size*0.38;

  /* Complexity driven by gate (1-12) → 3-12 points */
  var nPoints=Math.max(3,Math.min(12,Math.round(3+gate*0.75)));
  /* Angular offset driven by A axis */
  var angOffset=(a/10)*Math.PI;
  /* Radial jitter driven by B axis */
  var jitter=(b/10)*r*0.3;
  /* Inner radius ratio driven by C axis */
  var innerRatio=0.3+((c/10)*0.35);

  var svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'">'];
  svg.push('<defs>');
  /* Glow filter */
  svg.push('<filter id="sig-glow" x="-50%" y="-50%" width="200%" height="200%">');
  svg.push('<feGaussianBlur in="SourceGraphic" stdDeviation="'+(3+gate*0.5)+'" result="blur"/>');
  svg.push('<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>');
  svg.push('</filter>');
  /* Radial gradient */
  svg.push('<radialGradient id="sig-grad" cx="50%" cy="50%" r="50%">');
  svg.push('<stop offset="0%" stop-color="'+pal.secondary+'" stop-opacity="0.9"/>');
  svg.push('<stop offset="100%" stop-color="'+pal.primary+'" stop-opacity="0.5"/>');
  svg.push('</radialGradient>');
  svg.push('</defs>');

  /* Background circle */
  svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*1.15)+'" fill="'+pal.bg+'" stroke="'+pal.primary+'" stroke-width="0.5" stroke-opacity="0.3"/>');

  /* Outer ring */
  var strokeW=0.5+gate*0.1;
  svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+pal.primary+'" stroke-width="'+strokeW.toFixed(2)+'" stroke-opacity="0.4" filter="url(#sig-glow)"/>');

  /* Build sigil star polygon */
  var outerPts=[],innerPts=[];
  for(var i=0;i<nPoints;i++){
    var ang=angOffset+i*(2*Math.PI/nPoints);
    var jit=(rng()-.5)*jitter;
    outerPts.push({
      x:cx+Math.cos(ang)*(r+jit),
      y:cy+Math.sin(ang)*(r+jit)
    });
    var iAng=ang+Math.PI/nPoints;
    innerPts.push({
      x:cx+Math.cos(iAng)*(r*innerRatio+jit*.5),
      y:cy+Math.sin(iAng)*(r*innerRatio+jit*.5)
    });
  }

  /* Interleave outer/inner to form star */
  var starPts=[];
  for(var j=0;j<nPoints;j++){
    starPts.push(outerPts[j]);
    starPts.push(innerPts[j]);
  }
  var starPath=starPts.map(function(p,k){return (k===0?'M':'L')+p.x.toFixed(2)+','+p.y.toFixed(2);}).join(' ')+'Z';

  /* Filled star */
  svg.push('<path d="'+starPath+'" fill="url(#sig-grad)" fill-opacity="0.2" stroke="'+pal.primary+'" stroke-width="1" filter="url(#sig-glow)"/>');

  /* Inner web — connect outer points */
  var webOpacity=0.1+gate*0.02;
  for(var k=0;k<nPoints;k++){
    for(var l=k+1;l<nPoints;l++){
      if(rng()<0.4+auth/55){
        svg.push('<line x1="'+outerPts[k].x.toFixed(2)+'" y1="'+outerPts[k].y.toFixed(2)+'"');
        svg.push(' x2="'+outerPts[l].x.toFixed(2)+'" y2="'+outerPts[l].y.toFixed(2)+'"');
        svg.push(' stroke="'+pal.primary+'" stroke-width="0.4" stroke-opacity="'+webOpacity.toFixed(2)+'"/>');
      }
    }
  }

  /* Central element — auth-scaled circle or symbol */
  var coreR=r*0.12+auth/27.8367*r*0.1;
  svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+coreR.toFixed(2)+'" fill="'+pal.primary+'" fill-opacity="0.7" filter="url(#sig-glow)"/>');

  /* Three axis lines from center */
  var axisAngles=[angOffset,angOffset+2*Math.PI/3,angOffset+4*Math.PI/3];
  var axisLens=[a/10*r*0.7,b/10*r*0.7,c/10*r*0.7];
  axisAngles.forEach(function(ang,i){
    var x2=cx+Math.cos(ang)*axisLens[i];
    var y2=cy+Math.sin(ang)*axisLens[i];
    svg.push('<line x1="'+cx+'" y1="'+cy+'" x2="'+x2.toFixed(2)+'" y2="'+y2.toFixed(2)+'"');
    svg.push(' stroke="'+pal.secondary+'" stroke-width="0.8" stroke-opacity="0.5"/>');
    /* Endpoint dot */
    svg.push('<circle cx="'+x2.toFixed(2)+'" cy="'+y2.toFixed(2)+'" r="2.5" fill="'+pal.secondary+'" fill-opacity="0.6"/>');
  });

  /* Authority ring arc (partial — proportional to gate) */
  var arcFrac=gate/12;
  var arcRadius=r*0.88;
  var arcStart=-Math.PI/2;
  var arcEnd=arcStart+arcFrac*2*Math.PI;
  var arcX1=cx+Math.cos(arcStart)*arcRadius;
  var arcY1=cy+Math.sin(arcStart)*arcRadius;
  var arcX2=cx+Math.cos(arcEnd)*arcRadius;
  var arcY2=cy+Math.sin(arcEnd)*arcRadius;
  var largeArc=arcFrac>.5?1:0;
  svg.push('<path d="M'+arcX1.toFixed(2)+','+arcY1.toFixed(2)+' A'+arcRadius.toFixed(2)+','+arcRadius.toFixed(2)+' 0 '+largeArc+',1 '+arcX2.toFixed(2)+','+arcY2.toFixed(2)+'"');
  svg.push(' fill="none" stroke="'+pal.primary+'" stroke-width="2" stroke-linecap="round" filter="url(#sig-glow)"/>');

  /* Gate numerals at start of arc */
  svg.push('<text x="'+arcX1.toFixed(2)+'" y="'+(arcY1-5).toFixed(2)+'" fill="'+pal.primary+'" font-family="Courier Prime,monospace" font-size="8" text-anchor="middle" opacity="0.7">'+gate+'</text>');

  /* Name initial */
  var initial=(name||'Ω').charAt(0).toUpperCase();
  svg.push('<text x="'+cx+'" y="'+(cy+coreR+16)+'" fill="'+pal.secondary+'" font-family="Cinzel Decorative,serif" font-size="'+Math.round(coreR*1.4)+'" text-anchor="middle" opacity="0.8" filter="url(#sig-glow)">'+initial+'</text>');

  svg.push('</svg>');
  return svg.join('');
}

/* ── Public API ── */
window.OmegaSigil={
  generate:function(opts){
    return generateSigil(opts);
  },
  mount:function(el,opts){
    if(!el)return;
    el.innerHTML=generateSigil(opts);
  },
  download:function(opts){
    var svg=generateSigil(opts);
    var blob=new Blob([svg],{type:'image/svg+xml'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download='sovereign-sigil-'+(opts.name||'omega').toLowerCase().replace(/\s+/g,'-')+'.svg';
    a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
  }
};

/* ── Auto-mount on [data-sigil] elements ── */
window.addEventListener('omega:user-loaded',function(e){
  var profile=e&&e.detail&&e.detail.profile;
  if(!profile)return;
  var SIGN_ELEM={Aries:'Fire',Taurus:'Metal',Gemini:'Wind',Cancer:'Water',Leo:'Fire',Virgo:'Sand',Libra:'Wind',Scorpio:'Water',Sagittarius:'Fire',Capricorn:'Metal',Aquarius:'Wind',Pisces:'Water'};
  var PHI=1.6180339887,EU=2.7182818285;
  var a=Number(profile.axis_a||0),b=Number(profile.axis_b||0),c=Number(profile.axis_c||0);
  var auth=profile.is_owner?27.8367:Math.sqrt(Math.pow(a,3)+Math.pow(b,3)+Math.pow(c,3))*PHI/EU;
  var GATE_THRESH=[2.32,3.98,5.95,8.29,11,13.92,17.21,20.87,24.01,25.9,27.1,27.8367];
  var gate=1;GATE_THRESH.forEach(function(t,i){if(auth>=t)gate=i+1;});
  var elem=SIGN_ELEM[profile.sign]||'Void';
  var name=profile.display_name||'Sovereign';
  var opts={auth:auth,elem:elem,axisA:a,axisB:b,axisC:c,gate:gate,name:name,size:280};
  document.querySelectorAll('[data-sigil]').forEach(function(el){
    var customSize=parseInt(el.getAttribute('data-sigil-size')||'280');
    window.OmegaSigil.mount(el,Object.assign({},opts,{size:customSize}));
  });
});

})();
