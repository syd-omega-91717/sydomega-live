/* Ω WORLD ENGINE — live route verification + deterministic module registry */
(function(){'use strict';
if(window.OmegaWorldEngine)return;
var modules=[
{id:'core',name:'CORE',glyph:'Ω',href:'/dashboard.html',accent:'#C9A84C',purpose:'Identity, navigation and platform control.',role:'HOME WORLD / HUD'},
{id:'consultancy',name:'CONSULTANCY',glyph:'◇',href:'/consultancy.html',accent:'#00E5FF',purpose:'Professional advisory work and contracts.',role:'MISSIONS / CONTRACTS'},
{id:'gaming',name:'GAMING',glyph:'△',href:'/gaming.html',accent:'#E86A3A',purpose:'Games, competition and interactive play.',role:'ARENA'},
{id:'achievements',name:'ACHIEVEMENTS',glyph:'▲',href:'/achievements.html',accent:'#E8C97A',purpose:'Verified progress and earned recognition.',role:'ACHIEVEMENT TREE'},
{id:'family',name:'FAMILY',glyph:'⋔',href:'/family.html',accent:'#D9B86A',purpose:'Heritage, lineage and family context.',role:'DYNASTY MAP'},
{id:'media',name:'MEDIA',glyph:'▶',href:'/media.html',accent:'#C4453C',purpose:'Publishing and discovery of media.',role:'BROADCAST NETWORK'},
{id:'blockchain',name:'BLOCKCHAIN / NFT',glyph:'⬡',href:'/blockchain.html',accent:'#C9A84C',purpose:'Digital ownership and asset concepts.',role:'ASSET VAULT'},
{id:'communication',name:'COMMUNICATION',glyph:'⌁',href:'/chatbot.html',accent:'#00E5FF',purpose:'Member communication and assisted interaction.',role:'COMMS CHANNEL'},
{id:'horoscope',name:'HOROSCOPE',glyph:'☉',href:'/horoscope.html',accent:'#9B6BF0',purpose:'Entertainment and personal reflection.',role:'COSMIC MAP'},
{id:'news',name:'NEWS',glyph:'▤',href:'/news.html',accent:'#3FB27F',purpose:'Current information discovery.',role:'INTELLIGENCE FEED'},
{id:'heritage',name:'HERITAGE',glyph:'⌂',href:'/heritage.html',accent:'#D9B86A',purpose:'Preservation of history and evidence.',role:'ARCHIVE'},
{id:'progress',name:'PROGRESS',glyph:'↗',href:'/evolution.html',accent:'#00FF88',purpose:'Measurable development over time.',role:'PROGRESSION SYSTEM'},
{id:'credentials',name:'CREDENTIALS',glyph:'◇',href:'/credentials.html',accent:'#00E5FF',purpose:'Proof of achievement and identity.',role:'INVENTORY / LOADOUT'},
{id:'legal',name:'LEGAL',glyph:'§',href:'/terms.html',accent:'#A8A5A0',purpose:'Terms, consent and governance rules.',role:'RULES / SAFE ZONE'},
{id:'elemental',name:'ELEMENTAL',glyph:'✦',href:'/elements.html',accent:'#E86A3A',purpose:'Thematic identity and visual system.',role:'AVATAR AFFINITY'},
{id:'investment',name:'INVESTMENT',glyph:'◇',href:'/investment.html',accent:'#C9A84C',purpose:'Financial intelligence and strategy tools.',role:'STRATEGY ARENA'},
{id:'intelligence',name:'INTELLIGENCE',glyph:'●',href:'/intelligence.html',accent:'#9B6BF0',purpose:'Search, analytics and AI capabilities.',role:'COMMAND CENTER'},
{id:'hierarchy',name:'HIERARCHY',glyph:'◎',href:'/governance.html',accent:'#C9A84C',purpose:'Permissions, governance and authority.',role:'FACTION / AUTHORITY MAP'}
];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function setText(id,value){var n=document.getElementById(id);if(n)n.textContent=String(value);}
function render(){var root=document.getElementById('omega-world-nodes');if(!root)return;root.textContent='';modules.forEach(function(m){var a=document.createElement('a');a.className='ow-node';a.href=m.href;a.style.setProperty('--accent',m.accent);a.dataset.module=m.id;var glyph=document.createElement('span');glyph.className='ow-glyph';glyph.textContent=m.glyph;var name=document.createElement('span');name.className='ow-name';name.textContent=m.name;var purpose=document.createElement('span');purpose.className='ow-purpose';purpose.textContent=m.purpose;var role=document.createElement('span');role.className='ow-role';role.textContent=m.role;var live=document.createElement('span');live.className='ow-live';live.dataset.state='CHECKING';live.textContent='● CHECKING ROUTE';a.appendChild(glyph);a.appendChild(name);a.appendChild(purpose);a.appendChild(role);a.appendChild(live);root.appendChild(a);});}
async function verify(){var nodes=[].slice.call(document.querySelectorAll('.ow-node'));var results=await Promise.all(nodes.map(async function(node){var live=node.querySelector('.ow-live');try{var r=await fetch(node.getAttribute('href'),{method:'HEAD',cache:'no-store',credentials:'same-origin'});var ok=r.ok||r.status===401||r.status===403;var state=ok?'LIVE':'UNAVAILABLE';live.dataset.state=state;live.textContent='● '+state+' · HTTP '+r.status;return ok;}catch(e){live.dataset.state='UNAVAILABLE';live.textContent='● UNAVAILABLE · NETWORK';return false;}}));setText('ow-live-count',results.filter(Boolean).length);setText('ow-total-count',modules.length);setText('ow-verified-at',new Date().toISOString());}
function boot(){render();setText('ow-total-count',modules.length);verify();}
window.OmegaWorldEngine={modules:modules,verify:verify,boot:boot};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
