/* ============================================================================
   SYD OMEGA 91717 — Content Uniqueness System v1.0
   Prevents duplicate pages, titles, purposes, and explanations.
   Non-destructive. Drop anywhere: <script src=omega-uniqueness.js></script>
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaUniqueness) return;
  window.__omegaUniqueness = true;

  const SEEN = {
    titles: new Set(),
    purposes: new Set(),
    subjects: new Set()
  };
  const VIOLATIONS = [];

  function checkPage() {
    const title = (document.title || '').trim();
    const h1 = document.querySelector('h1');
    const metaDesc = document.querySelector('meta[name=description]');
    const purpose = metaDesc ? metaDesc.content.trim() : '';
    const key = (location.pathname.split('/').pop() || 'index').replace(/\.html?$/i, '');
    const issues = [];

    if (title && SEEN.titles.has(title)) {
      issues.push({ type: 'TITLE', value: title, msg: 'Title already used by another page' });
    } else if (title) {
      SEEN.titles.add(title);
    }

    if (purpose && SEEN.purposes.has(purpose)) {
      issues.push({ type: 'PURPOSE', value: purpose, msg: 'Meta description duplicated' });
    } else if (purpose) {
      SEEN.purposes.add(purpose);
    }

    const bodyText = document.body ? document.body.innerText : '';
    const firstSentence = bodyText.split('.')[0].trim();
    if (firstSentence.length > 20 && SEEN.subjects.has(firstSentence)) {
      issues.push({
        type: 'SUBJECT',
        value: firstSentence.slice(0, 60) + '…',
        msg: 'Opening sentence duplicates another page'
      });
    } else if (firstSentence.length > 20) {
      SEEN.subjects.add(firstSentence);
    }

    if (issues.length) {
      VIOLATIONS.push({ page: key, issues });
      console.warn('[Ω UNIQUENESS]', key, issues);
    }

    document.dispatchEvent(new CustomEvent('omega:uniqueness-checked', {
      detail: { page: key, issues, passed: issues.length === 0 }
    }));
    return issues.length === 0;
  }

  function renderGuard(el) {
    if (!el) return;
    var issues = [];
    try {
      issues = JSON.parse(sessionStorage.getItem('omega:uniqueness:log') || '[]');
    } catch (e) {}

    var html = '<div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:8px>CONTENT UNIQUENESS GUARD</div>';
    if (issues.length === 0) {
      html += '<div style=font-family:var(--M);font-size:9px;color:var(--green)>✦ NO DUPLICATES DETECTED THIS SESSION</div>';
    } else {
      html += '<div style=font-family:var(--M);font-size:9px;color:var(--crim);margin-bottom:8px>● ' + issues.length + ' VIOLATION(S) LOGGED</div>';
      issues.forEach(function (v) {
        html += '<div style=margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(139,0,0,.1)><div style=font-family:var(--M);font-size:9px;color:var(--crim)>' + v.page + '</div>';
        v.issues.forEach(function (i) {
          html += '<div style=font-family:var(--M);font-size:7px;color:var(--muted);padding-left:8px>→ ' + i.type + ': ' + i.msg + '</div>';
        });
        html += '</div>';
      });
    }
    el.innerHTML = html;
  }

  window.OmegaUniqueness = {
    check: checkPage,
    violations: function () { return VIOLATIONS; },
    renderGuard: renderGuard,
    log: function () {
      var log = [];
      try {
        log = JSON.parse(sessionStorage.getItem('omega:uniqueness:log') || '[]');
      } catch (e) {}
      var key = (location.pathname.split('/').pop() || 'index').replace(/\.html?$/i, '');
      var v = VIOLATIONS.find(function (x) { return x.page === key; });
      if (v) log.push(v);
      sessionStorage.setItem('omega:uniqueness:log', JSON.stringify(log.slice(-20)));
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    checkPage();
    window.OmegaUniqueness.log();
    var guard = document.querySelector('[data-omega-uniqueness]');
    if (guard) renderGuard(guard);
  });
})();
