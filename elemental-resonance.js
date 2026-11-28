/* Ω Elemental Resonance Composer — canonical, user-created, session-only. */
(function(){
  'use strict';
  var root=document.getElementById('er-composer');
  if(!root||window.OmegaElementalResonance)return;
  var selects=[
    document.getElementById('er-element-1'),
    document.getElementById('er-element-2'),
    document.getElementById('er-element-3')
  ];
  var composeButton=document.getElementById('er-compose');
  var clearButton=document.getElementById('er-clear');
  var exportButton=document.getElementById('er-export');
  var status=document.getElementById('er-status');
  var stage=document.getElementById('er-stage');
  var nodes=document.getElementById('er-nodes');
  var selectedList=document.getElementById('er-selected');
  var registry=[];
  var byNumber=new Map();
  var generated=[];
  function wait(ms){return new Promise(function(resolve){window.setTimeout(resolve,ms);});}
  async function waitForPalette(){
    for(var attempt=0;attempt<30;attempt++){
      var palette=window.OmegaRealm&&window.OmegaRealm.palette;
      if(palette&&Object.keys(palette).length)return palette;
      await wait(100);
    }
    throw new Error('Shared element palette unavailable');
  }
  function titleCase(value){
    return String(value).toLowerCase().replace(/\b[a-z]/g,function(letter){return letter.toUpperCase();});
  }
  function safeHex(value){
    return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value.trim())?value.trim():null;
  }
  function addOption(select,value,label){
    var option=document.createElement('option');
    option.value=value;
    option.textContent=label;
    select.appendChild(option);
  }
  function selectedNumbers(){
    return selects.map(function(select){return select.value;}).filter(Boolean);
  }
  function updateOptionLocks(){
    selects.forEach(function(select){
      Array.prototype.forEach.call(select.options,function(option){
        if(!option.value)return;
        option.disabled=selects.some(function(other){return other!==select&&other.value===option.value;});
      });
    });
  }
  function updateButtons(){
    var values=selectedNumbers();
    var unique=new Set(values);
    composeButton.disabled=!values.length||unique.size!==values.length;
    clearButton.disabled=!values.length&&!generated.length;
    exportButton.disabled=!generated.length;
    if(values.length&&unique.size!==values.length)status.textContent='DUPLICATE ELEMENT · CHOOSE EACH ELEMENT ONCE';
  }
  function clearVisual(){
    generated=[];
    stage.dataset.count='0';
    stage.setAttribute('aria-label','No user-created elemental constellation yet');
    nodes.replaceChildren();
    selectedList.replaceChildren();
    exportButton.disabled=true;
    clearButton.disabled=selectedNumbers().length===0;
  }
  function onSelectionChange(){
    clearVisual();
    updateOptionLocks();
    updateButtons();
    if(selectedNumbers().length)status.textContent='SELECTION READY · COMPOSE TO CREATE YOUR CONSTELLATION';
    else status.textContent='CHOOSE ONE TO THREE ELEMENTS';
  }
  function selectedElements(){
    var values=selectedNumbers();
    var seen=new Set();
    return values.map(function(value){return byNumber.get(Number(value));}).filter(function(element){
      if(!element||seen.has(element.n))return false;
      seen.add(element.n);
      return true;
    });
  }
  function createNode(element,index){
    var node=document.createElement('div');
    node.className='er-node er-node--'+(index+1);
    node.style.setProperty('--er-color',element.color);
    var orb=document.createElement('span');
    orb.className='er-node-orb';
    orb.setAttribute('aria-hidden','true');
    var name=document.createElement('strong');
    name.textContent=element.name;
    var tier=document.createElement('small');
    tier.textContent=element.tier;
    node.appendChild(orb);
    node.appendChild(name);
    node.appendChild(tier);
    return node;
  }
  function createSelectedCard(element){
    var card=document.createElement('div');
    card.className='er-selected-card';
    card.style.setProperty('--er-color',element.color);
    var name=document.createElement('strong');
    name.textContent=element.name;
    var detail=document.createElement('span');
    detail.textContent=element.tier+' · '+element.domain;
    card.appendChild(name);
    card.appendChild(detail);
    return card;
  }
  function compose(){
    var chosen=selectedElements();
    if(!chosen.length||chosen.length!==selectedNumbers().length){
      status.textContent='SELECT ONE TO THREE DISTINCT ELEMENTS';
      updateButtons();
      return;
    }
    clearVisual();
    generated=chosen.slice();
    stage.dataset.count=String(chosen.length);
    stage.setAttribute('aria-label','User-created elemental constellation: '+chosen.map(function(e){return e.name;}).join(', '));
    chosen.forEach(function(element,index){
      nodes.appendChild(createNode(element,index));
      selectedList.appendChild(createSelectedCard(element));
    });
    clearButton.disabled=false;
    exportButton.disabled=false;
    status.textContent='CONSTELLATION COMPOSED · USER-CREATED · SESSION ONLY';
  }
  function escapeXml(value){
    return String(value).replace(/[&<>"']/g,function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char];
    });
  }
  function designToken(name){
    var value=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var hex=safeHex(value);
    if(!hex)throw new Error('Design token unavailable: '+name);
    return hex;
  }
  function buildSvg(elements){
    var bg=designToken('--void');
    var gold=designToken('--gold');
    var cyan=designToken('--cyan');
    var ink=designToken('--ink');
    var muted=designToken('--muted');
    var positions=elements.length===1?[[800,235]]
      :elements.length===2?[[520,320],[1080,320]]
      :[[800,170],[490,625],[1110,625]];
    var lines=positions.map(function(point){
      return '<line x1="800" y1="450" x2="'+point[0]+'" y2="'+point[1]+'" stroke="'+cyan+'" stroke-opacity=".48" stroke-width="2"/>';
    }).join('');
    var marks=elements.map(function(element,index){
      var point=positions[index];
      var color=safeHex(element.color)||gold;
      return '<g><circle cx="'+point[0]+'" cy="'+point[1]+'" r="104" fill="'+color+'" fill-opacity=".13" stroke="'+color+'" stroke-width="3"/>'+
        '<circle cx="'+point[0]+'" cy="'+point[1]+'" r="78" fill="'+bg+'" stroke="'+color+'" stroke-opacity=".55" stroke-width="2"/>'+
        '<text x="'+point[0]+'" y="'+(point[1]-4)+'" fill="'+ink+'" font-family="Cinzel,serif" font-size="27" font-weight="700" text-anchor="middle">'+escapeXml(element.name)+'</text>'+
        '<text x="'+point[0]+'" y="'+(point[1]+31)+'" fill="'+color+'" font-family="monospace" font-size="16" letter-spacing="2" text-anchor="middle">'+escapeXml(element.tier)+'</text></g>';
    }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">'+
      '<title id="title">SYD OMEGA Elemental Resonance Composition</title>'+
      '<desc id="desc">A user-created constellation of '+escapeXml(elements.map(function(e){return e.name;}).join(', '))+'. Session-only visual composition; no progression claim.</desc>'+
      '<rect width="1600" height="900" fill="'+bg+'"/>'+
      '<circle cx="800" cy="450" r="350" fill="none" stroke="'+gold+'" stroke-opacity=".32" stroke-width="2"/>'+
      '<circle cx="800" cy="450" r="245" fill="none" stroke="'+cyan+'" stroke-opacity=".24" stroke-width="2"/>'+
      '<g>'+lines+'</g><g>'+marks+'</g>'+
      '<circle cx="800" cy="450" r="86" fill="'+bg+'" stroke="'+gold+'" stroke-width="3"/>'+
      '<circle cx="800" cy="450" r="70" fill="'+gold+'" fill-opacity=".1" stroke="'+gold+'" stroke-opacity=".5"/>'+
      '<text x="800" y="468" fill="'+gold+'" font-family="Cinzel,serif" font-size="60" text-anchor="middle">Ω</text>'+
      '<text x="800" y="790" fill="'+ink+'" font-family="Cinzel,serif" font-size="27" letter-spacing="5" text-anchor="middle">ELEMENTAL RESONANCE</text>'+
      '<text x="800" y="835" fill="'+muted+'" font-family="monospace" font-size="16" letter-spacing="2" text-anchor="middle">USER-CREATED · SESSION ONLY · NO PROGRESSION CLAIM</text>'+
      '</svg>';
  }
  function exportSvg(){
    if(!generated.length)return;
    try{
      var blob=new Blob([buildSvg(generated)],{type:'image/svg+xml;charset=utf-8'});
      var url=URL.createObjectURL(blob);
      var anchor=document.createElement('a');
      anchor.href=url;
      anchor.download='syd-omega-elemental-resonance.svg';
      anchor.style.display='none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(function(){URL.revokeObjectURL(url);},1500);
      status.textContent='SVG EXPORT PREPARED · USER-CREATED ARTIFACT';
    }catch(error){
      status.textContent='SVG EXPORT UNAVAILABLE · DESIGN TOKENS NOT READY';
      console.warn('[Omega Elemental Resonance] export failed',error);
    }
  }
  function clear(){
    selects.forEach(function(select){select.value='';});
    clearVisual();
    updateOptionLocks();
    updateButtons();
    status.textContent='COMPOSITION RESET · CHOOSE ONE TO THREE ELEMENTS';
  }
  async function init(){
    try{
      var response=await fetch('/omega-elements.json',{cache:'force-cache'});
      if(!response.ok)throw new Error('Canonical element registry unavailable');
      var canon=await response.json();
      if(!canon||!Array.isArray(canon.elements)||canon.elements.length!==9)throw new Error('Canonical element registry is incomplete');
      var palette=await waitForPalette();
      var fallback=safeHex(getComputedStyle(document.documentElement).getPropertyValue('--gold').trim());
      if(!fallback)throw new Error('Canonical gold design token unavailable');
      registry=canon.elements.map(function(element){
        var key=titleCase(element.name);
        var entry=palette[key];
        var color=entry&&safeHex(entry.core);
        if(!color)color=fallback;
        return {n:Number(element.n),name:String(element.name),tier:String(element.tier),domain:String(element.domain||''),paletteKey:key,color:color};
      });
      registry.forEach(function(element){byNumber.set(element.n,element);});
      selects.forEach(function(select,index){
        select.replaceChildren();
        addOption(select,'',index===0?'SELECT AN ELEMENT':'OPTIONAL · ADD ANOTHER');
        registry.forEach(function(element){
          addOption(select,String(element.n),element.name+' · '+element.tier);
        });
        select.disabled=false;
        select.addEventListener('change',onSelectionChange);
      });
      composeButton.addEventListener('click',compose);
      clearButton.addEventListener('click',clear);
      exportButton.addEventListener('click',exportSvg);
      updateButtons();
      status.textContent='CANONICAL ELEMENTS READY · SELECT ONE TO THREE';
    }catch(error){
      status.textContent='ELEMENTAL COMPOSER UNAVAILABLE · CANON OR PALETTE NOT READY';
      console.warn('[Omega Elemental Resonance] initialization failed',error);
    }
  }
  window.OmegaElementalResonance={compose:compose,clear:clear,exportSvg:exportSvg};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();