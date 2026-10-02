(function(){
  'use strict';
  if(window.__omegaValueLayer) return;
  window.__omegaValueLayer=true;
  var DATA_URL='/config/omega-value-layer.json';
  var STATES={LIVE:1,CALCULATED:1,SIMULATED:1,'USER-CREATED':1,LORE:1,UNAVAILABLE:1,PARTIAL:1};
  function pageId(){var p=location.pathname.split('/').pop()||'dashboard.html';return p.replace(/\.html$/,'')||'dashboard';}
  function safeUrl(url){if(typeof url!=='string'||url.charAt(0)!=='/'||url.indexOf('//')===0)return '/dashboard.html';return url;}
  function stateFromText(text){var s=String(text||'').toUpperCase();for(var k in STATES)if(s.indexOf(k)>-1)return k;return 'LIVE';}
  function getState(info){var explicit=document.documentElement.getAttribute('data-omega-state')||(document.body&&document.body.getAttribute('data-omega-state'));if(explicit&&STATES[explicit])return explicit;return stateFromText(info&&info.proof);}
  function realmLinks(realm,data){var r=data.realms&&data.realms[realm];return r&&Array.isArray(r.next)?r.next.slice(0,3):[];}
  function render(data){
    if(document.getElementById('omega-value-layer'))return;
    var id=pageId(),info=(data.pages&&data.pages[id])||data.default||{},realm=(data.realms&&data.realms[info.realm])||{},state=getState(info);
    var wrap=document.createElement('section');wrap.id='omega-value-layer';wrap.setAttribute('aria-label','Omega value and next action');
    var card=document.createElement('div');card.className='omega-value-card';
    function col(kicker,body){var c=document.createElement('div');var k=document.createElement('div');k.className='omega-value-kicker';k.textContent=kicker;c.appendChild(k);var b=document.createElement('div');b.className='omega-value-copy';b.appendChild(body);c.appendChild(b);return c;}
    var purpose=document.createElement('div');var pt=document.createElement('div');pt.className='omega-value-title';pt.textContent=realm.label||String(info.realm||'OMEGA').toUpperCase();purpose.appendChild(pt);var pc=document.createElement('div');pc.className='omega-value-copy';pc.textContent=info.purpose||realm.purpose||'';purpose.appendChild(pc);card.appendChild(col('THIS SURFACE',purpose));
    var value=document.createTextNode(info.value||'');var valueCol=col('VALUE',value);var related=realmLinks(info.realm,data);if(related.length){var rel=document.createElement('div');rel.className='omega-value-related';related.forEach(function(href){var a=document.createElement('a');a.href=safeUrl(href);a.textContent=href.replace(/^\//,'').replace(/\.html$/,'').replace(/-/g,' ').toUpperCase();rel.appendChild(a);});valueCol.appendChild(rel);}card.appendChild(valueCol);
    var proof=document.createElement('div');var st=document.createElement('span');st.className='omega-value-state';st.textContent=state;var dot=document.createElement('span');dot.className='omega-value-dot';dot.setAttribute('aria-hidden','true');st.prepend(dot);proof.appendChild(st);var pr=document.createElement('div');pr.className='omega-value-copy';pr.textContent=info.proof||'State is determined from the configured evidence contract.';proof.appendChild(pr);var tm=document.createElement('div');tm.className='omega-value-copy';tm.textContent='Typical time: '+(info.time||'varies');proof.appendChild(tm);card.appendChild(col('PROOF / TIME',proof));
    var action=document.createElement('div');var ak=document.createElement('div');ak.className='omega-value-kicker';ak.textContent='NEXT';action.appendChild(ak);var a=document.createElement('a');a.className='omega-value-action';a.href=safeUrl(info.next&&info.next.href);a.textContent=(info.next&&info.next.label)||'Open Command';action.appendChild(a);var cm=document.createElement('div');cm.className='omega-value-copy';cm.textContent=info.commercial||'Commercial state is shown only from authoritative configuration.';action.appendChild(cm);card.appendChild(action);
    wrap.appendChild(card);var anchor=document.querySelector('main')||document.querySelector('.content')||document.querySelector('.shell')||document.body;if(anchor&&anchor.parentNode){if(anchor.tagName==='MAIN')anchor.insertBefore(wrap,anchor.firstChild);else anchor.parentNode.insertBefore(wrap,anchor);}
    try{document.dispatchEvent(new CustomEvent('omega:value-layer-ready',{detail:{page:id,realm:info.realm,state:state}}));}catch(e){}
  }
  function load(){fetch(DATA_URL,{credentials:'same-origin',cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('value-layer-config');return r.json();}).then(render).catch(function(){render({default:{realm:'command',purpose:'Understand this platform surface and choose your next useful action.',value:'The platform connects services into one governed experience.',proof:'UNAVAILABLE — value metadata could not be loaded.',next:{label:'Open Command',href:'/dashboard.html'},time:'varies',commercial:'Commercial information is shown only from authoritative sources.'},realms:{}});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();