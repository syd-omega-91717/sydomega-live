/* ==========================================================================
   Ω SYD OMEGA 91717 — THE ONE-SHELL ROUTER (omega-one-shell.js)

   One persistent surface in which the platform's pages are VIEWS, not separate documents. Stage 2 of
   docs/OMEGA_ONE_SHELL_PLAN.md, first version. Mount it with one element:

       <section data-omega-one-shell></section>

   THREE VIEWS, ONE HASH ROUTE (no framework, no history API; the browser's back button just works)
       #/            the MAP: the 15 workspaces around the Omega, each a link to its workspace
       #/hub/<hub>   a WORKSPACE: its pages; a page the registry allows opens in place, any other is an ordinary link
       #/p/<page>    a PAGE shown in place, through OmegaPanels.open(url, host) (omega-panels.js)
   A fragment that is not one of these (an anchor on the host page) is left alone.

   WHAT IT READS, AND FROM WHOM (it keeps no copy of anything)
       hub -> pages       window.OmegaWorkspaces        omega-single-page-workspaces.js, the one owner of that table
       may this be hosted config/omega-panel-eligibility.json   the measured registry (scripts/panel-eligibility.py)
       how to host it     window.OmegaPanels.open       omega-panels.js

   WHAT IT WILL NOT DO
     - Host a page unless the registry says `hostable`. A missing registry, an unknown page, `excluded-pending-review`
       (payments, KYC, privacy, wallet...), `standalone-by-policy` (account, terms...) or `navigates-away` all become a plain
       link to the page's own URL. The default on any doubt is "do not host".
     - Draw a connection it cannot source. The lines on the map are hub MEMBERSHIP (each workspace to the Omega), which the
       workspace table states. Page-to-page relations are not drawn: measured, only 113 of 242 pages link to another page.
       The numbers on the map are counts of that same table (CLAUDE.md 8.1 class 9: nothing invented).
     - Put data into markup: every node is built with createElement and textContent, and a route key is validated against
       /^[a-z0-9-]+$/ before it is used for anything.

   LIMITS (measured, docs/fixes/2026-11-21-panels-open-extract.md)
     - A hosted page whose own script assigns location.href / location.replace leaves the shell. Links inside a hosted
       page that point at another hostable page are routed here (click intercepted); programmatic navigation cannot be.
     - Pages run in the shell's document (omega-panels.js isolates and tears them down; it cannot make them identical to a
       standalone load). `water` and `mood` leave one interval running after close (pre-existing).
   ========================================================================== */
(function () {
  'use strict';
  var mount = document.querySelector('[data-omega-one-shell]');
  if (!mount || mount.__omegaOneShell) return;
  mount.__omegaOneShell = true;

  var KEY = /^[a-z0-9][a-z0-9-]{0,60}$/;
  var REGISTRY_URL = '/config/omega-panel-eligibility.json';
  var STRONG = 3;   // an edge of at least this weight is drawn at rest; weaker ones appear when their workspace is pointed at
  var RELATIONS_URL = '/config/omega-relations.json';   // the evidence for every line the map draws (scripts/relations-build.py)
  var WAIT_MS = 8000;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var baseTitle = document.title;
  var selfKey = String(location.pathname).replace(/^\//, '').replace(/\.html$/, '');   // this page: never hosted inside itself

  var ws = null;        // window.OmegaWorkspaces
  var rel = null;       // relations file ({edges:[{a,b,weight,shared_pages,shared_relations}]}), or null: then only the spokes are drawn
  var reg = null;       // registry pages, or null when it could not be read (then nothing is hosted)
  var hubs = [];        // [{key, path, pages:[keys]}]
  var token = 0, current = null, firstRoute = true;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function hubKeyOf(path) { return String(path).replace(/^\//, '').replace(/\.html$/, ''); }
  function label(key) { return ws && ws.label ? ws.label(key) : key; }
  function isHub(key) { return hubs.some(function (h) { return h.key === key; }); }
  function hubOf(key) {
    for (var i = 0; i < hubs.length; i++) if (hubs[i].pages.indexOf(key) >= 0) return hubs[i];
    return null;
  }
  function entry(key) { return (reg && reg[key]) || null; }
  function hostable(key) { var e = entry(key); return !!(e && e.status === 'hostable' && KEY.test(key) && !isHub(key) && key !== selfKey); }

  /* ---- styles ------------------------------------------------------------ */
  function injectCSS() {
    if (document.getElementById('ons-css')) return;
    var s = el('style');
    s.id = 'ons-css';
    s.textContent = [
      '.ons{margin:34px 0 8px;color:#E9E3D2}',
      '.ons *{box-sizing:border-box}',
      '.ons [hidden]{display:none!important}',
      '.ons a{color:inherit;text-decoration:none}',
      '.ons-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 2px 14px;min-height:44px}',
      '.ons-crumbs ol{display:flex;gap:8px;flex-wrap:wrap;list-style:none;margin:0;padding:0;font:12px/1.5 var(--M,"Courier Prime",monospace);letter-spacing:.14em;text-transform:uppercase;color:#A9A7A0}',
      '.ons-crumbs li+li:before{content:"\\203A";margin-right:8px;color:rgba(201,168,76,.6)}',
      '.ons-crumbs a{color:#00E5FF;display:inline-flex;align-items:center;min-height:44px}',
      '.ons-crumbs [aria-current]{color:#F0D98F}',
      '.ons-title{font:clamp(20px,2.8vw,28px)/1.2 var(--D,"Cinzel Decorative",serif);color:#F0D98F;margin:0 2px 6px;outline:none}',
      '.ons-sub{font:14px/1.6 var(--R,Rajdhani,sans-serif);color:#BDBAB1;margin:0 2px 16px;max-width:70ch}',
      '.ons-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
      '.ons-full{font:12px/1 var(--M,"Courier Prime",monospace);letter-spacing:.1em;color:#00E5FF;display:inline-flex;align-items:center;min-height:44px}',
      /* map: blueprint = side panel | map | side panel */
      '.ons-blueprint{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}',
      '@media (min-width:1100px){.ons-blueprint{grid-template-columns:minmax(210px,1fr) minmax(0,640px) minmax(210px,1fr);align-items:center}}',
      '.ons-map{position:relative;width:min(100%,640px);aspect-ratio:1;margin:0 auto}',
      '.ons-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
      '.ons-spoke{stroke:rgba(201,168,76,.16);stroke-width:.18}',
      '.ons-edge{opacity:.62;transition:opacity .25s}',
      '.ons-edge.faint{opacity:0}',
      '.ons-map[data-focus] .ons-edge{opacity:.07}',
      '.ons-map[data-focus] .ons-edge.hot{opacity:1}',
      '.ons-eglow{fill:none;stroke:rgba(240,213,138,.5);stroke-linecap:round;filter:blur(.55px)}',
      '.ons-eline{fill:none;stroke:#F6E3A6;stroke-linecap:round;stroke-dasharray:1.1 2.6;animation:ons-flow 5s linear infinite}',
      '.ons-edge.cy .ons-eline{stroke:#7FF0FF}.ons-edge.cy .ons-eglow{stroke:rgba(0,229,255,.45)}',
      '@keyframes ons-flow{to{stroke-dashoffset:-7.4}}',
      '.ons-core{position:absolute;left:50%;top:50%;width:21%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;display:grid;place-items:center;z-index:2;',
      'font:clamp(34px,8vw,72px)/1 var(--D,"Cinzel Decorative",serif);color:#FFF3C4;text-shadow:0 0 18px rgba(255,236,170,.95),0 0 46px rgba(240,213,138,.75);',
      'background:radial-gradient(circle at 38% 30%,rgba(255,250,225,.55),rgba(240,213,138,.3) 30%,rgba(4,7,13,.94) 74%);border:1px solid rgba(255,236,170,.9);',
      'box-shadow:0 0 0 7px rgba(240,213,138,.07),0 0 38px rgba(255,220,120,.55),0 0 120px rgba(240,213,138,.32),0 0 220px rgba(0,229,255,.12),inset 0 0 26px rgba(255,236,170,.3)}',
      '.ons-glyph{transition:opacity .4s}',
      '.ons-signet{position:absolute;left:50%;top:50%;width:215%;aspect-ratio:1;translate:-50% -50%;min-height:0 !important;pointer-events:none;z-index:1}',
      '.ons-signet .omega-sculpture-canvas{position:absolute;inset:0;width:100% !important;height:100% !important}',
      '.ons-3d .ons-glyph{opacity:0}',
      '.ons-3d{background:radial-gradient(circle,rgba(4,7,13,.55),rgba(4,7,13,.2) 70%,transparent);border-color:rgba(255,236,170,.35)}',
      '.ons-rays,.ons-halo{position:absolute;left:50%;top:50%;border-radius:50%;pointer-events:none;translate:-50% -50%}',
      '.ons-rays{width:300%;aspect-ratio:1;z-index:-1;background:repeating-conic-gradient(from 0deg,rgba(255,236,170,.55) 0 .7deg,transparent .7deg 7.5deg);',
      '-webkit-mask-image:radial-gradient(circle,#000 18%,transparent 62%);mask-image:radial-gradient(circle,#000 18%,transparent 62%);animation:ons-turn 90s linear infinite}',
      '.ons-halo{width:230%;aspect-ratio:1;z-index:-2;background:radial-gradient(circle,rgba(255,226,140,.38),rgba(240,213,138,.1) 38%,transparent 66%);animation:ons-breathe 6s ease-in-out infinite}',
      '@keyframes ons-turn{to{rotate:360deg}}',
      '@keyframes ons-breathe{0%,100%{opacity:.75}50%{opacity:1}}',
      '.ons-node{position:absolute;translate:-50% -50%;min-width:88px;min-height:56px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:3;',
      'border:1px solid rgba(201,168,76,.4);border-radius:12px;background:linear-gradient(145deg,rgba(30,27,20,.94),rgba(5,8,14,.96));box-shadow:0 0 22px rgba(201,168,76,.1);',
      'transition:border-color .2s,box-shadow .2s}',
      '.ons-node:hover,.ons-node:focus-visible,.ons-node.on{border-color:rgba(255,236,170,.95);box-shadow:0 0 34px rgba(240,213,138,.5);outline:none}',
      '.ons-nname{font:13px/1.25 var(--M,"Courier Prime",monospace);letter-spacing:.08em;color:#F0D98F;text-transform:uppercase}',
      '.ons-ncount{font:11px/1.3 var(--M,"Courier Prime",monospace);color:#A9A7A0;margin-top:3px}',
      '@media (max-width:1099px){.ons-map{order:-1}.ons-read{min-height:calc(13px * 1.55 * 4 + 16px)}}',
      '.ons-col{display:grid;gap:16px;min-width:0}',
      '.ons-cube{position:relative;width:100%;aspect-ratio:1;min-height:0 !important;pointer-events:none}',
      '.ons-cube .omega-sculpture-canvas{position:absolute;inset:0;width:100% !important;height:100% !important}',
      '.ons-facts{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:4px;font:13px/1.45 var(--R,Rajdhani,sans-serif);color:#D3D0C7}',
      '.ons-facts b{font-weight:400;color:#F0D98F}',
      '.ons-fnote{margin:8px 0 0;font:12px/1.45 var(--R,Rajdhani,sans-serif);color:#A9A7A0}',
      '.ons-cubelink{display:inline-flex;align-items:center;min-height:44px;margin-top:4px;font:12px/1 var(--M,"Courier Prime",monospace);letter-spacing:.1em;color:#00E5FF}',
      '.ons-read{margin:0 2px 10px;padding:8px 14px;min-height:calc(13px * 1.55 * 3 + 16px);border:1px solid rgba(201,168,76,.22);border-radius:10px;background:rgba(5,8,14,.7);font:13px/1.55 var(--R,Rajdhani,sans-serif);color:#D3D0C7}',
      '.ons-read b{color:#F0D98F;font-weight:600}',
      /* panels: every figure is computed from loaded data; every panel names its source */
      '.ons-panel{border:1px solid rgba(201,168,76,.3);border-radius:10px;background:linear-gradient(160deg,rgba(24,21,15,.9),rgba(5,8,14,.94));padding:12px 14px;min-width:0}',
      '.ons-ph{display:flex;justify-content:space-between;gap:8px;margin:0 0 10px;font:11px/1.3 var(--M,"Courier Prime",monospace);letter-spacing:.14em;text-transform:uppercase;color:#C9A84C}',
      '.ons-src{font-size:12px;letter-spacing:.06em;color:#9A988F;text-transform:none;text-align:right}',
      '.ons-rows{list-style:none;margin:0;padding:0;display:grid;gap:0}',
      '.ons-panel a.ons-row{display:grid;grid-template-columns:minmax(64px,88px) 1fr 28px;gap:8px;align-items:center;min-height:44px;padding:0 2px;border-top:1px solid rgba(201,168,76,.1);font:11px/1.2 var(--M,"Courier Prime",monospace);letter-spacing:.06em;color:#CFCBBE;text-transform:uppercase}',
      '.ons-rows li:first-child a.ons-row{border-top:0}',
      '.ons-panel a.ons-row:hover,.ons-panel a.ons-row:focus-visible{color:#F0D98F;outline:none}',
      '.ons-track{height:6px;border-radius:3px;background:rgba(201,168,76,.12);overflow:hidden}',
      '.ons-track i{display:block;height:100%;background:linear-gradient(90deg,#8A6B24,#F0D98F);border-radius:3px}',
      '.ons-row b{font-weight:400;color:#F0D98F;text-align:right}',
      '.ons-rel{display:grid;gap:2px;padding:6px 0;border-top:1px solid rgba(201,168,76,.14);font:13px/1.35 var(--R,Rajdhani,sans-serif);color:#D3D0C7}',
      '.ons-rel:first-child{border-top:0;padding-top:0}',
      '.ons-rel strong{font:11px/1.3 var(--M,"Courier Prime",monospace);letter-spacing:.1em;color:#F0D98F;text-transform:uppercase;font-weight:400}',
      '.ons-stats{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}',
      '.ons-stat{padding:10px 14px;border:1px solid rgba(201,168,76,.28);border-radius:10px;background:rgba(5,8,14,.72)}',
      '.ons-stat b{display:block;font:clamp(22px,3vw,30px)/1.1 var(--D,"Cinzel Decorative",serif);color:#F0D98F;font-weight:400}',
      '.ons-stat span{display:block;margin-top:2px;font:10px/1.4 var(--M,"Courier Prime",monospace);letter-spacing:.1em;text-transform:uppercase;color:#B8B6AE}',
      '.ons-stat em{display:block;font:9px/1.4 var(--M,"Courier Prime",monospace);letter-spacing:.04em;color:#8F8D86;font-style:normal;margin-top:2px}',
      /* hub */
      '.ons-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}',
      '.ons-page{display:flex;flex-direction:column;justify-content:center;min-height:64px;padding:11px 13px;border:1px solid rgba(201,168,76,.24);border-radius:11px;',
      'background:linear-gradient(145deg,rgba(22,22,25,.96),rgba(7,10,17,.96));transition:border-color .2s,transform .2s}',
      '.ons-page:hover,.ons-page:focus-visible{border-color:rgba(240,213,138,.7);outline:none;transform:translateY(-2px)}',
      '.ons-pname{font:15px/1.3 var(--R,Rajdhani,sans-serif);color:#F0DFAF}',
      '.ons-ptag{font:10px/1.4 var(--M,"Courier Prime",monospace);letter-spacing:.12em;text-transform:uppercase;margin-top:4px;color:#A9A7A0}',
      '.ons-ptag.in{color:#7DD87D}',
      /* stage and notices */
      '.ons-host{min-width:0}',
      '.ons-note{padding:18px;border:1px solid rgba(201,168,76,.24);border-radius:11px;font:15px/1.6 var(--R,Rajdhani,sans-serif);color:#D3D0C7;max-width:70ch}',
      '.ons-note a{color:#00E5FF;display:inline-flex;align-items:center;min-height:44px}',
      '.ons a:focus-visible{outline:2px solid #F0D98F;outline-offset:3px}',
      /* narrow: the ring becomes a grid, the lines go (a ring of 15 buttons does not fit a phone) */
      '@media (max-width:700px){.ons-map{aspect-ratio:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
      '.ons-read{min-height:44px}.ons-signet,.ons-cube{display:none !important}.ons-3d .ons-glyph{opacity:1}   /* !important: the module writes an inline display:block */.ons-lines{display:none}.ons-core{position:static;translate:none;grid-column:1/-1;width:96px;margin:0 auto 6px}.ons-rays,.ons-halo{display:none}',
      '.ons-node{position:static;translate:none;min-width:0;min-height:64px}}',
      '@media (prefers-reduced-motion:reduce){.ons-eline,.ons-rays,.ons-halo{animation:none}.ons-edge{transition:none}.ons-node,.ons-page{transition:none}.ons-page:hover{transform:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---- skeleton ---------------------------------------------------------- */
  var root = el('div', 'ons');
  var bar = el('div', 'ons-bar');
  var crumbsNav = el('nav', 'ons-crumbs');
  crumbsNav.setAttribute('aria-label', 'Shell location');
  var fullLink = el('a', 'ons-full');
  fullLink.hidden = true;
  bar.appendChild(crumbsNav);
  bar.appendChild(fullLink);
  var title = el('h2', 'ons-title');
  title.tabIndex = -1;
  var sub = el('p', 'ons-sub');
  var live = el('div', 'ons-live');
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  var viewMap = el('div'), viewHub = el('div'), viewPage = el('div', 'ons-host');
  /* stageHost is OmegaPanels' host: the engine keeps a reference to the stage it puts inside, so this element is only ever
     handed to OmegaPanels.open/close and is never cleared here. Notices go in noteHost, beside it. */
  var stageHost = el('div'), noteHost = el('div');
  viewPage.appendChild(stageHost);
  viewPage.appendChild(noteHost);
  root.appendChild(bar);
  root.appendChild(title);
  root.appendChild(sub);
  root.appendChild(viewMap);
  root.appendChild(viewHub);
  root.appendChild(viewPage);
  root.appendChild(live);

  function showOnly(which) {
    [viewMap, viewHub, viewPage].forEach(function (v) { v.hidden = v !== which; });
  }
  function setCrumbs(items) {
    crumbsNav.textContent = '';
    var ol = el('ol');
    items.forEach(function (it, i) {
      var li = el('li');
      if (it.href && i < items.length - 1) {
        var a = el('a', '', it.text);
        a.href = it.href;
        li.appendChild(a);
      } else {
        var sp = el('span', '', it.text);
        sp.setAttribute('aria-current', 'page');
        li.appendChild(sp);
      }
      ol.appendChild(li);
    });
    crumbsNav.appendChild(ol);
  }
  function setFull(href, text) {
    if (!href) { fullLink.hidden = true; return; }
    fullLink.textContent = text;
    fullLink.href = href;
    fullLink.hidden = false;
  }
  function setHead(t, s) {
    title.textContent = t;
    sub.textContent = s || '';
    sub.hidden = !s;
    document.title = t === 'Platform map' ? baseTitle : 'Ω ' + t + ' — ' + baseTitle;
  }
  function arrive(message) {
    live.textContent = '';
    live.textContent = message;
    if (firstRoute) {                                      // never steal focus on the page's first paint
      firstRoute = false;
      if (/^#\/(hub|p)\//.test(location.hash)) root.scrollIntoView({ block: 'start', behavior: 'auto' });   // but a deep link should land on the shell
      return;
    }
    try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
    root.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---- views ------------------------------------------------------------- */
  function relsOf(key) {
    return ((rel && rel.edges) || []).filter(function (e) { return e.a === key || e.b === key; })
      .sort(function (x, y) { return y.weight - x.weight; });
  }
  function relText(e) {
    var bits = [];
    if (e.shared_pages.length) bits.push(e.shared_pages.length + (e.shared_pages.length === 1 ? ' shared page' : ' shared pages'));
    if (e.shared_relations.length) bits.push(e.shared_relations.length + ' shared data ' + (e.shared_relations.length === 1 ? 'set' : 'sets'));
    return bits.join(' · ');
  }
  function panel(title, source) {
    var p = el('section', 'ons-panel');
    var h = el('h3', 'ons-ph', title);
    if (source) h.appendChild(el('span', 'ons-src', source));
    p.appendChild(h);
    return p;
  }
  function stat(value, name, source) {
    var d = el('div', 'ons-stat');
    d.appendChild(el('b', null, String(value)));
    d.appendChild(el('span', null, name));
    d.appendChild(el('em', null, source));
    return d;
  }

  /* The CSS glyph steps aside only when the module has put its canvas in the mount (3-D, or its own flat fallback mark when WebGL is
     absent). If the module never arrives (blocked, offline), nothing changes: the CSS mark stays. */
  function watchSignet(sig, core) {
    var tries = 0, iv = setInterval(function () {
      if (sig.querySelector('canvas.omega-sculpture-canvas')) { core.classList.add('ons-3d'); clearInterval(iv); }
      else if (++tries > 40) clearInterval(iv);                // 10 s
    }, 250);
  }
  /* If the module never puts a canvas in the cube mount, hide the empty square (the facts and the link stay). */
  function watchCube(cube) {
    var tries = 0, iv = setInterval(function () {
      if (cube.querySelector('canvas.omega-sculpture-canvas')) clearInterval(iv);
      else if (++tries > 40) { clearInterval(iv); cube.hidden = true; }
    }, 250);
  }
  function ensureSculpture() {
    /* bg.js loads the module only where a mount existed at load, under this exact guard attribute: use the same one (class 5: the guard
       attribute is the module's identity), so it can never load twice. */
    if (window.OmegaSculpture || document.querySelector('script[data-omega-sculpture-js]')) return;
    var s = document.createElement('script');
    s.src = '/omega-sculpture.js';
    s.setAttribute('data-omega-sculpture-js', '1');
    s.defer = true;
    document.head.appendChild(s);
  }

  /* The matrix panel's figures come from the canon (window.OmegaCanon.structure, loaded from omega-canon.json by bg.js), never typed here.
     If the canon is missing or contradicts itself, no figure is shown: a number the data cannot back is not drawn (CLAUDE.md 8.1 class 9). */
  function fillFacts(list, note) {
    var t0 = Date.now(), iv = setInterval(function () {
      var st = window.OmegaCanon && window.OmegaCanon.structure;
      if (st) { clearInterval(iv); write(st); }
      else if (Date.now() - t0 > 10000) { clearInterval(iv); none(); }
    }, 200);
    function fact(label, value) {
      var li = el('li');
      li.appendChild(document.createTextNode(label + ' '));
      li.appendChild(el('b', null, value));
      list.appendChild(li);
    }
    function none() { list.textContent = ''; list.appendChild(el('li', null, 'The canon could not be read, so no figures are shown.')); }
    function write(st) {
      var depth = Number(st.axis_depth), axes = Number(st.axes), per = Number(st.nodes_per_track_per_phase);
      var tracks = Number(st.tracks), phases = Number(st.phases), total = Number(st.total_nodes);
      var ok = depth > 0 && axes > 0 && Math.pow(depth, axes) === per && tracks * phases * per === total;
      list.textContent = '';
      if (!ok) { none(); return; }
      var dims = []; for (var i = 0; i < axes; i++) dims.push(depth);
      fact('Each phase', dims.join(' \u00D7 ') + ' = ' + per.toLocaleString('en-US') + ' nodes');
      fact('Tracks \u00D7 phases', tracks + ' \u00D7 ' + phases + ' = ' + total.toLocaleString('en-US') + ' nodes');
      if (Array.isArray(st.axes_names) && st.axes_names.length) fact('Axes', st.axes_names.join(' \u00B7 '));
    }
    note.textContent = 'The lit nodes are decorative. This shows the structure, not your progress.';
  }

  function buildMap() {
    viewMap.textContent = '';
    var NS = 'http://www.w3.org/2000/svg';
    function svgEl(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      return n;
    }
    var board = el('div', 'ons-blueprint');
    var map = el('div', 'ons-map');
    var svg = svgEl('svg', { 'class': 'ons-lines', viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    map.appendChild(svg);
    var core = el('div', 'ons-core');
    core.appendChild(el('span', 'ons-glyph', 'Ω'));          // the CSS mark: shown until (and unless) the 3-D signet is live
    /* The 3-D signet is omega-sculpture.js's, not ours: one attribute mounts it, and that module owns WebGL (audit-webgl-ownership). */
    var sig = el('div', 'ons-signet');
    sig.style.position = 'absolute';                          // the module writes an inline position:relative when none is set, which would beat the class and drop the mount out of the centre
    sig.setAttribute('data-omega-sculpture', 'signet');
    sig.setAttribute('data-sculpt-glow', 'radiant');
    sig.setAttribute('data-sculpt-state', 'idle');
    sig.setAttribute('data-sculpt-height', '1px');            // sized by CSS above; the module wants a length, not a percentage of a box it is sizing
    sig.setAttribute('data-sculpt-label', 'The Omega signet, rendered in three dimensions');
    core.appendChild(sig);
    watchSignet(sig, core);
    core.appendChild(el('span', 'ons-halo'));
    core.appendChild(el('span', 'ons-rays'));
    map.appendChild(core);

    var n = hubs.length, pos = {};
    hubs.forEach(function (h, i) {
      var ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
      pos[h.key] = { x: 50 + 39 * Math.cos(ang), y: 50 + 39 * Math.sin(ang) };
    });

    /* spokes: every workspace belongs to the platform, so each is tied to the centre */
    hubs.forEach(function (h) {
      svg.appendChild(svgEl('line', { 'class': 'ons-spoke', x1: 50, y1: 50, x2: pos[h.key].x.toFixed(2), y2: pos[h.key].y.toFixed(2) }));
    });

    /* edges: only what config/omega-relations.json lists, each with its evidence. Weight >= STRONG shows at rest; the rest
       appear when their hub is pointed at. A file that did not load draws no edge at all. */
    var edgeEls = [];
    ((rel && rel.edges) || []).forEach(function (e) {
      var A = pos[e.a], B = pos[e.b];
      if (!A || !B) return;
      /* control point: pulled toward the centre, then pushed sideways in proportion to the chord length so that two
         opposite workspaces curve AROUND the Omega instead of drawing a line through it */
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var bend = 4 + 46 * Math.pow(len / 78, 2);
      var cx = mx + (50 - mx) * 0.55 + (-dy / len) * bend, cy = my + (50 - my) * 0.55 + (dx / len) * bend;
      var d = 'M' + A.x.toFixed(2) + ' ' + A.y.toFixed(2) + ' Q' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ' ' + B.x.toFixed(2) + ' ' + B.y.toFixed(2);
      var g = svgEl('g', { 'class': 'ons-edge' + (e.weight < STRONG ? ' faint' : '') + (e.shared_pages.length ? '' : ' cy') });
      var w = Math.min(0.7, 0.16 + e.weight * 0.035);
      g.appendChild(svgEl('path', { 'class': 'ons-eglow', d: d, 'stroke-width': (w * 3).toFixed(2) }));
      g.appendChild(svgEl('path', { 'class': 'ons-eline', d: d, 'stroke-width': w.toFixed(2) }));
      svg.appendChild(g);
      edgeEls.push({ e: e, g: g });
    });

    var read = el('p', 'ons-read');
    read.setAttribute('aria-live', 'polite');
    read.setAttribute('data-no-clamp', '');   // omega-readmore.js would clamp this to 2 lines on a phone and add its own MORE chip
    var readDefault = rel
      ? 'Choose a workspace to open its pages; most open right here. Point at one to see what it shares with the others: gold lines are pages listed in two workspaces, cyan lines are data tables used by both.'
      : 'The relations file could not be read, so no connections are drawn.';
    read.textContent = readDefault;

    var nodes = {};
    function focusHub(key) {
      if (!rel || (window.matchMedia && window.matchMedia('(max-width:700px)').matches)) return;   // phone: no hover, the lines are hidden, and a changing readout would shift the grid
      if (!key) {
        map.removeAttribute('data-focus');
        edgeEls.forEach(function (x) { x.g.classList.remove('hot'); });
        Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove('on'); });
        read.textContent = readDefault;
        return;
      }
      map.setAttribute('data-focus', key);
      var mine = relsOf(key), peers = {};
      mine.forEach(function (e) { peers[e.a === key ? e.b : e.a] = true; });
      edgeEls.forEach(function (x) { x.g.classList.toggle('hot', x.e.a === key || x.e.b === key); });
      Object.keys(nodes).forEach(function (k) { nodes[k].classList.toggle('on', k === key || !!peers[k]); });
      read.textContent = '';
      read.appendChild(el('b', null, label(key).toUpperCase()));
      if (!mine.length) { read.appendChild(document.createTextNode(' shares no pages or data with another workspace in the evidence file.')); return; }
      read.appendChild(document.createTextNode(' connects to: '));
      mine.slice(0, 4).forEach(function (e, i) {
        var other = e.a === key ? e.b : e.a;
        if (i) read.appendChild(document.createTextNode('; '));
        read.appendChild(el('b', null, label(other)));
        read.appendChild(document.createTextNode(' (' + relText(e) + ')'));
      });
      if (mine.length > 4) read.appendChild(document.createTextNode('; and ' + (mine.length - 4) + ' more.'));
    }

    var nav = el('nav');
    nav.setAttribute('aria-label', 'Workspaces');
    nav.style.display = 'contents';
    hubs.forEach(function (h) {
      var a = el('a', 'ons-node');
      a.href = '#/hub/' + h.key;
      a.style.left = pos[h.key].x.toFixed(2) + '%';
      a.style.top = pos[h.key].y.toFixed(2) + '%';
      var inPlace = h.pages.filter(hostable).length;
      a.title = label(h.key) + ': ' + h.pages.length + ' pages, ' + inPlace + ' open in place';
      a.appendChild(el('span', 'ons-nname', label(h.key)));
      a.appendChild(el('span', 'ons-ncount', h.pages.length + ' pages'));
      a.addEventListener('mouseenter', function () { focusHub(h.key); });
      a.addEventListener('focus', function () { focusHub(h.key); });
      a.addEventListener('mouseleave', function () { focusHub(null); });
      a.addEventListener('blur', function () { focusHub(null); });
      nodes[h.key] = a;
      nav.appendChild(a);
    });
    map.appendChild(nav);

    /* left panel: workspace sizes (the loaded hub map) */
    var left = panel('Workspace size', 'workspace map');
    var rows = el('ul', 'ons-rows');
    var maxPages = hubs.reduce(function (m, h) { return Math.max(m, h.pages.length); }, 1);
    hubs.slice().sort(function (x, y) { return y.pages.length - x.pages.length; }).forEach(function (h) {
      var li = el('li');
      var r = el('a', 'ons-row'); r.href = '#/hub/' + h.key;
      r.appendChild(el('span', null, label(h.key)));
      var track = el('span', 'ons-track'), fill = el('i');
      fill.style.width = Math.round(h.pages.length / maxPages * 100) + '%';
      track.appendChild(fill); r.appendChild(track);
      r.appendChild(el('b', null, String(h.pages.length)));
      li.appendChild(r); rows.appendChild(li);
    });
    left.appendChild(rows);

    /* right panel: the strongest relations, with their evidence */
    var right = panel('Strongest relations', 'omega-relations.json');
    var top = ((rel && rel.edges) || []).slice(0, 6);
    if (!top.length) right.appendChild(el('p', 'ons-sub', 'No relation evidence loaded.'));
    top.forEach(function (e) {
      var d = el('div', 'ons-rel');
      d.appendChild(el('strong', null, label(e.a) + ' ↔ ' + label(e.b)));
      d.appendChild(el('span', null, relText(e)));
      if (e.shared_pages.length) d.appendChild(el('span', 'ons-src', 'pages: ' + e.shared_pages.join(', ')));
      right.appendChild(d);
    });

    /* counters, each computed here from what was loaded */
    var all = {}; hubs.forEach(function (h) { h.pages.forEach(function (k) { all[k] = true; }); });
    var uniq = Object.keys(all), openN = uniq.filter(hostable).length;
    var edges = (rel && rel.edges) || [], strong = edges.filter(function (e) { return e.weight >= STRONG; }).length;
    var stats = el('div', 'ons-stats');
    stats.appendChild(stat(hubs.length, 'Workspaces', 'workspace map'));
    stats.appendChild(stat(uniq.length, 'Pages in them', 'workspace map'));
    stats.appendChild(stat(reg ? openN : '—', 'Open in place', 'eligibility registry'));
    stats.appendChild(stat(rel ? strong + ' / ' + edges.length : '—', 'Relations drawn / found', 'omega-relations.json'));

    /* matrix panel: the platform's own 9x9x9 lattice, drawn by omega-sculpture.js (it owns WebGL), figures from the canon */
    var mx = panel('The matrix', 'omega-canon.json');
    var cube = el('div', 'ons-cube');
    cube.setAttribute('data-omega-sculpture', 'matrix');
    cube.setAttribute('data-sculpt-bloom', 'off');             // the lattice needs no glow pass, and each bloom is a full-resolution composite per frame
    cube.setAttribute('data-sculpt-height', '1px');            // sized by CSS; the module wants a length
    cube.setAttribute('data-sculpt-label', 'The nine by nine by nine matrix lattice, in three dimensions');
    mx.appendChild(cube);
    var facts = el('ul', 'ons-facts'), fnote = el('p', 'ons-fnote');
    mx.appendChild(facts); mx.appendChild(fnote);
    fillFacts(facts, fnote);
    var cl = el('a', 'ons-cubelink', 'OPEN THE MATRIX \u2197');
    cl.href = hostable('matrix') ? '#/p/matrix' : '/matrix.html';
    mx.appendChild(cl);
    watchCube(cube, mx);
    var col = el('div', 'ons-col');
    col.appendChild(right);
    col.appendChild(mx);

    board.appendChild(left);
    board.appendChild(map);
    board.appendChild(col);
    board.appendChild(stats);
    viewMap.appendChild(read);      // above the board, so it is on screen while a workspace is pointed at
    viewMap.appendChild(board);
  }

  function pageTag(key) {
    var e = entry(key);
    if (hostable(key)) return { text: 'Opens here', cls: 'in', title: '' };
    var why = e && e.reason ? e.reason : 'not listed as hostable';
    var text = e && e.status === 'excluded-pending-review' ? 'Own page · review pending' : 'Own page ↗';
    return { text: text, cls: '', title: why };
  }

  function renderHub(h) {
    viewHub.textContent = '';
    var ul = el('ul', 'ons-grid');
    h.pages.forEach(function (key) {
      if (!KEY.test(key)) return;
      var li = el('li');
      var inPlace = hostable(key);
      var a = el('a', 'ons-page');
      a.href = inPlace ? '#/p/' + key : '/' + key + '.html';
      var tag = pageTag(key);
      a.appendChild(el('span', 'ons-pname', label(key)));
      var t = el('span', 'ons-ptag' + (tag.cls ? ' ' + tag.cls : ''), tag.text);
      if (tag.title) a.title = tag.title;
      a.appendChild(t);
      li.appendChild(a);
      ul.appendChild(li);
    });
    viewHub.appendChild(ul);
  }

  function notice(text, href, linkText) {
    stageHost.hidden = true;
    noteHost.hidden = false;
    noteHost.textContent = '';
    var box = el('div', 'ons-note', text + ' ');
    if (href) { var a = el('a', '', linkText); a.href = href; box.appendChild(a); }
    noteHost.appendChild(box);
  }

  /* ---- routes ------------------------------------------------------------ */
  function leavePage() {
    if (window.OmegaPanels && window.OmegaPanels.close) window.OmegaPanels.close(stageHost);
    stageHost.hidden = true;
    noteHost.hidden = true;
    noteHost.textContent = '';
  }

  function routeMap() {
    leavePage();
    setCrumbs([{ text: 'Map' }]);
    setHead('Platform map', '');   // the readout under the title carries the explanation, so the blueprint starts higher on screen
    setFull(null);
    showOnly(viewMap);
    arrive('Platform map');
  }
  function routeHub(key) {
    var h = hubs.filter(function (x) { return x.key === key; })[0];
    leavePage();
    if (!h) { routeUnknown(); return; }
    setCrumbs([{ text: 'Map', href: '#/' }, { text: label(h.key) }]);
    setHead(label(h.key), h.pages.length + ' pages. Those marked “Opens here” load inside this page; the rest are ordinary links.');
    renderHub(h);
    setFull(h.path, 'Open ' + label(h.key) + ' page ↗');
    showOnly(viewHub);
    arrive(label(h.key) + ' workspace, ' + h.pages.length + ' pages');
  }
  function routePage(key) {
    if (isHub(key)) { location.replace('#/hub/' + key); return; }
    var h = hubOf(key);
    var crumbs = [{ text: 'Map', href: '#/' }];
    if (h) crumbs.push({ text: label(h.key), href: '#/hub/' + h.key });
    crumbs.push({ text: label(key) });
    setCrumbs(crumbs);
    setHead(label(key), '');
    setFull('/' + key + '.html', 'Open full page ↗');
    showOnly(viewPage);
    if (!hostable(key)) {                                   // default deny: unknown, excluded, public, redirecting
      var e = entry(key);
      if (window.OmegaPanels && window.OmegaPanels.close) window.OmegaPanels.close(stageHost);
      notice(e ? label(key) + ' is not shown inside this page (' + (e.reason || e.status) + ').' : label(key) + ' is not a page this shell knows.',
             e ? '/' + key + '.html' : '#/', e ? 'Open ' + label(key) + ' on its own page ↗' : 'Back to the map');
      arrive(label(key) + ' opens on its own page');
      return;
    }
    var my = ++token;
    noteHost.hidden = true;
    noteHost.textContent = '';
    stageHost.hidden = false;
    live.textContent = 'Loading ' + label(key);
    window.OmegaPanels.open('/' + key + '.html', stageHost, { key: key, label: label(key).toUpperCase() }).then(function () {
      if (my !== token) return;
      arrive(label(key) + ' loaded');
    });
  }
  function routeUnknown() {
    leavePage();
    setCrumbs([{ text: 'Map', href: '#/' }, { text: 'Not found' }]);
    setHead('Not found', '');
    setFull(null);
    showOnly(viewPage);
    notice('That address is not part of this shell.', '#/', 'Back to the map');
    arrive('Not found');
  }

  function route() {
    token++;
    var h = location.hash || '';
    if (h === '' || h === '#' || h === '#/') { routeMap(); return; }
    var m = h.match(/^#\/(hub|p)\/([a-z0-9-]+)$/);
    if (!m) {
      if (/^#\//.test(h)) routeUnknown();                    // ours by prefix, but malformed
      return;                                                // anything else is an anchor on the host page: leave it
    }
    if (!KEY.test(m[2])) { routeUnknown(); return; }
    if (m[1] === 'hub') routeHub(m[2]); else routePage(m[2]);
  }

  /* a link inside a hosted page that points at another page the shell can show is routed here, not navigated to */
  viewPage.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.classList.contains('op-open') || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;   // the engine's own "open full page" is the escape hatch
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (x) { return; }
    if (u.origin !== location.origin || u.pathname === location.pathname) return;   // another site, or this very document (#fragment links)
    var m = u.pathname.match(/^\/([a-z0-9-]+)\.html$/);
    if (!m) return;
    if (isHub(m[1])) { e.preventDefault(); location.hash = '#/hub/' + m[1]; }
    else if (hostable(m[1])) { e.preventDefault(); location.hash = '#/p/' + m[1]; }
  }, true);

  /* ---- boot: wait for the three things it reads --------------------------- */
  function waitFor(test, label2) {
    return new Promise(function (res, rej) {
      if (test()) return res();
      var t0 = Date.now();
      var iv = setInterval(function () {
        if (test()) { clearInterval(iv); res(); }
        else if (Date.now() - t0 > WAIT_MS) { clearInterval(iv); rej(new Error(label2 + ' did not load')); }
      }, 100);
    });
  }
  function ensureScript(src, id) {
    if ((id && document.getElementById(id)) || document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement('script');
    if (id) s.id = id;
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  }
  function fail(msg) {
    mount.appendChild(root);
    setCrumbs([{ text: 'Map' }]);
    setHead('Platform map', '');
    showOnly(viewPage);
    notice(msg, '/dashboard.html', 'Open the dashboard ↗');
  }

  injectCSS();
  ensureScript('/omega-single-page-workspaces.js', 'omega-single-page-loader');   // the id nav.js checks, so it is not added twice
  ensureScript('/omega-panels.js');
  ensureSculpture();
  var regP = fetch(REGISTRY_URL, { credentials: 'same-origin' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (j) { return (j && j.schema === 1 && j.pages) || null; }).catch(function () { return null; });

  var relP = fetch(RELATIONS_URL, { credentials: 'same-origin' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (j) { return (j && j.schema === 1 && Array.isArray(j.edges) && j) || null; }).catch(function () { return null; });

  Promise.all([
    waitFor(function () { return !!window.OmegaWorkspaces; }, 'the workspace map'),
    waitFor(function () { return !!(window.OmegaPanels && window.OmegaPanels.open); }, 'the page engine'),
    regP,
    relP
  ]).then(function (r) {
    ws = window.OmegaWorkspaces;
    rel = r[3];                                              // null => no connection lines, the map says so
    reg = r[2];                                              // null => nothing is hosted, every page is a link
    hubs = Object.keys(ws.hubs).map(function (p) { return { key: hubKeyOf(p), path: p, pages: ws.hubs[p].filter(function (k) { return KEY.test(k); }) }; });
    buildMap();
    mount.appendChild(root);
    route();
    window.addEventListener('hashchange', route);
    document.dispatchEvent(new CustomEvent('omega:one-shell-ready', { detail: { hubs: hubs.length, registry: !!reg } }));
  }).catch(function (err) {
    console.warn('[omega-shell]', err);
    fail('The platform map could not load here.');
  });
})();
