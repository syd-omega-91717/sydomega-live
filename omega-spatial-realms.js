/* Ω SYD OMEGA 91717 — SPATIAL REALMS
 * Additive cinematic 3-D realm layer for Gaming and Cinema.
 * No WebGL context is created here. omega-sculpture.js remains the sole
 * Three.js/WebGL owner. This runtime provides navigable depth, realm identity,
 * reduced-motion support, and functional links into the existing platform.
 */
(function () {
  'use strict';
  if (window.__omegaSpatialRealms) return;
  window.__omegaSpatialRealms = true;

  var reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var css = `
    .omega-spatial-realm{position:relative;isolation:isolate;min-height:420px;margin:18px clamp(14px,3vw,36px);overflow:hidden;border:1px solid var(--line,rgba(201,168,76,.2));background:radial-gradient(circle at 50% 35%,rgba(0,229,255,.06),transparent 42%),linear-gradient(135deg,rgba(201,168,76,.045),rgba(2,2,6,.92));border-radius:4px;perspective:1100px;contain:layout paint style}
    .omega-spatial-realm[data-realm="gaming"]{--realm:#9b6bf0;--realm2:#00e5ff}
    .omega-spatial-realm[data-realm="cinema"]{--realm:#e8c97a;--realm2:#c4453c}
    .omega-spatial-stage{position:absolute;inset:0;display:grid;place-items:center;transform-style:preserve-3d;overflow:hidden}
    .omega-spatial-grid{position:absolute;width:140%;height:140%;left:-20%;top:24%;transform:rotateX(67deg) translateZ(-90px);transform-origin:center center;background:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,transparent,black 30%,black 80%,transparent)}
    .omega-spatial-orbit{position:absolute;width:250px;height:250px;border:1px solid color-mix(in srgb,var(--realm) 55%,transparent);border-radius:50%;transform:rotateX(68deg) rotateZ(-12deg) translateZ(80px);box-shadow:0 0 50px color-mix(in srgb,var(--realm) 12%,transparent)}
    .omega-spatial-orbit.o2{width:330px;height:180px;transform:rotateX(68deg) rotateY(18deg) rotateZ(26deg) translateZ(35px);border-color:color-mix(in srgb,var(--realm2) 45%,transparent)}
    .omega-spatial-core{width:108px;height:108px;border:2px solid var(--realm);border-radius:28% 50% 28% 50%;transform:rotateX(18deg) rotateY(-28deg) rotateZ(45deg) translateZ(135px);background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.4),color-mix(in srgb,var(--realm) 25%,#020206) 42%,#020206 78%);box-shadow:0 0 36px color-mix(in srgb,var(--realm) 35%,transparent),inset 0 0 28px color-mix(in srgb,var(--realm2) 22%,transparent)}
    .omega-spatial-label{position:absolute;left:18px;top:16px;z-index:5;font:12px/1.5 var(--M,Courier\ Prime,monospace);letter-spacing:2px;color:var(--realm)}
    .omega-spatial-title{position:absolute;left:18px;bottom:18px;z-index:5;max-width:min(560px,calc(100% - 36px));font:clamp(18px,3vw,28px)/1.1 var(--D,Cinzel,serif);letter-spacing:.5px}
    .omega-spatial-copy{margin-top:6px;font:12px/1.6 var(--M,Courier\ Prime,monospace);color:var(--muted,#8a8676);letter-spacing:1px}
    .omega-spatial-actions{position:absolute;right:18px;bottom:18px;z-index:6;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .omega-spatial-action{appearance:none;border:1px solid color-mix(in srgb,var(--realm) 45%,transparent);background:rgba(2,2,6,.72);color:var(--realm);padding:9px 12px;font:12px var(--M,Courier\ Prime,monospace);letter-spacing:1.5px;text-decoration:none;cursor:pointer;backdrop-filter:blur(10px)}
    .omega-spatial-action:hover,.omega-spatial-action:focus-visible{border-color:var(--realm);box-shadow:0 0 18px color-mix(in srgb,var(--realm) 18%,transparent);outline:none}
    .omega-spatial-nodes{position:absolute;inset:0;z-index:3;pointer-events:none;transform-style:preserve-3d}
    .omega-spatial-node{position:absolute;min-width:84px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--realm) 38%,transparent);background:rgba(2,2,6,.72);font:10px var(--M,Courier\ Prime,monospace);letter-spacing:1px;color:var(--ink,#e8e3d2);text-align:center;transform-style:preserve-3d;backdrop-filter:blur(8px)}
    .omega-spatial-node.n1{left:18%;top:28%;transform:translateZ(120px) rotateY(-12deg)}
    .omega-spatial-node.n2{right:18%;top:24%;transform:translateZ(95px) rotateY(14deg)}
    .omega-spatial-node.n3{left:24%;bottom:28%;transform:translateZ(75px) rotateY(-10deg)}
    .omega-spatial-node.n4{right:23%;bottom:27%;transform:translateZ(110px) rotateY(12deg)}
    @keyframes omegaSpatialFloat{0%,100%{transform:translateZ(110px) rotateX(18deg) rotateY(-28deg) rotateZ(45deg)}50%{transform:translateZ(145px) rotateX(22deg) rotateY(18deg) rotateZ(58deg)}}
    @keyframes omegaSpatialOrbit{from{transform:rotateX(68deg) rotateZ(-12deg) translateZ(80px) rotateZ(0deg)}to{transform:rotateX(68deg) rotateZ(-12deg) translateZ(80px) rotateZ(360deg)}}
    .omega-spatial-core{animation:omegaSpatialFloat 7s ease-in-out infinite}
    .omega-spatial-orbit{animation:omegaSpatialOrbit 24s linear infinite}
    .omega-spatial-orbit.o2{animation-duration:31s;animation-direction:reverse}
    @media(max-width:700px){.omega-spatial-realm{min-height:360px;margin:14px}.omega-spatial-node{min-width:68px;padding:7px 6px;font-size:9px}.omega-spatial-node.n1{left:8%}.omega-spatial-node.n2{right:8%}.omega-spatial-node.n3{left:10%}.omega-spatial-node.n4{right:10%}.omega-spatial-actions{left:18px;right:18px;bottom:16px}.omega-spatial-title{bottom:62px}.omega-spatial-grid{background-size:32px 32px}}
    @media(prefers-reduced-motion:reduce){.omega-spatial-core,.omega-spatial-orbit,.omega-spatial-orbit.o2{animation:none}.omega-spatial-grid{transform:rotateX(67deg) translateZ(-90px)}}
  `;
  var style = document.createElement('style');
  style.setAttribute('data-omega-spatial-realms-css','1');
  style.textContent = css;
  document.head.appendChild(style);

  function make(realm) {
    var root = document.querySelector('[data-omega-spatial-realm="' + realm + '"]');
    if (!root || root.getAttribute('data-mounted') === '1') return;
    root.setAttribute('data-mounted','1');
    root.setAttribute('data-realm',realm);

    var title = realm === 'gaming' ? 'GAMING REALM' : 'CINEMA REALM';
    var copy = realm === 'gaming'
      ? 'PLAY · COMPETE · MASTER · RETURN TO THE FUNCTIONAL GAME SURFACES'
      : 'STORY · SCENE · CHARACTER · RETURN TO THE FUNCTIONAL MEDIA SURFACES';
    var nodes = realm === 'gaming'
      ? ['ARENA','CHARACTERS','MASTERY','REWARDS']
      : ['FILMS','SERIES','SCENES','CHARACTERS'];
    var links = realm === 'gaming'
      ? [['OPEN GAMES','/gaming.html'],['CHARACTERS','/characters.html']]
      : [['OPEN MOVIES','/movies.html'],['SERIES','/series.html']];

    root.innerHTML = '<div class="omega-spatial-stage">'
      + '<div class="omega-spatial-grid" aria-hidden="true"></div>'
      + '<div class="omega-spatial-orbit" aria-hidden="true"></div><div class="omega-spatial-orbit o2" aria-hidden="true"></div>'
      + '<div class="omega-spatial-core" aria-hidden="true"></div>'
      + '<div class="omega-spatial-nodes">'
      + nodes.map(function(n,i){return '<div class="omega-spatial-node n'+(i+1)+'" aria-hidden="true">Ω · '+n+'</div>';}).join('')
      + '</div></div>'
      + '<div class="omega-spatial-label">Ω / SPATIAL SYSTEM / '+realm.toUpperCase()+' / FUNCTIONAL REALM</div>'
      + '<div class="omega-spatial-title">'+title+'<div class="omega-spatial-copy">'+copy+'</div></div>'
      + '<nav class="omega-spatial-actions" aria-label="'+title+' navigation">'
      + links.map(function(l){return '<a class="omega-spatial-action" href="'+l[1]+'">'+l[0]+'</a>';}).join('')
      + '</nav>';

    if (reduced) root.setAttribute('data-motion','reduced');
  }

  function mount() {
    make('gaming');
    make('cinema');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once:true });
  else mount();
})();
