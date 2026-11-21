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
  var WAIT_MS = 8000;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var baseTitle = document.title;
  var selfKey = String(location.pathname).replace(/^\//, '').replace(/\.html$/, '');   // this page: never hosted inside itself

  var ws = null;        // window.OmegaWorkspaces
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
      /* map */
      '.ons-map{position:relative;width:min(100%,680px);aspect-ratio:1;margin:0 auto}',
      '.ons-lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}',
      '.ons-line{stroke:rgba(201,168,76,.42);stroke-width:.25;stroke-dasharray:1.2 1.6;animation:ons-flow 7s linear infinite}',
      '@keyframes ons-flow{to{stroke-dashoffset:-11.2}}',
      '.ons-core{position:absolute;left:50%;top:50%;width:25%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;display:grid;place-items:center;',
      'font:clamp(34px,8vw,72px)/1 var(--D,"Cinzel Decorative",serif);color:#F0D98F;text-shadow:0 0 26px rgba(240,213,138,.6);',
      'background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.2),rgba(201,168,76,.16) 34%,rgba(4,7,13,.96) 72%);border:1px solid rgba(240,213,138,.7);',
      'box-shadow:0 0 0 8px rgba(201,168,76,.05),0 0 44px rgba(201,168,76,.28),0 0 110px rgba(0,229,255,.1),inset 0 0 28px rgba(201,168,76,.18)}',
      '.ons-node{position:absolute;transform:translate(-50%,-50%);min-width:88px;min-height:56px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;',
      'border:1px solid rgba(201,168,76,.4);border-radius:12px;background:linear-gradient(145deg,rgba(30,27,20,.94),rgba(5,8,14,.96));box-shadow:0 0 22px rgba(201,168,76,.1);',
      'transition:border-color .2s,box-shadow .2s}',
      '.ons-node:hover,.ons-node:focus-visible{border-color:rgba(240,213,138,.9);box-shadow:0 0 30px rgba(201,168,76,.34);outline:none}',
      '.ons-nname{font:13px/1.25 var(--M,"Courier Prime",monospace);letter-spacing:.08em;color:#F0D98F;text-transform:uppercase}',
      '.ons-ncount{font:11px/1.3 var(--M,"Courier Prime",monospace);color:#A9A7A0;margin-top:3px}',
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
      '.ons-lines{display:none}.ons-core{position:static;transform:none;grid-column:1/-1;width:96px;margin:0 auto 6px}',
      '.ons-node{position:static;transform:none;min-width:0;min-height:64px}}',
      '@media (prefers-reduced-motion:reduce){.ons-line{animation:none}.ons-node,.ons-page{transition:none}.ons-page:hover{transform:none}}'
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
  function buildMap() {
    viewMap.textContent = '';
    var map = el('div', 'ons-map');
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ons-lines');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    map.appendChild(svg);
    map.appendChild(el('div', 'ons-core', 'Ω'));
    var nav = el('nav');
    nav.setAttribute('aria-label', 'Workspaces');
    nav.style.display = 'contents';
    var n = hubs.length;
    hubs.forEach(function (h, i) {
      var ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
      var x = 50 + 39 * Math.cos(ang), y = 50 + 39 * Math.sin(ang);
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'ons-line');
      line.setAttribute('x1', '50'); line.setAttribute('y1', '50');
      line.setAttribute('x2', x.toFixed(2)); line.setAttribute('y2', y.toFixed(2));
      svg.appendChild(line);
      var a = el('a', 'ons-node');
      a.href = '#/hub/' + h.key;
      a.style.left = x.toFixed(2) + '%';
      a.style.top = y.toFixed(2) + '%';
      var inPlace = h.pages.filter(hostable).length;
      a.title = label(h.key) + ': ' + h.pages.length + ' pages, ' + inPlace + ' open in place';
      a.appendChild(el('span', 'ons-nname', label(h.key)));
      a.appendChild(el('span', 'ons-ncount', h.pages.length + ' pages'));
      nav.appendChild(a);
    });
    map.appendChild(nav);
    viewMap.appendChild(map);
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
    setHead('Platform map', 'The workspaces of the platform around the Omega. Choose one to see its pages; most open right here.');
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
  var regP = fetch(REGISTRY_URL, { credentials: 'same-origin' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (j) { return (j && j.schema === 1 && j.pages) || null; }).catch(function () { return null; });

  Promise.all([
    waitFor(function () { return !!window.OmegaWorkspaces; }, 'the workspace map'),
    waitFor(function () { return !!(window.OmegaPanels && window.OmegaPanels.open); }, 'the page engine'),
    regP
  ]).then(function (r) {
    ws = window.OmegaWorkspaces;
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
