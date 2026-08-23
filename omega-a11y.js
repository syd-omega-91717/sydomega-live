/* ==========================================================================
   Ω SYD OMEGA 91717 — ACCESSIBILITY ENGINE (omega-a11y.js)
   WCAG 2.1 AA compliance layer, injected globally via bg.js.

   A. SKIP NAVIGATION LINK — "Skip to main content" appears on Tab press.
      Resolves the content region via resolveMain() below, gives it
      tabindex="-1" and focuses it explicitly, so activating the link really
      moves keyboard focus instead of only scrolling.
   B. FOCUS TRAP MANAGER — exported OmegaA11y.trapFocus(el) / .releaseFocus()
      for modals/overlays. Used by omega-keyboard.js help overlay, copilot, etc.
   C. LIVE REGION ANNOUNCER — OmegaA11y.announce(msg, priority) for screen readers.
      Used by omega-sdt.js gate celebrations, omega-notify.js toasts, etc.
   D. LANDMARK ARIA — ensures every page has at least one <main> landmark,
      promoting the resolveMain() content region when the page has none.
      Never promotes a container that holds the sidebar.
   E. FORM LABEL AUDIT — names unlabelled <input>/<select>/<textarea>. Prefers
      associating an existing <label> that has no for= attribute (the common
      case here: the label is written and visible but not wired up), then
      placeholder, then a <select>'s first <option> only when it reads as a
      prompt rather than a value.
   F. MOTION PREFERENCE CSS — reinforce prefers-reduced-motion at the CSS layer,
      scoped to omega-* classes so it cannot accidentally undo page styles.
   ========================================================================== */
(function(){
  'use strict';
  if(window.__omegaA11yActive) return;
  window.__omegaA11yActive = true;

  /* ── SHARED CONTENT-REGION RESOLVER ─────────────────────────────────────
     Sections A and D both need "the element that holds this page's content,
     excluding the sidebar", and both previously resolved it themselves with
     the same too-narrow list (main, .main, #app). On the ~100 pages built as

         <div class="shell">
           <aside id="omega-side">…</aside>
           <div style="flex:1;min-width:0">…content…</div>

     none of those three selectors match anything, so BOTH sections silently
     did nothing: the skip link kept its default href="#omega-main-content"
     pointing at an element that was never created (a dead fragment link --
     verified on matrix.html, media.html and terms.html), and those same
     pages ended up with zero <main>/[role=main] landmarks despite this
     module's own header promising "ensures every page has at least one".
     The content region there is the aside's next element sibling, which is
     the last candidate below.

     Every candidate is rejected if it CONTAINS the sidebar: .shell wraps the
     aside and the content together, so promoting it to role="main" would put
     the whole navigation inside the main landmark -- worse for a screen
     reader than having no landmark at all. */
  /* Tags that are never a content region. The sibling walk below needs this
     because several pages (404.html, pending.html) put a decorative
     full-bleed <canvas> immediately after the aside -- taking the first
     sibling blindly pointed the skip link at that canvas and, worse, put
     role="main" on it, so a screen reader would announce an empty canvas as
     the page's main landmark. */
  var NOT_CONTENT = /^(CANVAS|SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE|SVG|VIDEO|AUDIO|IFRAME|BR|HR)$/;

  function resolveMain(){
    var side = document.getElementById('omega-side');
    function usable(el){
      if(!el || el === document.body || el === document.documentElement) return false;
      if(side && el.contains(side)) return false;
      if(NOT_CONTENT.test(el.tagName)) return false;
      if(el.getAttribute('aria-hidden') === 'true') return false;
      return true;
    }
    var cands = [
      document.getElementById('main-content'),
      document.getElementById('omega-main-content'),
      document.querySelector('main'),
      document.getElementById('app'),
      document.querySelector('.page-shell'),
      document.querySelector('.main')
    ];
    for(var i=0;i<cands.length;i++){ if(usable(cands[i])) return cands[i]; }
    /* last resort: first real element after the sidebar, skipping decoration */
    var n = side ? side.nextElementSibling : null;
    while(n){ if(usable(n)) return n; n = n.nextElementSibling; }
    return null;
  }

  /* ── A. SKIP NAVIGATION LINK ────────────────────────────────────────── */
  (function(){
    if(document.getElementById('omega-skip')) return;
    var skip = document.createElement('a');
    skip.id = 'omega-skip';
    skip.href = '#omega-main-content';
    skip.textContent = 'Skip to main content';
    skip.style.cssText = [
      'position:fixed;top:-100px;left:8px;z-index:99999;',
      'background:#0A0A0F;color:#C9A84C;',
      'font-family:"Courier Prime",monospace;font-size:11px;letter-spacing:2px;',
      'padding:8px 16px;border:1px solid rgba(201,168,76,.4);border-radius:2px;',
      'text-decoration:none;',
      'transition:top .2s ease',
    ].join('');
    skip.addEventListener('focus', function(){ skip.style.top='8px'; });
    skip.addEventListener('blur',  function(){ skip.style.top='-100px'; });

    function attach(){
      if(!document.body) { requestAnimationFrame(attach); return; }
      document.body.insertBefore(skip, document.body.firstChild);
    }
    attach();

    /* Ensure the target exists, is focusable, and is what the link points at.
       tabindex="-1" is the part that makes a skip link actually work: a
       <div>/<main> is not focusable by default, so following the fragment
       scrolled the page but left focus on <body> -- measured on every page
       tested, focus after activating the link was BODY, meaning the next Tab
       restarted at the top of the document and walked straight back into the
       ~15-section sidebar dock the link exists to skip. The explicit
       .focus() call is needed for the same reason: fragment navigation alone
       does not reliably focus a programmatically-focusable container. */
    function ensureTarget(){
      var main = resolveMain();
      if(!main) return;
      if(!main.id) main.id = 'omega-main-content';
      if(!main.hasAttribute('tabindex')) main.setAttribute('tabindex','-1');
      skip.href = '#' + main.id;
    }
    skip.addEventListener('click', function(e){
      var t = document.getElementById(skip.getAttribute('href').slice(1));
      if(!t) return;
      e.preventDefault();
      t.focus();
      if(t.scrollIntoView) t.scrollIntoView({block:'start'});
    });
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', ensureTarget);
    } else { ensureTarget(); }
  })();

  /* ── B. FOCUS TRAP ──────────────────────────────────────────────────── */
  var _trapEl = null;
  var _trapPrev = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function trapFocus(el){
    if(!el) return;
    releaseFocus();
    _trapEl = el;
    _trapPrev = document.activeElement;
    var focusable = Array.from(el.querySelectorAll(FOCUSABLE));
    if(!focusable.length) return;
    focusable[0].focus();
    el.addEventListener('keydown', _trapHandler);
  }

  function _trapHandler(e){
    if(e.key !== 'Tab') return;
    var focusable = Array.from(_trapEl.querySelectorAll(FOCUSABLE));
    if(!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length-1];
    if(e.shiftKey){
      if(document.activeElement === first){ e.preventDefault(); last.focus(); }
    } else {
      if(document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }

  function releaseFocus(){
    if(_trapEl){ _trapEl.removeEventListener('keydown', _trapHandler); _trapEl = null; }
    if(_trapPrev){ try{ _trapPrev.focus(); }catch(e){} _trapPrev = null; }
  }

  /* ── C. LIVE REGION ANNOUNCER ───────────────────────────────────────── */
  var _politeRegion = null, _assertiveRegion = null;
  function getRegion(priority){
    if(priority === 'assertive'){
      if(!_assertiveRegion){
        _assertiveRegion = document.createElement('div');
        _assertiveRegion.setAttribute('role','alert');
        _assertiveRegion.setAttribute('aria-live','assertive');
        _assertiveRegion.setAttribute('aria-atomic','true');
        _assertiveRegion.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
        document.body.appendChild(_assertiveRegion);
      }
      return _assertiveRegion;
    }
    if(!_politeRegion){
      _politeRegion = document.createElement('div');
      _politeRegion.setAttribute('role','status');
      _politeRegion.setAttribute('aria-live','polite');
      _politeRegion.setAttribute('aria-atomic','true');
      _politeRegion.style.cssText='position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
      document.body.appendChild(_politeRegion);
    }
    return _politeRegion;
  }

  function announce(msg, priority){
    if(!msg) return;
    var region = getRegion(priority||'polite');
    /* Clear and re-set forces a re-announcement */
    region.textContent = '';
    setTimeout(function(){ region.textContent = String(msg); }, 50);
  }

  /* ── D2. PAGE HEADING ─────────────────────────────────────────────────
     160 of 178 pages have no <h1> at all, so a screen-reader user gets no
     level-1 heading to orient on and heading-navigation ("jump to the page
     title") lands nowhere. 152 of those 160 already render a perfectly good
     title in the topbar -- "ANALYTICS", "BLOODLINE", "SOVEREIGN ACADEMY ·
     EXAMS" -- it is simply marked up as a <div class="t">, which carries no
     semantics.

     Promoting that existing element with role="heading" aria-level="1" is
     preferable to injecting a hidden <h1>: it names the heading with the
     title the user can actually see, and it adds no duplicate text for a
     screen reader to read twice. Nothing visual changes -- ARIA roles carry
     no styling.

     Deliberately skipped when: the page already has a real <h1> (18 do); the
     element already carries a role the page set itself; or the title text is
     empty once the nested <small> subtitle is discounted (8 pages, mostly
     ones with no topbar at all -- dashboard.html, terms.html, 404.html --
     where there is no honest title to promote and inventing one from
     document.title would announce the same generic "Command Bridge" string on
     several unrelated pages). */
  (function(){
    function ensureHeading(){
      if(document.querySelector('h1,[role="heading"][aria-level="1"]')) return;
      var t = document.querySelector('.topbar .t, .topbar .topbar-title, .topbar-title');
      if(!t || t.getAttribute('role')) return;
      /* judge on the title text alone, ignoring the subtitle <small> */
      var probe = t.cloneNode(true);
      var subs = probe.querySelectorAll('small,.topbar-sub');
      for(var i=0;i<subs.length;i++) subs[i].parentNode.removeChild(subs[i]);
      if(!(probe.textContent || '').trim()) return;
      t.setAttribute('role','heading');
      t.setAttribute('aria-level','1');
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', ensureHeading);
    } else { ensureHeading(); }
    /* topbars are injected by bg.js on some pages, so re-check once populated */
    document.addEventListener('omega:populated', ensureHeading);
  })();

  /* ── D3. TABLE SEMANTICS ───────────────────────────────────────────────
     The shared .tbl-wrap/.tbl-head/.tbl-row system is plain display:grid
     divs with no table semantics at all -- measured, only 1 of the 38 pages
     using it sets role="table". So every data table on this platform reaches
     a screen reader as an undifferentiated run of text: no row or column
     structure, and no association between a .tbl-hcell header and the cells
     beneath it. That is the accessibility cost of converting the pages off
     native <table> markup, which the conversion never accounted for.

     Applying roles centrally is the fix, but a MALFORMED aria table is worse
     than none -- a screen reader can drop content that sits inside a table
     without a valid row/cell ancestry. So this is deliberately conservative:
     it computes the whole role assignment first, and if anything about the
     instance is ambiguous it applies NOTHING to that instance and leaves it
     as plain text. Two real shapes force that (both measured across the 43
     .tbl-wrap instances in this repo):

       - In 17 of 43, rows are injected into an intermediate unclassed <div>
         (e.g. <div id="anomalyTable">), so .tbl-row is a GRANDCHILD of
         .tbl-wrap. ARIA requires rows to descend from a table or rowgroup,
         so each such container is marked role="rowgroup".
       - 4 instances have a .tbl-row with no element children -- an
         empty-state placeholder holding bare text. A row with no cells can
         swallow its own text, so any instance containing one is skipped.

     Likewise skipped: a .tbl-wrap whose direct children are not all rows or
     row-containers (a search box or footer inside the wrapper would be
     content stranded in a table), and any element that already carries a
     page-set role. */
  (function(){
    function assignTableRoles(){
      document.querySelectorAll('.tbl-wrap').forEach(function(wrap){
        if(wrap.getAttribute('role')) return;              /* page set its own */

        var rows = wrap.querySelectorAll('.tbl-row, .tbl-head');
        if(!rows.length) return;                            /* not a table */

        var i, j, plan = [], groups = [];

        for(i = 0; i < rows.length; i++){
          var row = rows[i];
          if(row.getAttribute('role')) return;              /* already roled */
          if(!row.children.length) return;                  /* cell-less row */
          /* every element between the row and the wrapper is a rowgroup */
          var p = row.parentElement;
          while(p && p !== wrap){
            if(p.getAttribute('role')) return;
            if(groups.indexOf(p) === -1) groups.push(p);
            p = p.parentElement;
          }
          if(!p) return;                                    /* detached */
          var cellRole = row.classList.contains('tbl-head') ? 'columnheader' : 'cell';
          for(j = 0; j < row.children.length; j++){
            if(row.children[j].getAttribute('role')) return;
            plan.push([row.children[j], cellRole]);
          }
          plan.push([row, 'row']);
        }

        /* every direct child of the wrapper must end up a row or a rowgroup,
           or there is non-table content stranded inside role="table" */
        for(i = 0; i < wrap.children.length; i++){
          var kid = wrap.children[i];
          var ok = kid.classList.contains('tbl-row') ||
                   kid.classList.contains('tbl-head') ||
                   groups.indexOf(kid) !== -1;
          if(!ok) return;
        }

        for(i = 0; i < groups.length; i++) groups[i].setAttribute('role','rowgroup');
        for(i = 0; i < plan.length; i++) plan[i][0].setAttribute('role', plan[i][1]);
        wrap.setAttribute('role','table');
      });
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', assignTableRoles);
    } else { assignTableRoles(); }
    /* rows are usually rendered from data, so re-run once the page populates */
    document.addEventListener('omega:populated', assignTableRoles);
  })();

  /* ── D. LANDMARK ARIA ───────────────────────────────────────────────── */
  (function(){
    function ensureLandmark(){
      /* If no <main> or [role=main] exists, promote the content region.
         Uses the shared resolver so the ~100 pages whose content is the
         sidebar's next sibling (no #app, no .main) are covered too -- they
         were the pages left with zero landmarks by the old #app/.main-only
         lookup. The resolver's sidebar-containment guard is what keeps
         .shell from being promoted and swallowing the nav. */
      if(document.querySelector('main,[role="main"]')) return;
      var app = resolveMain();
      if(app && app.tagName !== 'MAIN' && !app.getAttribute('role')){
        app.setAttribute('role','main');
      }
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', ensureLandmark);
    } else { ensureLandmark(); }
  })();

  /* ── E. FORM LABEL AUDIT ──────────────────────────────────────────────
     Rewritten. The previous version had three problems:

       1. It only queried <input>. A crawl of all 178 pages found 177 controls
          with no accessible name, and most are <select> dropdowns
          (p-cat, filter-type, af-rel …) which were never even looked at.
       2. Its fallback chain ended in `input.type`, producing
          aria-label="text" / "number" / "date" -- a screen reader then reads
          that out IN PLACE OF a name, which is worse than staying silent.
       3. It ignored the best source available. 111 of those 177 controls sit
          right next to a real <label> the page author already wrote
          ("CATEGORY", "TIER", "COMMISSION RATE (%)") that simply has no
          for= attribute and does not wrap the control -- so it looks correct
          on screen while being purely decorative to assistive tech.

     Associating that existing label recovers the author's own wording instead
     of inventing one, and because it is a real for=/id association the name
     stays correct if the page later rewrites the label text.

     A <select>'s first <option> is used only when it reads like a PROMPT
     ("Select a trigger...", "ALL TYPES", "-- choose --"). Most first options
     are real values ("Knowledge", "Self", "1 - Individual"), and naming a
     category dropdown "Knowledge" actively misleads, so those are left
     unnamed rather than mislabelled. */
  var _ctlSeq = 0;

  /* An element that is, or contains, one of these is never a label source --
     a preceding <select>'s textContent is its entire option list, which would
     have named bloodline.html's control "SelfParentGrandparent…". */
  var LABEL_DISQUALIFY = 'input,select,textarea,button,a';

  function looksLikePrompt(s){
    return /^(select|choose|pick|all|any|none)\b/i.test(s) ||
           /(\.\.\.|…)$/.test(s) ||
           /^\s*[-–—]{2,}/.test(s);
  }

  /* Returns {label:<el>} to associate, or {text:'…'} for an aria-label, or null. */
  function nameSourceFor(el){
    /* 1. an existing <label> with no for=, preceding the control in its parent */
    var n = el.previousElementSibling, orphan = null;
    while(n){
      if(n.tagName === 'LABEL' && !n.getAttribute('for')){ orphan = n; break; }
      n = n.previousElementSibling;
    }
    /* or the single unassociated label in the control's immediate container */
    if(!orphan && el.parentElement){
      var ls = el.parentElement.querySelectorAll(':scope > label:not([for])');
      if(ls.length === 1) orphan = ls[0];
    }
    if(orphan && (orphan.textContent || '').trim()) return { label: orphan };

    /* 2. a visible label the author wrote in something other than <label> --
          <div class="b-label">DATE</div>, <div class="n-label">STRENGTH (1-5)</div>,
          a bare <div>SEVERITY (1-5)</div>. 46 controls across these pages are
          named this way and nothing else can reach them.

          Returned as {describedBy:el} so the caller wires aria-labelledby
          rather than copying the string. That matters: mirror.html's slider
          labels hold the label AND the live value in one element
          ("ENERGY LEVEL" + "5"), so a copied aria-label would freeze at
          whatever the value was on page load and then lie every time the
          member moves the slider. aria-labelledby re-reads the element, so
          the name follows the value.

          The guards below are what keep this from inventing wrong labels --
          each rejects a real case seen while measuring: a preceding <select>
          whose "text" is its whole option list (bloodline.html), a multi-line
          block of prose, and a full sentence. */
    var sib = el.previousElementSibling;
    while(sib){
      if(sib.matches && (sib.matches(LABEL_DISQUALIFY) || sib.querySelector(LABEL_DISQUALIFY))) break;
      var st = (sib.textContent || '').trim();
      if(st){
        if(st.length <= 40 && !/[\n\r]/.test(st) && !/[.!?]$/.test(st)) return { describedBy: sib };
        break;
      }
      sib = sib.previousElementSibling;
    }

    /* 3. placeholder */
    var ph = (el.getAttribute('placeholder') || '').trim();
    if(ph) return { text: ph };

    /* 3. a select whose first option is a prompt rather than a value */
    if(el.tagName === 'SELECT' && el.options && el.options.length){
      var o = (el.options[0].textContent || '').trim();
      if(o && looksLikePrompt(o)) return { text: o };
    }
    return null;
  }

  function auditLabels(){
    var sel = 'input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea';
    document.querySelectorAll(sel).forEach(function(el){
      /* already named -- .labels covers <label for=> and wrapping <label> */
      if(el.labels && el.labels.length) return;
      if(el.getAttribute('aria-label')) return;
      if(el.getAttribute('aria-labelledby')) return;
      if(el.closest && el.closest('label')) return;

      var src = nameSourceFor(el);
      if(!src) return;

      if(src.label){
        if(!el.id) el.id = 'omega-ctl-' + (++_ctlSeq);
        src.label.setAttribute('for', el.id);
        /* now el.labels is non-empty, so re-running this audit is a no-op */
      } else if(src.describedBy){
        /* reference the element, don't copy its text -- see nameSourceFor */
        if(!src.describedBy.id) src.describedBy.id = 'omega-lbl-' + (++_ctlSeq);
        el.setAttribute('aria-labelledby', src.describedBy.id);
      } else {
        el.setAttribute('aria-label', src.text);
      }
      if(window.__omegaDevMode){
        console.warn('[OmegaA11y] named an unlabelled control:',
                     src.label ? src.label.textContent.trim()
                       : src.describedBy ? src.describedBy.textContent.trim()
                       : src.text, el);
      }
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', auditLabels);
  } else { auditLabels(); }
  document.addEventListener('omega:populated', auditLabels);

  /* ── F. MOTION PREFERENCE CSS ───────────────────────────────────────── */
  (function(){
    if(document.getElementById('omega-a11y-motion')) return;
    var s = document.createElement('style');
    s.id = 'omega-a11y-motion';
    s.textContent = [
      '@media(prefers-reduced-motion:reduce){',
      '.chip-dot{animation:none!important}',
      '.omega-shell-spinner{animation:none!important;border-top-color:currentColor;opacity:.35}',
      '#omega-bg{display:none!important}',   /* hide particle canvas */
      '.omega-shimmer{animation:none!important}',
      '}',
    ].join('');
    (document.head||document.documentElement).appendChild(s);
  })();

  /* ── PUBLIC API ──────────────────────────────────────────────────────── */
  window.OmegaA11y = {
    trapFocus:    trapFocus,
    releaseFocus: releaseFocus,
    announce:     announce,
    auditLabels:  auditLabels,
  };
})();
