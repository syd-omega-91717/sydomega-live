
/* ============================================================================ SYD OMEGA 91717 — Page Character Framework v2.0 Full registry with motion hierarchy, visual language, and emblem binding. Upgrades v1 non-destructively. ============================================================================ */
 (function () {
'use strict';
if (window.__omegaPageCharacterV2) return;
window.__omegaPageCharacterV2 = true;
const FRAMEWORK = {
command: {
name: 'Command Center', visual: 'orbital', motion: 'cinematic', depth: 'holographic', density: 'clear', interaction: 'direct', emblem: '⌖', desc: 'Origin and creation'
}, identity: {
name: 'Identity Chamber', visual: 'glass', motion: 'ceremonial', depth: 'glass', density: 'clear', interaction: 'direct', emblem: '◈', desc: 'Who you are'
}, intelligence: {
name: 'Observatory', visual: 'data', motion: 'reactive', depth: 'holographic', density: 'data', interaction: 'explore', emblem: '◎', desc: 'Analytical depth'
}, knowledge: {
name: 'Library', visual: 'readable', motion: 'calm', depth: 'glass', density: 'readable', interaction: 'learn', emblem: '◈', desc: 'Academy and canon'
}, gaming: {
name: 'Arena', visual: 'arena', motion: 'dynamic', depth: '3d', density: 'visual', interaction: 'play', emblem: '◉', desc: 'Competition and play'
}, media: {
name: 'Studio', visual: 'cinema', motion: 'cinematic', depth: '3d', density: 'visual', interaction: 'watch', emblem: '▶', desc: 'Media and creation'
}, commerce: {
name: 'Exchange', visual: 'exchange', motion: 'dynamic', depth: 'glass', density: 'transactional', interaction: 'buy', emblem: '◉', desc: 'Marketplace'
}, creation: {
name: 'Forge', visual: 'forge', motion: 'reactive', depth: '3d', density: 'workspace', interaction: 'create', emblem: '◈', desc: 'Build and make'
}, community: {
name: 'Constellation', visual: 'constellation', motion: 'organic', depth: 'glass', density: 'social', interaction: 'connect', emblem: '⋈', desc: 'People and lineage'
}, governance: {
name: 'Council', visual: 'council', motion: 'ceremonial', depth: 'holographic', density: 'structured', interaction: 'decide', emblem: '◈', desc: 'Law and order'
}, finance: {
name: 'Treasury', visual: 'treasury', motion: 'precise', depth: 'glass', density: 'data', interaction: 'manage', emblem: 'Ω', desc: 'Wealth and holdings'
}, system: {
name: 'Sentinel', visual: 'control', motion: 'precise', depth: 'holographic', density: 'technical', interaction: 'operate', emblem: '●', desc: 'Security and ops'
}, sovereign: {
name: 'Sovereign', visual: 'sovereign', motion: 'subtle', depth: 'glass', density: 'clear', interaction: 'direct', emblem: 'Ω', desc: 'The Architect'
}
};
const MOTION_LEVELS = [ 'Static informational', 'Micro-interactions', 'Animated emblems and transitions', '3D objects / depth / parallax', 'Cinematic environments', 'Interactive worlds' ];
function classify(key) {
var map = {
command: /command|dashboard|home/, identity: /identity|profile|passport|character|account|membership/, intelligence: /intelligence|research|prediction|analytics|graph|search|oracle|agents|ai/, knowledge: /academy|knowledge|library|codex|exam|flashcard|grades|heritage|tutor/, gaming: /gaming|game|arena|trophy|leaderboard/, media: /media|cinema|film|series|trailers|music|video/, commerce: /marketplace|commerce|merchant|store|shop|services/, creation: /forge|creator|creation|publishing|contribution|lab|project/, community: /social|family|contacts|feed|community|factions/, governance: /governance|govern|compliance|approvals|charter|covenant|terms/, finance: /vault|treasury|wallet|income|payments|payment|investment|portfolio|ledger|budget|expenses/, system: /settings|maintenance|system|admin|operator|enterprise|security|kyc/
};
for (var k in map) if (map[k].test(key)) return k;
return 'sovereign';
}
function mount() {
var key = (location.pathname.split('/').pop() || 'index').replace(/\.html?$/i, '').toLowerCase();
var type = classify(key);
var c = FRAMEWORK[type];
if (!c) return;
document.documentElement.dataset.omegaPage = key;
document.documentElement.dataset.omegaCharacter = type;
document.documentElement.dataset.omegaMotionLevel = c.motion;
document.documentElement.style.setProperty('--omega-character-color', c.emblem === 'Ω' ? 'var(--gold)' : c.emblem === '◉' ? 'var(--cyan)' : c.emblem === '▶' ? 'var(--crim)' : 'var(--gold)');
var body = document.body;
if (body) {
body.dataset.omegaPage = key;
body.dataset.omegaCharacter = type;
}
if (!document.getElementById('omega-page-character-v2-css')) {
var st = document.createElement('style');
st.id = 'omega-page-character-v2-css';
st.textContent = '[data-omega-character]{transition:background .6s}\n'
+ 'body[data-omega-character= gaming] .card:hover,body[data-omega-character= media] .card:hover{transform:translateY(-4px) scale(1.015)}\n'
+ 'body[data-omega-character= knowledge]{--omega-motion-speed:2s}\n'
+ 'body[data-omega-character= command] .topbar{border-bottom-color:rgba(201,168,76,.25)}\n'
+ 'body[data-omega-character= intelligence] .topbar{border-bottom-color:rgba(0,229,255,.2)}\n'
+ '@media(prefers-reduced-motion:reduce){[data-omega-character]{--omega-motion-speed:0s}}';
(document.head || document.documentElement).appendChild(st);
}
document.dispatchEvent(new CustomEvent('omega:page-character-v2', {
detail: {
page: key, character: type, manifest: c, levels: MOTION_LEVELS
}
}));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
window.OmegaPageCharacterV2 = {
framework: FRAMEWORK, motionLevels: MOTION_LEVELS, classify: classify, get: function (key) {
var type = classify(key);
return {
type: type, manifest: FRAMEWORK[type]
};
}
};
})();