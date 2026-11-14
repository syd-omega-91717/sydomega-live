/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-panels.js

   One page, many tools. A host page lists existing pages as tabs; choosing a
   tab shows that page's own content IN PLACE, so a member moves between them
   without a page load and the menu needs one entry, not one per page.

   NOTHING IS REWRITTEN. The source pages stay as they are (same files, same
   URLs, still open on their own); this module reads one, puts its <main>
   content in the host, and runs its scripts. Framing is not an option --
   production sends X-Frame-Options: DENY -- so the content is moved, not framed.

   HOW A PANEL IS LOADED (one at a time; the previous one is torn down first):
     1. fetch the page, parse it with DOMParser (never innerHTML on the string);
     2. copy its <main> children, minus <script>, into the stage;
     3. copy its <style> blocks into <head> (tagged, removed on unload);
     4. run its scripts in order. External scripts load once (bg.js, nav, morph,
        analytics are the host's own and are skipped). A CLASSIC inline script is
        wrapped in a function, because its top-level let/const/class would throw
        "already declared" the second time the panel opens; the handler names its
        markup calls (onclick="fn(") are copied back to window. A MODULE script has
        its own scope already and runs as written;
     5. while a panel's scripts and callbacks run, setInterval/setTimeout and
        document/window listeners it creates are recorded and removed on unload.
        A panel that registers `DOMContentLoaded` is called once instead of waiting
        for an event that already fired, and is not allowed to re-fire it for bg.js.

   MOUNT: <section data-omega-panels='[["water","WATER","/water.html"],...]'
           data-omega-panels-label="Trackers"></section>
   URL:   #water opens that tab; a tab that fails to load shows a link to the
          full page instead of an empty box. Reduced motion: no animation here.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaPanels) return;

  var SKIP_SCRIPT = /(^|\/)(bg|nav|omega-morph|omega-analytics-init|omega-speed-insights-init|omega-sparkline)\.js(\?|$)/;
  var SKIP_STYLE_ID = /^omega-vt/;
  var docCache = {};
  var extLoaded = {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function injectCSS() {
    if (document.getElementById('omega-panels-css')) return;
    var s = el('style');
    s.id = 'omega-panels-css';
    s.textContent = [
      '.op{margin:18px 0 0;scroll-margin-top:76px}',
      '.op-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}',
      '@media (max-width:700px){.op-tabs{flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding-bottom:4px}.op-tabs::-webkit-scrollbar{display:none}.op-tab{flex:0 0 auto;scroll-snap-align:start}}',
      '.op-tab{min-height:44px;padding:0 14px;border:1px solid rgba(201,168,76,.22);border-radius:8px;background:transparent;color:#B8B6AE;font:600 12px/1 var(--M,"Courier Prime",monospace);letter-spacing:1.6px;cursor:pointer}',
      '.op-tab:hover{color:#E8C966;border-color:rgba(201,168,76,.5)}',
      '.op-tab[aria-selected="true"]{color:#0A0A0F;background:#C9A84C;border-color:#C9A84C}',
      '.op-tab:focus-visible,.op-open:focus-visible{outline:2px solid #C9A84C;outline-offset:3px}',
      '.op-stage{min-width:0}',
      '.op-stage:empty{display:none}',
      '.op-bar{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin:0 0 10px;font:12px/1.4 var(--M,"Courier Prime",monospace);letter-spacing:1.4px;color:#B8B6AE}',
      '.op-open{color:#E8C966;text-decoration:none;min-height:44px;display:inline-flex;align-items:center}',
      '.op-msg{padding:18px;border:1px solid rgba(201,168,76,.22);border-radius:8px;color:#B8B6AE;font:14px/1.6 var(--R,Rajdhani,sans-serif)}',
      '.op-hint{margin:0 0 12px;color:#B8B6AE;font:14px/1.6 var(--R,Rajdhani,sans-serif)}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---- fetch + parse ---------------------------------------------------- */
  function fetchDoc(src) {
    if (docCache[src]) return Promise.resolve(docCache[src]);
    return fetch(src, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      var d = new DOMParser().parseFromString(t, 'text/html');
      docCache[src] = d;
      return d;
    });
  }

  /* ---- recording of what a panel leaves running ------------------------- */
  var cur = null; /* the panel being run or shown: {timers,intervals,raf,listeners,styles,exports,dead} */
  var patched = false;
  /* A callback made while a panel runs is tied to that panel: it is skipped once the panel is torn
     down, and while it runs `cur` is the panel again, so a timer it starts is tied too. */
  function tie(panel, fn) {
    if (typeof fn !== 'function') return fn;
    return function () {
      if (panel.dead) return;
      var prev = cur;
      cur = panel;
      try { return fn.apply(this, arguments); } finally { cur = prev; }
    };
  }
  function patchOnce() {
    if (patched) return;
    patched = true;
    var si = window.setInterval, st = window.setTimeout, raf = window.requestAnimationFrame;
    window.setInterval = function (fn) {
      var args = Array.prototype.slice.call(arguments);
      if (cur) args[0] = tie(cur, fn);
      var id = si.apply(window, args);
      if (cur) cur.intervals.push(id);
      return id;
    };
    window.setTimeout = function (fn) {
      var args = Array.prototype.slice.call(arguments);
      if (cur) args[0] = tie(cur, fn);
      var id = st.apply(window, args);
      if (cur) cur.timers.push(id);
      return id;
    };
    window.requestAnimationFrame = function (fn) {
      var id = raf.call(window, cur ? tie(cur, fn) : fn);
      if (cur) cur.raf.push(id);
      return id;
    };
    [window, document].forEach(function (target) {
      var add = target.addEventListener;
      target.addEventListener = function (type, fn, opts) {
        if (cur && type === 'DOMContentLoaded' && target === document) {
          cur.ready.push(fn);
          return;
        }
        if (cur) {
          var wrapped = tie(cur, fn);
          cur.listeners.push([target, type, wrapped, opts]);
          return add.call(target, type, wrapped, opts);
        }
        return add.call(target, type, fn, opts);
      };
    });
  }

  function teardown(p) {
    if (!p) return;
    p.dead = true;
    p.intervals.forEach(clearInterval);
    p.raf.forEach(function (i) { cancelAnimationFrame(i); });
    p.timers.forEach(clearTimeout);
    p.listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    p.styles.forEach(function (s) { if (s.parentNode) s.parentNode.removeChild(s); });
    p.exports.forEach(function (n) { try { delete window[n]; } catch (e) { window[n] = undefined; } });
  }

  /* ---- scripts ----------------------------------------------------------- */
  function handlerNames(markup, js) {
    var names = {}, m, re = /\son[a-z]+=\\?["']\s*([A-Za-z_$][\w$]*)\s*\(/g;
    while ((m = re.exec(markup))) names[m[1]] = 1;
    re = /\son[a-z]+=\\?["']\s*([A-Za-z_$][\w$]*)\s*\(/g;
    while ((m = re.exec(js))) names[m[1]] = 1;
    return Object.keys(names).filter(function (n) { return /^[A-Za-z_$][\w$]*$/.test(n); });
  }

  /* Returns a promise that resolves when the script has run. A classic script runs inside this call. A
     module script is evaluated later by the browser, after this call returns, so the panel stays "current"
     (for timers and listeners it creates) until a trailing statement reports it finished -- or 2.5 s pass,
     which is the case where the module threw before reaching it. */
  var moduleSeq = 0;
  function runInline(node, markup, panel) {
    var code = node.textContent || '';
    if (!code.trim()) return Promise.resolve();
    var s = document.createElement('script');
    if ((node.getAttribute('type') || '').toLowerCase() === 'module') {
      var tag = '__opd' + (++moduleSeq);
      return new Promise(function (res) {
        var done = false;
        function finish() {
          if (done) return;
          done = true;
          try { delete window[tag]; } catch (e) { window[tag] = undefined; }
          cur = null;
          res();
        }
        window[tag] = finish;
        setTimeout(finish, 2500);
        s.type = 'module';
        s.textContent = code + '\n;window.' + tag + ' && window.' + tag + '();';
        cur = panel;
        document.body.appendChild(s);
        s.parentNode.removeChild(s);
      });
    }
    var names = handlerNames(markup, code);
    panel.exports = panel.exports.concat(names);
    var tail = names.map(function (n) {
      return 'try{if(typeof ' + n + '==="function")window.' + n + '=' + n + ';}catch(e){}';
    }).join('');
    s.textContent = '(function(){\n' + code + '\n;' + tail + '\n})();';
    cur = panel;
    try { document.body.appendChild(s); } finally { cur = null; }
    s.parentNode.removeChild(s);
    return Promise.resolve();
  }

  function loadExternal(url) {
    if (extLoaded[url] || document.querySelector('script[src="' + url + '"]')) return Promise.resolve();
    return new Promise(function (res) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = function () { extLoaded[url] = 1; res(); };
      s.onerror = function () { res(); };
      document.body.appendChild(s);
    });
  }

  function runScripts(doc, base, markup, panel) {
    var list = Array.prototype.slice.call(doc.querySelectorAll('script'));
    var chain = Promise.resolve();
    list.forEach(function (node) {
      chain = chain.then(function () {
        var srcAttr = node.getAttribute('src');
        if (srcAttr) {
          var url = new URL(srcAttr, new URL(base, location.href)).pathname;
          if (SKIP_SCRIPT.test(url)) return;
          return loadExternal(url);
        }
        if (node.id && /^omega-(vt|morph)/.test(node.id)) return;
        return runInline(node, markup, panel);
      });
    });
    return chain;
  }

  /* ---- one mount --------------------------------------------------------- */
  function mount(host) {
    var tabs;
    try { tabs = JSON.parse(host.getAttribute('data-omega-panels')); } catch (e) { return; }
    if (!Array.isArray(tabs) || !tabs.length) return;
    injectCSS();
    patchOnce();

    host.classList.add('op');
    var bar = el('div', 'op-tabs');
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', host.getAttribute('data-omega-panels-label') || 'Tools');
    var stage = el('div', 'op-stage');
    stage.setAttribute('role', 'tabpanel');
    stage.setAttribute('aria-live', 'polite');
    host.appendChild(bar);
    host.appendChild(stage);

    var buttons = {}, active = null, token = 0;
    tabs.forEach(function (t) {
      var b = el('button', 'op-tab', t[1]);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.addEventListener('click', function () {
        if (active && active.key === t[0]) { close(); history.replaceState(null, '', location.pathname + location.search); }
        else { open(t[0]); history.replaceState(null, '', '#' + t[0]); }
      });
      buttons[t[0]] = b;
      bar.appendChild(b);
    });

    /* keep the chosen tab in view in the one-row phone strip: scrollLeft only, never the page. Called again
       once the panel is in, because the approval guard can leave the strip unmeasured at first. */
    function centerTab(key) {
      var bt = buttons[key];
      if (bt && bar.clientWidth) bar.scrollLeft = Math.max(0, bt.offsetLeft - (bar.clientWidth - bt.offsetWidth) / 2);
    }

    function close() {
      token++;
      if (active) teardown(active.panel);
      active = null;
      stage.textContent = '';
      Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-selected', 'false'); });
    }

    function open(key, scroll) {
      var tab = tabs.filter(function (t) { return t[0] === key; })[0];
      if (!tab) return;
      var my = ++token;
      if (active) teardown(active.panel);
      active = null;
      stage.textContent = '';
      Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-selected', k === key ? 'true' : 'false'); });
      centerTab(key);
      var panel = { intervals: [], timers: [], raf: [], listeners: [], styles: [], exports: [], ready: [], dead: false };
      active = { key: key, panel: panel };
      stage.setAttribute('aria-busy', 'true');
      stage.appendChild(el('div', 'op-msg', 'Loading ' + tab[1] + '…'));

      fetchDoc(tab[2]).then(function (doc) {
        if (my !== token) return;
        var main = doc.querySelector('main') || doc.querySelector('.page-shell') || doc.querySelector('#app');
        if (!main) throw new Error('no content');
        stage.textContent = '';
        var top = el('div', 'op-bar');
        var full = el('a', 'op-open', 'OPEN FULL PAGE \u2197');
        full.href = tab[2];
        top.appendChild(full);
        stage.appendChild(top);
        var ser = new XMLSerializer();
        var markup = ser.serializeToString(main);
        Array.prototype.forEach.call(main.childNodes, function (n) {
          if (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'ASIDE')) return;
          stage.appendChild(document.importNode(n, true));
        });
        Array.prototype.forEach.call(stage.querySelectorAll('script'), function (s) { s.parentNode.removeChild(s); });
        /* modals and dialogs usually sit after </main>, outside what was copied; without them
           openModal() would read null. They are fixed-position, so the stage is a fine home. */
        Array.prototype.forEach.call(doc.querySelectorAll('[id$="-modal"], .modal-bg, dialog, [role="dialog"]'), function (m) {
          if (main.contains(m) || m.closest('aside') || /^omega-/.test(m.id || '')) return;
          markup += ser.serializeToString(m);
          stage.appendChild(document.importNode(m, true));
        });
        Array.prototype.forEach.call(doc.querySelectorAll('style'), function (s) {
          if (SKIP_STYLE_ID.test(s.id || '')) return;
          var c = document.createElement('style');
          c.setAttribute('data-op-style', key);
          c.textContent = s.textContent;
          document.head.appendChild(c);
          panel.styles.push(c);
        });
        return runScripts(doc, tab[2], markup, panel).then(function () {
          if (my !== token) return;
          var ready = panel.ready.slice();
          panel.ready.length = 0;
          cur = panel;
          try { ready.forEach(function (fn) { try { fn.call(document, new Event('DOMContentLoaded')); } catch (e) { console.error(e); } }); }
          finally { cur = null; }
          stage.removeAttribute('aria-busy');
          centerTab(key);
          /* Scroll only now: before the panel is in, the page above it is still settling (the approval
             guard keeps the shell at zero height until it lifts), so an earlier scroll lands at the top. */
          if (scroll) host.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
      }).catch(function (err) {
        if (my !== token) return;
        stage.textContent = '';
        stage.removeAttribute('aria-busy');
        var m = el('div', 'op-msg', 'This tool could not load here. ');
        var a = el('a', 'op-open', 'OPEN ' + tab[1] + ' ON ITS OWN PAGE \u2197');
        a.href = tab[2];
        m.appendChild(a);
        stage.appendChild(m);
        console.warn('[omega-panels]', key, err);
      });
    }

    function fromHash() {
      var k = decodeURIComponent((location.hash || '').replace(/^#/, ''));
      if (k && buttons[k]) { open(k, true); }
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
    host.__omegaPanels = { open: open, close: close, has: function (k) { return !!buttons[k]; }, current: function () { return active && active.key; } };
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-omega-panels]'), function (h) {
      if (!h.__omegaPanels) mount(h);
    });
  }
  window.OmegaPanels = { mount: mount, boot: boot };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
