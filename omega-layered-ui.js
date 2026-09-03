
/* ============================================================================ SYD OMEGA 91717 — Layered UI System v1.0 Layer 1: Immediate comprehension (emblem, title, one-line, primary action) Layer 2: Exploration (cards, visual objects, media, data, interactive modules) Layer 3: Deep information (detailed text, docs, stats, legal, advanced controls) Non-destructive. Add data-layered-ui to any container. ============================================================================ */
 (function () {
'use strict';
if (window.__omegaLayeredUI) return;
window.__omegaLayeredUI = true;
function enhanceContainer(el) {
if (!el || el.__layered) return;
el.__layered = true;
el.setAttribute('data-layered', 'true');
var layer1 = el.querySelector('[data-layer-1]');
var layer2 = el.querySelector('[data-layer-2]');
var layer3 = el.querySelector('[data-layer-3]');
if (!layer1 && !layer2 && !layer3) return;
var controls = document.createElement('div');
controls.className = 'layer-controls';
controls.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;';
controls.innerHTML = '<button class=layer-btn data-show=1 style=font-family:var(--M);font-size:12px;letter-spacing:1.5px;padding:4px 10px;background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:2px;cursor:pointer>◈ COMPREHEND</button>' + '<button class=layer-btn data-show=2 style=font-family:var(--M);font-size:12px;letter-spacing:1.5px;padding:4px 10px;background:none;border:1px solid rgba(201,168,76,.1);color:var(--muted);border-radius:2px;cursor:pointer>◉ EXPLORE</button>' + '<button class=layer-btn data-show=3 style=font-family:var(--M);font-size:12px;letter-spacing:1.5px;padding:4px 10px;background:none;border:1px solid rgba(201,168,76,.1);color:var(--muted);border-radius:2px;cursor:pointer>◎ DEEP</button>';
el.insertBefore(controls, el.firstChild);
function showLayer(n) {
if (layer1) layer1.style.display = n >= 1 ? 'block' : 'none';
if (layer2) layer2.style.display = n >= 2 ? 'block' : 'none';
if (layer3) layer3.style.display = n >= 3 ? 'block' : 'none';
controls.querySelectorAll('.layer-btn').forEach(function (btn) {
var isActive = parseInt(btn.dataset.show) === n;
btn.style.borderColor = isActive ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.1)';
btn.style.color = isActive ? 'var(--gold)' : 'var(--muted)';
});
el.dataset.activeLayer = n;
}
controls.querySelectorAll('.layer-btn').forEach(function (btn) {
btn.addEventListener('click', function () {
showLayer(parseInt(btn.dataset.show));
});
});
showLayer(2);
}
document.addEventListener('DOMContentLoaded', function () {
document.querySelectorAll('[data-layered-ui]').forEach(enhanceContainer);
try {
new MutationObserver(function (muts) {
muts.forEach(function (m) {
m.addedNodes.forEach(function (n) {
if (n.nodeType === 1) {
if (n.matches('[data-layered-ui]')) enhanceContainer(n);
n.querySelectorAll && n.querySelectorAll('[data-layered-ui]').forEach(enhanceContainer);
}
});
});
}).observe(document.documentElement, {
childList: true, subtree: true
});
}
catch (e) {
}
});
window.OmegaLayeredUI = {
enhance: enhanceContainer
};
})();