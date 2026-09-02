
/* ============================================================================ SYD OMEGA 91717 — OMEGA WORLD SHELL v1.0 Unified page shell. Drop onto any page: <script src=omega-world-shell.js></script> Auto-detects page character, injects emblem header, living compass, motion hierarchy, presence, command palette bridge, layered UI wrap. Non-destructive. Never replaces existing content. ============================================================================ */
 (function () {
'use strict';
if (window.__omegaWorldShell) return;
window.__omegaWorldShell = true;
const FRAMEWORK = {
command: {
name: 'Command Center', color: '#C9A84C', emblem: '⌖', motion: 2, desc: 'Origin and creation'
}, identity: {
name: 'Identity Chamber', color: '#00E5FF', emblem: '◈', motion: 1, desc: 'Who you are'
}, intelligence: {
name: 'Observatory', color: '#9B6BF0', emblem: '◎', motion: 2, desc: 'Analytical depth'
}, knowledge: {
name: 'Library', color: '#D9B86A', emblem: '◈', motion: 1, desc: 'Academy and canon'
}, gaming: {
name: 'Arena', color: '#E86A3A', emblem: '◉', motion: 4, desc: 'Competition and play'
}, media: {
name: 'Studio', color: '#8B0000', emblem: '▶', motion: 3, desc: 'Media and creation'
}, commerce: {
name: 'Exchange', color: '#C9A84C', emblem: '◉', motion: 1, desc: 'Marketplace'
}, creation: {
name: 'Forge', color: '#E2A63A', emblem: '◈', motion: 2, desc: 'Build and make'
}, community: {
name: 'Constellation', color: '#D9B86A', emblem: '⋈', motion: 1, desc: 'People and lineage'
}, governance: {
name: 'Council', color: '#9B6BF0', emblem: '◈', motion: 1, desc: 'Law and order'
}, finance: {
name: 'Treasury', color: '#C9A84C', emblem: 'Ω', motion: 1, desc: 'Wealth and holdings'
}, system: {
name: 'Sentinel', color: '#8FE3D4', emblem: '●', motion: 1, desc: 'Security and ops'
}, sovereign: {
name: 'Sovereign', color: '#C9A84C', emblem: 'Ω', motion: 3, desc: 'The Architect'
}
};
const REALMS = {
command: {
label: 'COMMAND', pages: ['command', 'dashboard', 'beacon', 'notifications', 'search', 'contacts', 'decisions', 'missions', 'network', 'notes', 'projects', 'quotes', 'time', 'vision']
}, identity: {
label: 'IDENTITY', pages: ['profile', 'identity', 'passport', 'character', 'settings', 'kyc']
}, ascend: {
label: 'ASCEND', pages: ['ascension', 'matrix', 'academy', 'gaming', 'honors', 'trophies', 'exam', 'contributions', 'achievements', 'leaderboard', 'grades', 'levels', 'points']
}, cosmos: {
label: 'COSMOS', pages: ['cosmos', 'elements', 'horoscope', 'pantheons', 'agents', 'gates', 'houses', 'triads', 'kings', 'chronicle', 'dna', 'graph', 'map', 'mirror', 'oracle', 'realm', 'rune', 'tribe']
}, universe: {
label: 'UNIVERSE', pages: ['media', 'cinema', 'series', 'trailers', 'universe', 'hall', 'city', 'ledger', 'feed', 'publications']
}, vault: {
label: 'VAULT', pages: ['vault', 'wallet', 'treasury', 'blockchain', 'payments', 'subscriptions', 'marketplace', 'portfolio', 'income', 'investment', 'budget', 'expenses', 'wealth', 'advertising', 'sovereign-covenant']
}, order: {
label: 'ORDER', pages: ['family', 'bloodline', 'heritage', 'sovereigns', 'factions', 'approvals', 'interface-omni']
}, services: {
label: 'SERVICES', pages: ['services', 'consultancy', 'contracts', 'publishing', 'studio', 'marketing', 'news', 'social', 'events', 'travel', 'health']
}, intel: {
label: 'INTEL', pages: ['intelligence', 'research', 'prediction', 'analytics', 'automation', 'compliance', 'graph-admin', 'graph-anomalies', 'graph-centrality', 'graph-evidence', 'graph-explorer', 'graph-timeline', 'graphify', 'atlas', 'cipher', 'codex', 'mindmap', 'nexus', 'pulse', 'sigma', 'signal']
}, govern: {
label: 'GOVERN', pages: ['governance', 'charter', 'terms', 'privacy', 'ecosystem', 'enterprise', 'knowledge', 'lab', 'maintenance', 'observatory', 'ops', 'roadmap', 'council']
}
};
const MOTION_CSS = [ 
/* Level 0 */
 '[data-omega-motion=0] *{animation:none!important;transition:none!important}', 
/* Level 1 */
 '[data-omega-motion=1] .shell-emblem{transition:transform .3s}[data-omega-motion=1] .shell-emblem:hover{transform:scale(1.05)}', 
/* Level 2 */
 '[data-omega-motion=2] .shell-emblem{animation:shellBreathe 6s ease-in-out infinite}[data-omega-motion=2] .realm-compass-item:hover{transform:translateX(4px)}@keyframes shellBreathe{0%,100%{opacity:.85}50%{opacity:1}}', 
/* Level 3 */
 '[data-omega-motion=3] .shell-emblem{animation:shellBreathe 4s ease-in-out infinite}[data-omega-motion=3] .shell-ring-outer{animation:shellSpin 20s linear infinite}@keyframes shellSpin{to{transform:rotate(360deg)}}', 
/* Level 4 */
 '[data-omega-motion=4] .shell-emblem{animation:shellBreathe 3s ease-in-out infinite}[data-omega-motion=4] .shell-ring-outer{animation:shellSpin 15s linear infinite}[data-omega-motion=4] .shell-ring-inner{animation:shellSpinR 25s linear infinite}@keyframes shellSpinR{to{transform:rotate(-360deg)}}', 
/* Level 5 */
 '[data-omega-motion=5] .shell-emblem{animation:shellBreathe 2s ease-in-out infinite}[data-omega-motion=5] .shell-ring-outer{animation:shellSpin 10s linear infinite}[data-omega-motion=5] .shell-ring-inner{animation:shellSpinR 18s linear infinite}[data-omega-motion=5] .shell-particles{display:block}' ];
function classify(key) {
var map = {
command: /command|dashboard|home|beacon|notifications|search|contacts|decisions|missions|network|notes|projects|quotes|time|vision/, identity: /identity|profile|passport|character|account|membership|settings|kyc/, intelligence: /intelligence|research|prediction|analytics|graph|search|oracle|agents|ai|atlas|cipher|codex|mindmap|nexus|pulse|sigma|signal/, knowledge: /academy|knowledge|library|codex|exam|flashcard|grades|heritage|tutor|principles|reading|skills|vocabulary/, gaming: /gaming|game|arena|trophy|leaderboard/, media: /media|cinema|film|series|trailers|music|video|feed|publications/, commerce: /marketplace|commerce|merchant|store|shop|services|consultancy|contracts/, creation: /forge|creator|creation|publishing|contribution|lab|project|studio|architect/, community: /social|family|contacts|feed|community|factions|bloodline|heritage|sovereigns|tribe/, governance: /governance|govern|compliance|approvals|charter|covenant|terms|privacy|ecosystem|roadmap|council/, finance: /vault|treasury|wallet|income|payments|payment|investment|portfolio|ledger|budget|expenses|wealth|advertising/, system: /settings|maintenance|system|admin|operator|enterprise|security|kyc|ops|maintenance/
};
for (var k in map) if (map[k].test(key)) return k;
return 'sovereign';
}
function getRealm(key) {
for (var r in REALMS) {
if (REALMS[r].pages.indexOf(key) !== -1) return r;
}
return 'command';
}
function injectStyles() {
if (document.getElementById('omega-world-shell-css')) return;
var st = document.createElement('style');
st.id = 'omega-world-shell-css';
st.textContent = '.omega-shell{position:fixed;top:0;left:0;right:0;z-index:9000;background:rgba(2,2,6,.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(201,168,76,.12);padding:8px 16px;display:flex;align-items:center;gap:16px;transform:translateY(-100%);transition:transform .4s cubic-bezier(.4,0,.2,1)}' + '.omega-shell.visible{transform:translateY(0)}' + '.shell-emblem-wrap{position:relative;width:44px;height:44px;flex-shrink:0}' + '.shell-emblem{font-size:28px;line-height:44px;text-align:center;display:block}' + '.shell-ring-outer,.shell-ring-inner{position:absolute;inset:0;border-radius:50%;border:1px solid currentColor;opacity:.3;pointer-events:none}' + '.shell-ring-inner{inset:4px;opacity:.2;border-style:dashed}' + '.shell-particles{display:none;position:absolute;inset:-10px;pointer-events:none}' + '.shell-title{font-family:var(--M);font-size:11px;letter-spacing:2px;color:var(--gold);line-height:1.2}' + '.shell-sub{font-family:var(--M);font-size:7px;letter-spacing:1.5px;color:var(--muted);margin-top:2px}' + '.shell-realm{font-family:var(--M);font-size:7px;letter-spacing:1.5px;padding:3px 8px;border:1px solid rgba(201,168,76,.2);border-radius:2px;color:var(--muted);margin-left:auto;white-space:nowrap}' + '.shell-compass-btn{font-family:var(--M);font-size:8px;letter-spacing:1.5px;padding:5px 10px;background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:2px;cursor:pointer;transition:.12s;white-space:nowrap}' + '.shell-compass-btn:hover{background:rgba(201,168,76,.08)}' + '.realm-compass{position:fixed;top:56px;left:0;right:0;z-index:8999;background:rgba(2,2,6,.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(201,168,76,.1);padding:12px 16px;display:none;transform:translateY(-10px);opacity:0;transition:all .3s}' + '.realm-compass.open{display:block;opacity:1;transform:translateY(0)}' + '.realm-compass-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}' + '.realm-compass-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(201,168,76,.08);border-radius:3px;cursor:pointer;transition:.12s;text-decoration:none}' + '.realm-compass-item:hover{background:rgba(201,168,76,.06);border-color:rgba(201,168,76,.2)}' + '.realm-compass-emblem{font-size:16px;width:24px;text-align:center}' + '.realm-compass-label{font-family:var(--M);font-size:8px;letter-spacing:1px;color:rgba(220,210,180,.7)}' + '.shell-presence{font-family:var(--M);font-size:7px;letter-spacing:1px;color:var(--green);display:flex;align-items:center;gap:6px;white-space:nowrap}' + '.shell-presence-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:shellPulse 2s ease-in-out infinite}' + '@keyframes shellPulse{0%,100%{opacity:1}50%{opacity:.4}}' + '.shell-cmd-hint{font-family:var(--M);font-size:7px;letter-spacing:1px;color:var(--muted);padding:3px 8px;border:1px solid rgba(201,168,76,.1);border-radius:2px}' + '@media(max-width:700px){.omega-shell{padding:8px 12px;gap:10px}.shell-emblem-wrap{width:36px;height:36px}.shell-emblem{font-size:22px;line-height:36px}.shell-title{font-size:9px}.shell-realm,.shell-presence{display:none}.shell-compass-btn{font-size:7px;padding:4px 8px}}' + '@media(prefers-reduced-motion:reduce){.omega-shell,.realm-compass{transition:none}}' + MOTION_CSS.join('');
(document.head || document.documentElement).appendChild(st);
}
function buildShell(key, char, realm) {
var c = FRAMEWORK[char] || FRAMEWORK.sovereign;
var r = REALMS[realm] || REALMS.command;
var shell = document.createElement('div');
shell.className = 'omega-shell';
shell.id = 'omega-world-shell';
shell.innerHTML = '<div class=shell-emblem-wrap>' + '<span class=shell-emblem style=color:' + c.color + '>' + c.emblem + '</span>' + '<span class=shell-ring-outer style=color:' + c.color + '></span>' + '<span class=shell-ring-inner style=color:' + c.color + '></span>' + '<span class=shell-particles></span>' + '</div>' + '<div style=min-width:0>' + '<div class=shell-title>' + key.toUpperCase() + '</div>' + '<div class=shell-sub>' + c.name + ' · ' + c.desc + '</div>' + '</div>' + '<span class=shell-realm>' + r.label + '</span>' + '<span class=shell-presence><span class=shell-presence-dot></span><span id=shell-presence-count>--</span> PRESENT</span>' + '<button class=shell-compass-btn id=shell-compass-toggle>◈ COMPASS</button>' + '<span class=shell-cmd-hint>Ctrl+K</span>';
return shell;
}
function buildCompass(currentKey, currentRealm) {
var compass = document.createElement('div');
compass.className = 'realm-compass';
compass.id = 'realm-compass';
var items = '';
for (var r in REALMS) {
var realm = REALMS[r];
var isActive = r === currentRealm;
items += '<div style=margin-bottom:8px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:6px>' + realm.label + '</div><div class=realm-compass-grid>';
realm.pages.forEach(function(p) {
var pc = FRAMEWORK[classify(p)] || FRAMEWORK.sovereign;
var isHere = p === currentKey;
items += '<a href=/' + p + '.html class=realm-compass-item style=' + (isHere ? 'border-color:' + pc.color + ';background:' + pc.color + '11' : '') + '>' + '<span class=realm-compass-emblem style=color:' + pc.color + '>' + pc.emblem + '</span>' + '<span class=realm-compass-label>' + p.toUpperCase() + '</span>' + '</a>';
});
items += '</div></div>';
}
compass.innerHTML = items;
return compass;
}
function init() {
var key = (location.pathname.split('/').pop() || 'index').replace(new RegExp('^.*?(?:^|[^a-zA-Z0-9])',''), '').replace(new RegExp('[^a-zA-Z0-9].*$',''), '') || 'enter';
var char = classify(key);
var realm = getRealm(key);
var c = FRAMEWORK[char];
if (!c) return;
injectStyles();
document.documentElement.dataset.omegaMotion = c.motion;
document.documentElement.dataset.omegaRealm = realm;
var shell = buildShell(key, char, realm);
var compass = buildCompass(key, realm);
document.body.insertBefore(shell, document.body.firstChild);
document.body.insertBefore(compass, document.body.firstChild);
setTimeout(function() {
shell.classList.add('visible');
}, 100);
var toggle = document.getElementById('shell-compass-toggle');
if (toggle) {
toggle.addEventListener('click', function() {
compass.classList.toggle('open');
toggle.textContent = compass.classList.contains('open') ? '◈ CLOSE' : '◈ COMPASS';
});
}
document.addEventListener('keydown', function(e) {
if (e.ctrlKey && e.key === 'k') {
e.preventDefault();
compass.classList.toggle('open');
if (toggle) toggle.textContent = compass.classList.contains('open') ? '◈ CLOSE' : '◈ COMPASS';
}
});
document.addEventListener('click', function(e) {
if (!compass.contains(e.target) && e.target !== toggle) {
compass.classList.remove('open');
if (toggle) toggle.textContent = '◈ COMPASS';
}
});

/* Simulate presence count */
 var presenceEl = document.getElementById('shell-presence-count');
if (presenceEl) {
var count = Math.floor(Math.random() * 12) + 1;
presenceEl.textContent = count;
setInterval(function() {
count += Math.floor(Math.random() * 3) - 1;
count = Math.max(1, Math.min(50, count));
presenceEl.textContent = count;
}, 15000);
}

/* Auto-wrap existing content into layered UI if not already wrapped */
 var main = document.querySelector('main') || document.querySelector('.main') || document.body;
if (main && !main.querySelector('[data-layered-ui]') && !main.querySelector('[data-layer-1]')) {
var children = Array.from(main.children).filter(function(ch) {
return !ch.classList || (!ch.classList.contains('omega-shell') && !ch.classList.contains('realm-compass'));
});
if (children.length > 0) {
var wrapper = document.createElement('div');
wrapper.setAttribute('data-layered-ui', 'true');
var layer1 = document.createElement('div');
layer1.setAttribute('data-layer-1', 'true');
var h1 = document.querySelector('h1');
var firstP = main.querySelector('p');
if (h1) layer1.appendChild(h1.cloneNode(true));
if (firstP) {
var p = document.createElement('p');
p.textContent = firstP.textContent.slice(0, 120);
p.style.cssText = 'font-family:var(--M);font-size:11px;color:var(--muted);margin:8px 0';
layer1.appendChild(p);
}
var layer2 = document.createElement('div');
layer2.setAttribute('data-layer-2', 'true');
children.forEach(function(ch) {
if (ch !== layer1) layer2.appendChild(ch);
});
wrapper.appendChild(layer1);
wrapper.appendChild(layer2);
main.appendChild(wrapper);
if (window.OmegaLayeredUI) window.OmegaLayeredUI.enhance(wrapper);
}
}
document.dispatchEvent(new CustomEvent('omega:world-shell-ready', {
detail: {
page: key, character: char, realm: realm, motion: c.motion, emblem: c.emblem
}
}));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
window.OmegaWorldShell = {
framework: FRAMEWORK, realms: REALMS, classify: classify, getRealm: getRealm, refresh: function() {
var shell = document.getElementById('omega-world-shell');
var compass = document.getElementById('realm-compass');
if (shell) shell.remove();
if (compass) compass.remove();
init();
}
};
})();