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
        markup calls from an inline event attribute are copied back to window. A MODULE script has
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
    p.exports.forEach(function (n) {
      try {
        if (p.saved[n]) Object.defineProperty(window, n, p.saved[n]);
        else delete window[n];
      } catch (e) { /* a property that cannot be restored is left as it is */ }
    });
  }

  /* ---- scripts ----------------------------------------------------------- */
  var RESERVED = /^(if|for|while|switch|return|function|typeof|new|catch|void|delete|in|of|do|else|try|with|alert|confirm|prompt|event|this)$/;
  /* Every function the markup (or a template string in the script) calls from an on*= attribute, kept only
     when the code declares it: that is the set the page needs on window, and nothing else is touched. */
  function handlerNames(markup, js) {
    var called = {}, m, attr = /\bon[a-z]+\s*=\s*\\?["']([^"'<>]*)/g;
    [markup, js].forEach(function (src) {
      attr.lastIndex = 0;
      while ((m = attr.exec(src))) {
        var call = /([A-Za-z_$][\w$]*)\s*\(/g, c;
        while ((c = call.exec(m[1]))) if (!RESERVED.test(c[1])) called[c[1]] = 1;
      }
    });
    return Object.keys(called).filter(function (n) { return declares(js, n); });
  }

  /* Does the code declare `n` as a function, or as a variable that is assigned? Plain string search plus
     LITERAL patterns on a short window around each hit: no regular expression is ever built from a name. */
  function declares(js, n) {
    var from = 0, i;
    while ((i = js.indexOf(n, from)) >= 0) {
      from = i + 1;
      if (/[\w$]/.test(js.charAt(i - 1)) || /[\w$]/.test(js.charAt(i + n.length))) continue; /* part of a longer name */
      var before = js.slice(Math.max(0, i - 40), i);
      if (/(?:^|[^\w$])function\s+$/.test(before)) return true;
      if (/(?:^|[^\w$])(?:const|let|var)\s+$/.test(before) && /^\s*=/.test(js.slice(i + n.length, i + n.length + 40))) return true;
    }
    return false;
  }

  /* Returns a promise that resolves when the script has run. A classic script runs inside this call. A
     module script is evaluated later by the browser, after this call returns, so the panel stays "current"
     (for timers and listeners it creates) until a trailing statement reports it finished -- or 2.5 s pass,
     which is the case where the module threw before reaching it. */
  var moduleSeq = 0;
  function runModule(code, panel) {
    var s = document.createElement('script');
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

  /* All of a page's classic inline scripts share one scope on the real page (a function in one is visible to
     the next), so they run here as ONE wrapped unit, in order. On the real page a top-level `function` or `var`
     is also a window global -- other scripts, module scripts and inline event attributes all reach it that way -- so
     each one is mirrored onto window as a live binding. Whatever it shadows on the host (a global such as `esc`
     or `sid`) is saved first and put back when the panel is torn down. */
  /* The names declared by one `var/let/const a = 1, b = [2, 3], c;` statement. A scan, not a regex, because the
     later names (b, c) are the ones a first-name pattern misses (`var PHI=1.6,EU=2.7;`). It follows strings,
     template literals and bracket depth so a comma inside an initializer is not read as a new declarator,
     and it gives up quietly on destructuring. */
  function declaredNames(code, from) {
    var names = [], i = from, n = code.length;
    while (i < n) {
      while (i < n && /\s/.test(code[i])) i++;
      var m = /^[A-Za-z_$][\w$]*/.exec(code.slice(i, i + 80));
      if (!m) break;
      names.push(m[0]);
      i += m[0].length;
      var depth = 0, last = '';
      for (; i < n; i++) {
        var ch = code[i];
        if (ch === '"' || ch === "'" || ch === '`') {
          var q = ch;
          for (i++; i < n && code[i] !== q; i++) if (code[i] === '\\') i++;
          last = q;
          continue;
        }
        if (ch === '/' && code[i + 1] === '/') { while (i < n && code[i] !== '\n') i++; i--; continue; }
        if (ch === '/' && code[i + 1] === '*') { i = code.indexOf('*/', i + 2); if (i < 0) return names; i++; continue; }
        if (ch === '(' || ch === '[' || ch === '{') depth++;
        else if (ch === ')' || ch === ']' || ch === '}') depth--;
        else if (depth === 0 && ch === ',') { i++; break; }
        else if (depth === 0 && ch === ';') return names;
        else if (depth === 0 && ch === '\n' && !/[,+\-*/%&|=<>?:!(\[{]$/.test(last)) return names;
        if (!/\s/.test(ch)) last = ch;
      }
      if (i >= n) break;
    }
    return names;
  }

  function topLevelNames(code) {
    var out = {}, m, f = /^(?:async\s+)?function\s*\*?\s+([A-Za-z_$][\w$]*)/gm, d = /^(?:var|let|const)\s+/gm, c = /^class\s+([A-Za-z_$][\w$]*)/gm;
    while ((m = f.exec(code))) out[m[1]] = 1;
    while ((m = c.exec(code))) out[m[1]] = 1;
    while ((m = d.exec(code))) declaredNames(code, m.index + m[0].length).forEach(function (n) { out[n] = 1; });
    return Object.keys(out);
  }

  function runClassic(codes, markup, panel) {
    var code = codes.join('\n;\n');
    if (!code.trim()) return;
    function free(n) {
      var d = Object.getOwnPropertyDescriptor(window, n);
      return !d || d.configurable;
    }
    /* Names the page's markup calls from on*= attributes are copied to window BY VALUE, and only when the
       page's own binding is a function: copying is harmless even if the name only resolved to a host global
       (it copies its own value), and it deliberately replaces a host global of the same name (switchTab) for
       as long as the panel is open. */
    var handlers = handlerNames(markup, code).filter(free);
    /* Every other top-level name becomes a LIVE window binding, but only when the host has no global of that
       name. Then `n;` is an exact test of "declared at this scope" (it throws otherwise, e.g. for names the
       page declares inside its own inner function), and an accessor can never read itself. */
    var live = topLevelNames(code).filter(function (n) { return free(n) && !(n in window) && handlers.indexOf(n) < 0; });
    handlers.concat(live).forEach(function (n) { panel.saved[n] = Object.getOwnPropertyDescriptor(window, n) || null; });
    panel.exports = panel.exports.concat(handlers, live);
    var tail = handlers.map(function (n) {
      return 'try{if(typeof ' + n + '==="function")window[' + JSON.stringify(n) + ']=' + n + ';}catch(e){}';
    }).join('') + live.map(function (n) {
      /* A page can assign window.n itself (window.n = n inside its inner function). Then `n;` below would
         resolve to that global and the getter would read itself, so the name must still be ABSENT from
         window here: a binding declared in this wrapper never puts itself there. */
      return 'try{' + n + ';if(!(' + JSON.stringify(n) + ' in window))Object.defineProperty(window,' + JSON.stringify(n) + ',{configurable:true,enumerable:true,get:function(){return ' + n + '},set:function(v){' + n + '=v}})}catch(e){}';
    }).join('');
    var s = document.createElement('script');
    s.textContent = '(function(){\n' + code + '\n;' + tail + '\n})();';
    cur = panel;
    try { document.body.appendChild(s); } finally { cur = null; }
    s.parentNode.removeChild(s);
  }

  /* A classic external script loads once (bg.js and the shared helpers are the host's already). A MODULE
     external script is evaluated once per URL by the browser, so reopening a tab would never run it again:
     it gets a throw-away query string, a fresh evaluation, and the panel stays current until it has run. */
  var extSeq = 0;
  function loadExternal(url, isModule, panel) {
    if (!isModule) {
      if (extLoaded[url] || document.querySelector('script[src="' + url + '"]')) return Promise.resolve();
      return new Promise(function (res) {
        var s = document.createElement('script');
        s.src = url;
        s.onload = function () { extLoaded[url] = 1; res(); };
        s.onerror = function () { res(); };
        document.body.appendChild(s);
      });
    }
    return new Promise(function (res) {
      var s = document.createElement('script');
      s.type = 'module';
      s.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + (++extSeq);
      function done() { cur = null; res(); }
      s.onload = function () { done(); s.parentNode && s.parentNode.removeChild(s); };
      s.onerror = done;
      cur = panel;
      document.body.appendChild(s);
    });
  }

  function runScripts(doc, base, markup, panel) {
    var list = Array.prototype.slice.call(doc.querySelectorAll('script'));
    var classic = [], modules = [], chain = Promise.resolve();
    list.forEach(function (node) {
      var srcAttr = node.getAttribute('src');
      if (srcAttr) {
        var url = new URL(srcAttr, new URL(base, location.href)).pathname;
        if (SKIP_SCRIPT.test(url)) return;
        var isModule = (node.getAttribute('type') || '').toLowerCase() === 'module';
        chain = chain.then(function () { return loadExternal(url, isModule, panel); });
        return;
      }
      if (node.id && /^omega-(vt|morph)/.test(node.id)) return;
      if ((node.getAttribute('type') || '').toLowerCase() === 'module') modules.push(node.textContent || '');
      else classic.push(node.textContent || '');
    });
    chain = chain.then(function () { runClassic(classic, markup, panel); });
    modules.forEach(function (code) {
      chain = chain.then(function () { return code.trim() ? runModule(code, panel) : undefined; });
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

    /* A handler written as an inline event attribute runs outside everything recorded so far, so a timer or listener it
       starts would outlive the tab and later write into elements that are gone. While an event is being
       delivered inside the stage, the open panel is "current"; it is released when the event has finished
       bubbling (window, last) or, if something stopped it, at the end of the task. */
    ['click', 'input', 'change', 'submit', 'keydown', 'keyup', 'pointerdown', 'mousedown', 'touchstart', 'focusin'].forEach(function (type) {
      stage.addEventListener(type, function () {
        if (!active || cur) return;
        var panel = active.panel, released = false;
        function release() {
          if (released) return;
          released = true;
          window.removeEventListener(type, release, false);
          if (cur === panel) cur = null;
        }
        /* registered BEFORE the panel is made current, so the patched addEventListener/setTimeout pass them
           through untouched instead of wrapping and recording them */
        window.addEventListener(type, release, false);
        setTimeout(release, 0);
        cur = panel;
      }, true);
    });
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
      var panel = { intervals: [], timers: [], raf: [], listeners: [], styles: [], exports: [], saved: {}, ready: [], dead: false };
      active = { key: key, panel: panel };
      stage.setAttribute('aria-busy', 'true');
      stage.appendChild(el('div', 'op-msg', 'Loading ' + tab[1] + '…'));

      fetchDoc(tab[2]).then(function (doc) {
        if (my !== token) return;
        /* The page's own wrapper is what its scripts look up (getElementById('app')), so it is kept, with
           its id and class, around the copied children. Without one, <main> is the content. A page with none of
           those marks its own content wrapper with data-omega-panel-root (honors, matrix, media). */
        var root = doc.querySelector('[data-omega-panel-root]') || doc.querySelector('#app') || doc.querySelector('.page-shell') || doc.querySelector('main');
        if (!root) throw new Error('no content');
        stage.textContent = '';
        var top = el('div', 'op-bar');
        var full = el('a', 'op-open', 'OPEN FULL PAGE \u2197');
        full.href = tab[2];
        top.appendChild(full);
        stage.appendChild(top);
        var ser = new XMLSerializer();
        var markup = ser.serializeToString(root);
        var holder = stage;
        if (root.id && !document.getElementById(root.id)) {
          holder = document.createElement(root.tagName.toLowerCase() === 'main' ? 'div' : root.tagName.toLowerCase());
          holder.id = root.id;
          if (root.className) holder.className = root.className;
          stage.appendChild(holder);
        }
        function isNav(n) {
          return n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'ASIDE' || n.tagName === 'STYLE' || n.tagName === 'LINK' || n.tagName === 'NOSCRIPT' || /^omega-/.test(n.id || '') || /\bomega-/.test(typeof n.className === 'string' ? n.className : ''));
        }
        Array.prototype.forEach.call(root.childNodes, function (n) {
          if (isNav(n)) return;
          holder.appendChild(document.importNode(n, true));
        });
        Array.prototype.forEach.call(stage.querySelectorAll('script'), function (s) { s.parentNode.removeChild(s); });
        /* Authored elements outside the wrapper -- modals, overlays, toasts -- are looked up by id too, and
           are position:fixed on the real page, so the stage is a fine home. Navigation and the host's own
           chrome (aside, omega-*) are left out, and so is anything that contains the wrapper. */
        Array.prototype.forEach.call(doc.body.children, function (m) {
          if (m === root || m.contains(root) || isNav(m) || m.classList.contains('shell')) return;
          if (m.getAttribute('id') && document.getElementById(m.getAttribute('id'))) return;
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
