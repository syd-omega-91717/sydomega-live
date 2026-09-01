/* SYD OMEGA 91717 — canonical page-character runtime.
   Non-destructive: reads the page URL, assigns a visual archetype, adds
   semantic hooks, and never replaces existing page content. */
(function(){
  'use strict';
  if(window.__omegaPageCharacter)return;
  window.__omegaPageCharacter=true;

  var CHAR={
    command:{visual:'command',motion:'cinematic',depth:'orbital',density:'clear',interaction:'direct'},
    identity:{visual:'identity',motion:'ceremonial',depth:'glass',density:'clear',interaction:'direct'},
    intelligence:{visual:'intelligence',motion:'reactive',depth:'holographic',density:'data',interaction:'explore'},
    knowledge:{visual:'knowledge',motion:'calm',depth:'glass',density:'readable',interaction:'learn'},
    gaming:{visual:'arena',motion:'dynamic',depth:'3d',density:'visual',interaction:'play'},
    media:{visual:'cinema',motion:'cinematic',depth:'3d',density:'visual',interaction:'watch'},
    commerce:{visual:'exchange',motion:'dynamic',depth:'glass',density:'transactional',interaction:'buy'},
    creation:{visual:'forge',motion:'reactive',depth:'3d',density:'workspace',interaction:'create'},
    community:{visual:'constellation',motion:'organic',depth:'glass',density:'social',interaction:'connect'},
    governance:{visual:'council',motion:'ceremonial',depth:'holographic',density:'structured',interaction:'decide'},
    finance:{visual:'treasury',motion:'precise',depth:'glass',density:'data',interaction:'manage'},
    system:{visual:'control',motion:'precise',depth:'holographic',density:'technical',interaction:'operate'},
    sovereign:{visual:'sovereign',motion:'subtle',depth:'glass',density:'clear',interaction:'direct'}
  };
  var RULES=[
    [/command|dashboard|home/,'command'],[/identity|profile|passport|character|account|membership/,'identity'],
    [/intelligence|research|prediction|analytics|graph|search|oracle|agents|ai/,'intelligence'],
    [/academy|knowledge|library|codex|exam|flashcard|grades|heritage|tutor/,'knowledge'],
    [/gaming|game|arena|trophy|leaderboard/,'gaming'],[/media|cinema|film|series|trailers|music|video/,'media'],
    [/marketplace|commerce|merchant|store|shop|services/,'commerce'],[/forge|creator|creation|publishing|contribution|lab|project/,'creation'],
    [/social|family|contacts|feed|community|factions/,'community'],[/governance|govern|compliance|approvals|charter|covenant|terms/,'governance'],
    [/vault|treasury|wallet|income|payments|payment|investment|portfolio|ledger|budget|expenses/,'finance'],
    [/settings|maintenance|system|admin|operator|enterprise|security|kyc/,'system']
  ];
  function classify(){
    var key=(location.pathname.split('/').pop()||'index').replace(/\.html?$/i,'').toLowerCase();
    for(var i=0;i<RULES.length;i++)if(RULES[i][0].test(key))return [key,RULES[i][1]];
    return [key,'sovereign'];
  }
  function mount(){
    var pair=classify(),key=pair[0],type=pair[1],c=CHAR[type];
    document.documentElement.dataset.omegaPage=key;
    document.documentElement.dataset.omegaCharacter=type;
    Object.keys(c).forEach(function(k){document.documentElement.style.setProperty('--omega-'+k,c[k]);});
    var body=document.body;if(body){body.dataset.omegaPage=key;body.dataset.omegaCharacter=type;}
    if(!document.getElementById('omega-page-character-css')){
      var st=document.createElement('style');st.id='omega-page-character-css';
      st.textContent='[data-omega-character]{--omega-motion-speed:1s} body[data-omega-character="media"] .card:hover,body[data-omega-character="gaming"] .card:hover{transform:translateY(-4px) scale(1.015)} body[data-omega-character="knowledge"]{--omega-motion-speed:2s} @media(prefers-reduced-motion:reduce){[data-omega-character]{--omega-motion-speed:0s}}';
      (document.head||document.documentElement).appendChild(st);
    }
    document.dispatchEvent(new CustomEvent('omega:page-character',{detail:{page:key,character:type,manifest:c}}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
