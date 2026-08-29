/* ============================================================================
   SYD OMEGA 91717 -- DATA GUARD (UI layer)
   A page that is WAITING on data must never look identical to a page that has
   finished loading nothing.

   THE BUG THIS EXISTS FOR. Every gated page paints static placeholders ("--",
   empty tables, zeroed KPIs) and replaces them once a query resolves. If the
   query never resolves -- slow network, blocked host, offline device, a 5xx --
   the placeholders simply stay. No spinner clears, because none was shown; no
   error appears, because Supabase resolves to {data:null,error} rather than
   throwing, so the bare try/catch blocks these pages use catch nothing
   (CLAUDE.md 8.1 class 1). The member sees a page "buffering" forever with no
   way to tell whether it is broken or genuinely empty.

   SPLIT. The fetch wrapper is NOT here -- it is inline at the top of bg.js, so
   it installs during head parse, before any `<script type="module">` issues
   its first queries. A dynamically injected script is async by default and
   would miss exactly those. This file is the UI half: it reads
   window.__omegaData and listens for `omega:fetch-settled`.

     * a backend request still in flight after STALL_MS -> "CONNECTION SLOW"
     * a request that rejects or returns >=500          -> "DATA DID NOT LOAD"
     * the next successful request                      -> clears both

   It renders through the #omega-toasts / .omega-toast contract already defined
   in bg.js's stylesheet, which until now nothing in the repo ever built -- the
   CSS was there and no code created the container.

   Deliberately NOT done:
     * No auto-reload -- a silent reload mid-edit loses whatever was typed. The
       retry is a button the member presses.
     * No per-page placeholder scraping -- guessing which "--" means "loading"
       and which means "genuinely zero" raises false alarms on healthy pages.
       The network is the only source of truth about whether data is coming.
     * No alarm for an empty result set. Empty is a valid answer.
   ========================================================================== */
(function () {
  'use strict';
  if (window.__omegaDataGuard) return;
  window.__omegaDataGuard = 1;

  var STALL_MS = 9000;   /* slower than any healthy query, faster than a member gives up */
  var TICK_MS  = 1000;

  var state = '';        /* '' | 'slow' | 'failed' */
  var W = window.__omegaData;
  if (!W) return;        /* bg.js recorder absent: nothing to report on */

  /* ---- UI -------------------------------------------------------------- */
  function stack() {
    var s = document.getElementById('omega-toasts');
    if (!s) {
      s = document.createElement('div');
      s.id = 'omega-toasts';
      s.setAttribute('role', 'status');
      s.setAttribute('aria-live', 'polite');
      (document.body || document.documentElement).appendChild(s);
    }
    return s;
  }

  function clearNote() {
    state = '';
    var n = document.getElementById('omega-dataguard-note');
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function note(kind, text) {
    if (state === kind || !document.body) return;   /* never stack duplicates */
    clearNote();
    state = kind;

    var el = document.createElement('div');
    el.id = 'omega-dataguard-note';
    el.className = 'omega-toast in' + (kind === 'failed' ? ' crim' : ' cyan');
    /* #omega-toasts is pointer-events:none in bg.js -- correct for passive
       notifications, fatal for this one. Without this the RETRY button renders
       perfectly and cannot be clicked: a hit-test at its own centre returns
       whatever is underneath (#galaxy-canvas on the dashboard). Re-enabled on
       this note only, so the shared stack keeps passing clicks through. */
    el.style.pointerEvents = 'auto';

    var label = document.createElement('span');
    label.textContent = text;
    el.appendChild(label);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'RETRY';
    btn.setAttribute('aria-label', 'Reload this page and try loading the data again');
    btn.style.cssText = 'margin-left:10px;font:inherit;letter-spacing:1px;cursor:pointer;' +
      'background:rgba(0,0,0,.28);color:inherit;border:1px solid currentColor;' +
      'border-radius:4px;padding:2px 8px;min-height:24px';
    btn.addEventListener('click', function () { location.reload(); });
    el.appendChild(btn);

    stack().appendChild(el);
    try {
      document.dispatchEvent(new CustomEvent('omega:data-' + kind, { detail: { text: text } }));
    } catch (e) {}
  }

  /* ---- watch ------------------------------------------------------------ */
  var seenFailed = W.failed;

  setInterval(function () {
    if (W.failed > seenFailed) {
      seenFailed = W.failed;
      note('failed', 'DATA DID NOT LOAD - CHECK CONNECTION');
      return;
    }
    if (state === 'failed') return;      /* a real failure outranks "slow" */
    if (W.inflight > 0 && W.firstAt && (Date.now() - W.firstAt) > STALL_MS) {
      note('slow', 'CONNECTION SLOW - DATA STILL LOADING');
    } else if (state === 'slow' && W.inflight === 0) {
      clearNote();
    }
  }, TICK_MS);

  document.addEventListener('omega:fetch-settled', function (e) {
    if (e && e.detail && e.detail.ok && state) clearNote();
  });

  /* An offline device produces the same member-visible symptom, and the
     browser says so directly rather than making us wait out STALL_MS. */
  window.addEventListener('offline', function () { note('failed', 'OFFLINE - DATA CANNOT LOAD'); });
  window.addEventListener('online', function () { if (state === 'failed') clearNote(); });
})();
