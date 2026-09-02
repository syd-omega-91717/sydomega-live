
/* ============================================================================ SYD OMEGA 91717 — OMEGA AD NETWORK v1.0 Contextual advertising system. Not banner ads — intelligence-driven placements. Advertiser → Campaign → Audience → Context → Placement → Bid → Creative → Delivery → Measurement → Revenue. Transparent. Labeled. Frequency-capped. Creator revenue share. Drop onto any page: <script src=omega-ad-network.js></script> Or open ad-network.html for the admin dashboard. ============================================================================ */
 (function () {
'use strict';
if (window.__omegaAdNetwork) return;
window.__omegaAdNetwork = true;
const AD_SLOTS = {
hero: {
label: 'Hero Banner', max: 1, h: 120, context: ['command', 'dashboard', 'search']
}, inline: {
label: 'Inline Card', max: 3, h: 80, context: ['knowledge', 'media', 'universe', 'services']
}, sidebar: {
label: 'Sidebar Unit', max: 2, h: 200, context: ['all']
}, footer: {
label: 'Footer Strip', max: 1, h: 60, context: ['all']
}
};
const SAMPLE_ADS = [ {
id: 'ad_1', advertiser: 'Sovereign Academy', headline: 'Master the Canon', body: '12-week ascension program. Authority gates unlocked.', cta: 'ENROLL', color: '#C9A84C', target_realms: ['ascend', 'cosmos', 'command'], frequency_cap: 3
}, {
id: 'ad_2', advertiser: 'Omega Forge', headline: 'Build Your Realm', body: 'Creator tools for members. Turn ideas into platforms.', cta: 'START BUILDING', color: '#00E5FF', target_realms: ['creation', 'services', 'command'], frequency_cap: 3
}, {
id: 'ad_3', advertiser: 'Vault Reserve', headline: 'Secure Your Holdings', body: 'Institutional-grade custody for sovereign assets.', cta: 'OPEN VAULT', color: '#9B6BF0', target_realms: ['vault', 'finance', 'command'], frequency_cap: 2
}, {
id: 'ad_4', advertiser: 'Constellation Network', headline: 'Find Your Circle', body: 'Connect with aligned members across all 9 realms.', cta: 'CONNECT', color: '#D9B86A', target_realms: ['order', 'community', 'services'], frequency_cap: 3
}, {
id: 'ad_5', advertiser: 'Observatory Analytics', headline: 'See the Pattern', body: 'AI-powered intelligence for strategic decisions.', cta: 'ANALYZE', color: '#3fb27f', target_realms: ['intel', 'govern', 'command'], frequency_cap: 2
}
];
var IMPRESSIONS = {};
var REVENUE = {
total: 0, creator_share: 0, platform_share: 0
};
function getRealm() {
var key = (location.pathname.split('/').pop() || 'index').replace(new RegExp('^.*?(?:^|[^a-zA-Z0-9])',''), '').replace(new RegExp('[^a-zA-Z0-9].*$',''), '') || 'enter';
var map = {
command: /command|dashboard|home|beacon|notifications|search/, identity: /identity|profile|passport|character|account|membership|settings|kyc/, ascend: /ascension|matrix|academy|gaming|honors|trophies|exam|contributions|achievements|leaderboard|grades|levels|points/, cosmos: /cosmos|elements|horoscope|pantheons|agents|gates|houses|triads|kings|chronicle|dna|graph|map|mirror|oracle|realm|rune|tribe/, universe: /media|cinema|series|trailers|universe|hall|city|ledger|feed|publications/, vault: /vault|wallet|treasury|blockchain|payments|subscriptions|marketplace|portfolio|income|investment|budget|expenses|wealth|advertising|sovereign-covenant/, order: /family|bloodline|heritage|sovereigns|factions|approvals|interface-omni/, services: /services|consultancy|contracts|publishing|studio|marketing|news|social|events|travel|health|affirmations|body|breath|fasting|gratitude|habits|journal|meditate|mood|nutrition|oath|physiology|rituals|sleep|stoic|targets|water|weekly|workout/, intel: /intelligence|research|prediction|analytics|automation|compliance|graph-admin|graph-anomalies|graph-centrality|graph-evidence|graph-explorer|graph-timeline|graphify|atlas|cipher|codex|mindmap|nexus|pulse|sigma|signal/, govern: /governance|charter|terms|privacy|ecosystem|enterprise|knowledge|lab|maintenance|observatory|ops|roadmap|council/
};
for (var r in map) if (map[r].test(key)) return r;
return 'command';
}
function shouldShow(ad, realm) {
if (!ad.target_realms.includes('all') && !ad.target_realms.includes(realm)) return false;
var count = IMPRESSIONS[ad.id] || 0;
if (count >= ad.frequency_cap) return false;
return true;
}
function recordImpression(adId) {
IMPRESSIONS[adId] = (IMPRESSIONS[adId] || 0) + 1;
REVENUE.total += 0.05;
REVENUE.creator_share += 0.035;
REVENUE.platform_share += 0.015;
try {
var log = JSON.parse(localStorage.getItem('omega:ad:impressions') || '{}');
log[adId] = (log[adId] || 0) + 1;
localStorage.setItem('omega:ad:impressions', JSON.stringify(log));
}
catch (e) {
}
}
function renderAd(slot, container) {
if (!container) return;
var realm = getRealm();
var candidates = SAMPLE_ADS.filter(function(ad) {
return shouldShow(ad, realm);
});
if (candidates.length === 0) {
container.style.display = 'none';
return;
}
var ad = candidates[Math.floor(Math.random() * candidates.length)];
recordImpression(ad.id);
var html = '<div class=oad-unit style=border:1px solid ' + ad.color + '33;background:' + ad.color + '08;border-radius:3px;padding:12px 14px;position:relative>' + '<div style=display:flex;justify-content:space-between;align-items:flex-start;gap:12px>' + '<div style=min-width:0>' + '<div style=font-family:var(--M);font-size:6px;letter-spacing:1.5px;color:' + ad.color + ';margin-bottom:4px>AD · ' + ad.advertiser.toUpperCase() + '</div>' + '<div style=font-family:var(--M);font-size:11px;color:var(--ink);margin-bottom:4px>' + ad.headline + '</div>' + '<div style=font-family:var(--M);font-size:9px;color:var(--muted);margin-bottom:8px>' + ad.body + '</div>' + '<button style=font-family:var(--M);font-size:7px;letter-spacing:1.5px;padding:5px 12px;background:none;border:1px solid ' + ad.color + '55;color:' + ad.color + ';border-radius:2px;cursor:pointer>' + ad.cta + '</button>' + '</div>' + '</div>' + '<div style=position:absolute;top:4px;right:6px;font-family:var(--M);font-size:6px;color:var(--muted);opacity:.5>Ω AD</div>' + '</div>';
container.innerHTML = html;
container.style.display = 'block';
}
function renderAdmin(el) {
if (!el) return;
var log = {};
try {
log = JSON.parse(localStorage.getItem('omega:ad:impressions') || '{}');
}
catch (e) {
}
var totalImpressions = Object.values(log).reduce(function(a, b) {
return a + b;
}, 0);
var adRows = SAMPLE_ADS.map(function(ad) {
var count = log[ad.id] || 0;
return '<div style=display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(201,168,76,.06)><span style=font-family:var(--M);font-size:9px;color:var(--ink)>' + ad.advertiser + '</span><span style=font-family:var(--M);font-size:9px;color:var(--gold)>' + count + ' impressions</span></div>';
}).join('');
el.innerHTML = '<div style=display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px>' + '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>TOTAL REVENUE</div><div style=font-family:var(--D);font-size:clamp(22px,3vw,32px);color:var(--gold)>$' + REVENUE.total.toFixed(2) + '</div></div>' + '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>CREATOR SHARE</div><div style=font-family:var(--D);font-size:clamp(22px,3vw,32px);color:var(--green)>$' + REVENUE.creator_share.toFixed(2) + '</div></div>' + '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>PLATFORM SHARE</div><div style=font-family:var(--D);font-size:clamp(22px,3vw,32px);color:var(--cyan)>$' + REVENUE.platform_share.toFixed(2) + '</div></div>' + '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>IMPRESSIONS</div><div style=font-family:var(--D);font-size:clamp(22px,3vw,32px);color:var(--purple)>' + totalImpressions + '</div></div>' + '</div>' + '<div class=glass style=padding:16px;margin-top:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>CAMPAIGNS</div>' + adRows + '</div>';
}
window.OmegaAdNetwork = {
slots: AD_SLOTS, ads: SAMPLE_ADS, revenue: function() {
return REVENUE;
}, impressions: function() {
return IMPRESSIONS;
}, render: renderAd, renderAdmin: renderAdmin, getRealm: getRealm, reset: function() {
IMPRESSIONS = {};
REVENUE = {
total: 0, creator_share: 0, platform_share: 0
};
try {
localStorage.removeItem('omega:ad:impressions');
}
catch (e) {
}
}
};
document.addEventListener('DOMContentLoaded', function() {
document.querySelectorAll('[data-omega-ad]').forEach(function(el) {
renderAd(el.dataset.omegaAd, el);
});
var admin = document.querySelector('[data-omega-ad-admin]');
if (admin) renderAdmin(admin);
});
document.dispatchEvent(new CustomEvent('omega:ad-network-ready', {
detail: {
version: '1.0', campaigns: SAMPLE_ADS.length
}
}));
})();