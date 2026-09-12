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

  // Skip links for keyboard navigation
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--gold);
    color: var(--void);
    padding: 8px 12px;
    text-decoration: none;
    z-index: 10000;
    font-weight: 700;
  `;
  skipLink.onfocus = () => skipLink.style.top = '0';
  skipLink.onblur = () => skipLink.style.top = '-40px';
  if(document.body) document.body.prepend(skipLink);

  // Enhanced screen reader announcements
  window.OmegaA11y = {
    announce: (message, priority = 'polite') => {
      const region = document.querySelector('[role="status"][aria-live="' + priority + '"]');
      if(region) {
        region.textContent = message;
      } else {
        const announce = document.createElement('div');
        announce.setAttribute('role', 'status');
        announce.setAttribute('aria-live', priority);
        announce.setAttribute('aria-atomic', 'true');
        announce.style.position = 'absolute';
        announce.style.left = '-10000px';
        announce.textContent = message;
        document.body.appendChild(announce);
      }
    },
    label: (elementId, labelText) => {
      const el = document.getElementById(elementId);
      if(!el) return;
      const label = document.createElement('label');
      label.htmlFor = elementId;
      label.textContent = labelText;
      el.parentNode?.insertBefore(label, el);
    }
  };
})();
