/* Ω WCAG AAA Enhancement - Beyond AA compliance
   Purpose: Ensure maximum accessibility for all users including those with disabilities */

(function(){
  if(window.__omegaWCAGAAA) return;
  window.__omegaWCAGAAA = true;

  // Enhanced focus indicators (AAA requirement: 3:1 contrast minimum)
  const focusStyle = document.createElement('style');
  focusStyle.textContent = `
    :focus-visible {
      outline: 3px solid var(--gold) !important;
      outline-offset: 2px !important;
    }
    button:focus-visible, a:focus-visible, input:focus-visible {
      box-shadow: 0 0 0 3px rgba(201,168,76,0.3) !important;
    }
    /* High contrast mode support */
    @media (prefers-contrast: more) {
      :root {
        --focus-outline: 4px;
        --focus-offset: 3px;
      }
    }
    /* Dark mode detection */
    @media (prefers-color-scheme: dark) {
      /* AAA colors already applied via theme.js */
    }
  `;
  document.head.appendChild(focusStyle);

  /* The skip link lives in omega-a11y.js, which OWNS it. This module used to
     inject a second one and the two never knew about each other: omega-a11y.js
     guards on its own `#omega-skip` id, and the copy here had no guard at all.
     Measured across 16 pages -- 36 skip links, 12 pointing at a target that does
     not exist, because this copy hardcoded href="#main-content" while
     omega-a11y.js resolves the real container per page (#main-content,
     #omega-main-content or #app; valid on 12/12). So the FIRST thing a keyboard
     user tabbed to went nowhere on 75% of pages, and every page announced the
     same affordance twice.
     Nothing here was worth porting: omega-a11y.js's link is position:fixed
     rather than absolute, retries via requestAnimationFrame instead of dropping
     itself when document.body is not ready yet, and -- the part that makes a
     skip link actually work -- gives its target tabindex="-1" and focuses it,
     without which the fragment scrolls but focus stays on <body> and the next
     Tab walks back into the sidebar the link exists to skip. */

  // Enhanced screen reader announcements
  /* Augment the canonical accessibility API instead of replacing it.
     omega-a11y.js owns the global object and exposes focus trapping,
     landmarks, live regions, table semantics and reduced-motion behavior.
     Replacing window.OmegaA11y here used to make behavior depend on script
     load order and could silently discard those methods. */
  const a11y = window.OmegaA11y || {};
  if(typeof a11y.announce !== 'function') {
    a11y.announce = (message, priority = 'polite') => {
      if(!message) return;
      const region = document.querySelector(
        '[role="status"][aria-live="' + priority + '"], [role="alert"][aria-live="' + priority + '"]'
      );
      if(region) {
        region.textContent = String(message);
        return;
      }
      if(!document.body) return;
      const announce = document.createElement('div');
      announce.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
      announce.setAttribute('aria-live', priority);
      announce.setAttribute('aria-atomic', 'true');
      announce.style.position = 'absolute';
      announce.style.left = '-10000px';
      announce.textContent = String(message);
      document.body.appendChild(announce);
    };
  }
  if(typeof a11y.label !== 'function') {
    a11y.label = (elementId, labelText) => {
      const el = document.getElementById(elementId);
      if(!el || !labelText || el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return;
      const label = document.createElement('label');
      label.htmlFor = elementId;
      label.textContent = String(labelText);
      el.parentNode?.insertBefore(label, el);
    };
  }
  window.OmegaA11y = a11y;
})();
