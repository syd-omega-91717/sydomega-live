/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-shell.js
   ASYNC REGION SHELL — loading · empty · error · retry

   WHY THIS EXISTS
   ---------------
   Audit finding F-6/Session 4: across 105 pages, regions that fetch from
   Supabase render nothing while waiting and nothing on failure. To a member on
   a slow connection, a working page and a broken page look identical — both are
   blank. When Supabase is unreachable the entire platform silently shows empty
   containers with no explanation and no way to retry.

   This module gives every async region the four states it must have, with one
   call, without touching page markup beyond a single attribute.

   USAGE — declarative (preferred)
   -------------------------------
     <section data-omega-async="recent-dispatches"
              data-omega-empty="No dispatches yet."></section>

     OmegaShell.bind('recent-dispatches', {
       load:   async () => (await sb.from('dispatches')
                              .select('*').limit(20)).data,
       render: (rows, el) => { el.innerHTML = rows.map(rowHtml).join(''); },
       isEmpty: rows => !rows || rows.length === 0
     });

   USAGE — imperative
   ------------------
     const region = OmegaShell.region(document.querySelector('#panel'));
     region.loading();
     try   { region.done(); render(data); }
     catch (e) { region.error(e, retryFn); }

   GUARANTEES
   ----------
   * No dependencies. Plain script, matches the rest of the codebase.
   * Idempotent — safe if bg.js injects it twice.
   * Accessible: aria-busy during load, role="status" for empty,
     role="alert" for errors, focus moved to the retry control on failure.
   * Honours prefers-reduced-motion (no spinner animation when set).
   * Never swallows an error. Everything is also logged to the console and,
     if omega-telemetry.js is present, reported to it.
   * If load() throws, existing rendered content is preserved when available —
     a stale list beats an empty page.
   ========================================================================== */

(function () {
  'use strict';

  if (window.OmegaShell) return;                       // idempotent

  /* ---------------------------------------------------------------- styles */
  var CSS = [
    '.omega-shell-state{display:flex;flex-direction:column;align-items:center;',
    'justify-content:center;gap:.75rem;padding:2rem 1rem;text-align:center;',
    'min-height:120px;font:inherit;color:currentColor;opacity:.85}',
    '.omega-shell-spinner{width:28px;height:28px;border-radius:50%;',
    'border:2px solid currentColor;border-top-color:transparent;',
    'animation:omega-shell-spin .8s linear infinite;opacity:.6}',
    '@keyframes omega-shell-spin{to{transform:rotate(360deg)}}',
    '@media (prefers-reduced-motion:reduce){',
    '.omega-shell-spinner{animation:none;border-top-color:currentColor;opacity:.35}}',
    '.omega-shell-msg{font-size:.9rem;line-height:1.5;max-width:38ch;margin:0}',
    '.omega-shell-detail{font-size:.75rem;opacity:.6;max-width:52ch;margin:0;',
    'word-break:break-word}',
    '.omega-shell-retry{cursor:pointer;border:1px solid currentColor;',
    'background:transparent;color:inherit;border-radius:6px;',
    'padding:.45rem 1.1rem;font:inherit;font-size:.85rem;opacity:.9}',
    '.omega-shell-retry:hover{opacity:1}',
    '.omega-shell-retry:focus-visible{outline:2px solid currentColor;',
    'outline-offset:2px}'
  ].join('');

  function injectCss() {
    if (document.getElementById('omega-shell-css')) return;
    var s = document.createElement('style');
    s.id = 'omega-shell-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ------------------------------------------------------------- utilities */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function report(kind, detail) {
    try {
      if (window.OmegaTelemetry && typeof window.OmegaTelemetry.track === 'function') {
        window.OmegaTelemetry.track('shell_' + kind, detail);
      }
    } catch (_) { /* telemetry must never break the page */ }
  }

  /* Human-readable message from a Supabase / fetch / generic error.
     Never surfaces raw stack traces to members — those go to the console. */
  function humanise(err) {
    if (!err) return 'Something went wrong.';
    var msg = (err.message || String(err)).toLowerCase();

    if (msg.indexOf('failed to fetch') > -1 ||
        msg.indexOf('networkerror') > -1 ||
        msg.indexOf('load failed') > -1) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    if (err.code === 'PGRST301' || msg.indexOf('jwt') > -1 ||
        msg.indexOf('expired') > -1) {
      return 'Your session has expired. Please sign in again.';
    }
    if (err.code === '42501' || msg.indexOf('permission denied') > -1 ||
        msg.indexOf('row-level security') > -1 ||
        msg.indexOf('violates row-level') > -1) {
      return 'You do not have access to this content.';
    }
    if (err.code === '42P01' || msg.indexOf('does not exist') > -1) {
      return 'This section is not available yet.';
    }
    return 'Something went wrong loading this section.';
  }

  /* ---------------------------------------------------------------- region */
  function Region(node, opts) {
    this.node = node;
    this.opts = opts || {};
    this._prev = null;
    injectCss();
  }

  Region.prototype._swap = function (stateNode, busy) {
    // Preserve real content the first time we replace it, so a failed refresh
    // can fall back to stale data rather than a blank panel.
    if (this._prev === null && !this.node.querySelector('.omega-shell-state')) {
      this._prev = this.node.innerHTML;
    }
    this.node.setAttribute('aria-busy', busy ? 'true' : 'false');
    this.node.innerHTML = '';
    this.node.appendChild(stateNode);
  };

  Region.prototype.loading = function (message) {
    var box = el('div', 'omega-shell-state');
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    box.appendChild(el('div', 'omega-shell-spinner'));
    box.appendChild(el('p', 'omega-shell-msg',
      message || this.opts.loadingText || 'Loading…'));
    this._swap(box, true);
    return this;
  };

  Region.prototype.empty = function (message) {
    var box = el('div', 'omega-shell-state');
    box.setAttribute('role', 'status');
    box.appendChild(el('p', 'omega-shell-msg',
      message ||
      this.node.getAttribute('data-omega-empty') ||
      this.opts.emptyText ||
      'Nothing here yet.'));
    this._swap(box, false);
    report('empty', { region: this.node.id || this.node.className });
    return this;
  };

  Region.prototype.error = function (err, retry) {
    console.error('[OmegaShell]', this.node.id || this.node, err);
    report('error', {
      region: this.node.id || this.node.className,
      code: err && err.code
    });

    var box = el('div', 'omega-shell-state');
    box.setAttribute('role', 'alert');
    box.appendChild(el('p', 'omega-shell-msg', humanise(err)));

    // Expose only a stable provider error code, never a raw provider message,
    // URL, query, stack trace, or other implementation detail to members.
    if (err && err.code) {
      box.appendChild(el('p', 'omega-shell-detail', String(err.code)));
    }

    if (typeof retry === 'function') {
      var btn = el('button', 'omega-shell-retry', 'Try again');
      btn.type = 'button';
      btn.addEventListener('click', function () { retry(); });
      box.appendChild(btn);

      // Preserve the last successful content when an async refresh fails.
      // The error state is appended after it, rather than replacing it.
      if (this._prev !== null) {
        this.restore();
        this.node.appendChild(box);
        this.node.setAttribute('aria-busy', 'false');
      } else {
        this._swap(box, false);
      }
      try { btn.focus({ preventScroll: true }); } catch (_) { btn.focus(); }
    } else if (this._prev !== null) {
      this.restore();
      this.node.appendChild(box);
      this.node.setAttribute('aria-busy', 'false');
    } else {
      this._swap(box, false);
    }
    return this;
  };

  Region.prototype.done = function () {
    this.node.setAttribute('aria-busy', 'false');
    var s = this.node.querySelector('.omega-shell-state');
    if (s) s.remove();
    return this;
  };

  /* Restore whatever was in the region before the first state swap. */
  Region.prototype.restore = function () {
    if (this._prev !== null) {
      this.node.innerHTML = this._prev;
      this.node.setAttribute('aria-busy', 'false');
    }
    return this;
  };

  /* ------------------------------------------------------------------- api */
  var API = {
    region: function (node, opts) {
      if (typeof node === 'string') {
        node = document.querySelector(node) ||
               document.querySelector('[data-omega-async="' + node + '"]');
      }
      if (!node) return null;
      return new Region(node, opts);
    },

    /* Full lifecycle: loading -> render | empty | error(+retry).
       Returns a promise that always resolves, never rejects — a failed region
       must not break the rest of the page's boot sequence. */
    bind: function (selector, cfg) {
      var r = API.region(selector, cfg);
      if (!r) {
        console.warn('[OmegaShell] region not found:', selector);
        return Promise.resolve(null);
      }
      cfg = cfg || {};

      function run() {
        r.loading();
        return Promise.resolve()
          .then(function () { return cfg.load(); })
          .then(function (data) {
            var isEmpty = cfg.isEmpty
              ? cfg.isEmpty(data)
              : (data == null || (Array.isArray(data) && data.length === 0));
            if (isEmpty) { r.empty(); return null; }
            r.done();
            if (cfg.render) cfg.render(data, r.node);
            return data;
          })
          .catch(function (e) {
            if (cfg.keepStaleOnError) { r.restore(); console.error(e); }
            else { r.error(e, run); }
            return null;
          });
      }
      return run();
    },

    /* Attach to every [data-omega-async] node that has a registered loader.
       Loaders are registered by pages via OmegaShell.register(name, cfg). */
    _loaders: {},
    register: function (name, cfg) {
      API._loaders[name] = cfg;
      var node = document.querySelector('[data-omega-async="' + name + '"]');
      if (node) API.bind(node, cfg);
      return API;
    },

    /* Global connectivity notice — one banner, not 20 broken panels. */
    offlineWatch: function () {
      function banner(show) {
        var id = 'omega-shell-offline';
        var existing = document.getElementById(id);
        if (!show) { if (existing) existing.remove(); return; }
        if (existing) return;
        var b = el('div', null, 'You are offline. Some content may be out of date.');
        b.id = id;
        b.setAttribute('role', 'status');
        b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;' +
          'padding:.6rem 1rem;text-align:center;font-size:.85rem;' +
          'background:rgba(0,0,0,.85);color:#fff';
        document.body.appendChild(b);
      }
      window.addEventListener('offline', function () { banner(true); });
      window.addEventListener('online', function () { banner(false); });
      if (!navigator.onLine) banner(true);
      return API;
    }
  };

  window.OmegaShell = API;

  function boot() {
    injectCss();
    API.offlineWatch();
    // Bind any regions whose loaders were registered before DOM ready.
    Object.keys(API._loaders).forEach(function (name) {
      var node = document.querySelector('[data-omega-async="' + name + '"]');
      if (node && !node.hasAttribute('aria-busy')) {
        API.bind(node, API._loaders[name]);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
