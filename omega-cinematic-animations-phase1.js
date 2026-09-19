/* omega-cinematic-animations-phase1.js
   Character-by-character reveal animation system for kinetic typography.
   Wraps text content in <span class="char"> elements per character,
   enabling staggered reveal via CSS keyframes with data-char-index timing.

   Scope: applies to elements matching [data-kinetic-reveal] and .kinetic-headline.
   Respects prefers-reduced-motion (renders without animation).

   Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
*/

(function() {
  'use strict';

  /* Wrap text in character spans for reveal animation */
  function wrapCharacters(element) {
    if(!element || element.dataset.kineticProcessed) return;

    const text = element.textContent;
    if(!text || text.length === 0) return;

    const fragment = document.createDocumentFragment();
    let charIndex = 0;

    for(let i = 0; i < text.length; i++) {
      const char = text[i];

      if(char === ' ') {
        /* Preserve spaces as non-breaking spaces in spans */
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ' ';
        span.dataset.charIndex = charIndex;
        fragment.appendChild(span);
      } else if(/\s/.test(char)) {
        /* Other whitespace becomes line breaks */
        fragment.appendChild(document.createElement('br'));
        charIndex--;
      } else {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        span.dataset.charIndex = charIndex;
        fragment.appendChild(span);
      }

      charIndex++;
    }

    element.textContent = '';
    element.appendChild(fragment);
    element.dataset.kineticProcessed = 'true';
  }

  /* Initialize kinetic reveal on all matching elements */
  function initKineticReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* Query all kinetic typography targets */
    const targets = document.querySelectorAll('[data-kinetic-reveal], .kinetic-headline');

    targets.forEach(target => {
      /* Skip if already processed */
      if(target.dataset.kineticProcessed) return;

      /* Skip if prefers-reduced-motion and data-kinetic-reveal is explicit */
      if(prefersReduced && target.dataset.kineticReveal !== undefined) {
        target.classList.add('kinetic-no-anim');
        return;
      }

      wrapCharacters(target);
    });
  }

  /* Defer initialization until DOM is ready */
  function deferInit() {
    if(document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initKineticReveal);
    } else {
      initKineticReveal();
    }
  }

  /* Listen for media query changes (e.g., user toggles reduced motion) */
  function watchMediaQuery() {
    const mq = window.matchMedia('(prefers-reduced-motion:reduce)');
    mq.addListener(() => {
      /* Re-initialize if media query state changes */
      initKineticReveal();
    });
  }

  /* Observe DOM for new kinetic elements (optional: for dynamically added content) */
  function watchDOM() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if(mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if(node.nodeType === 1 &&
               (node.dataset.kineticReveal !== undefined ||
                node.classList.contains('kinetic-headline'))) {
              wrapCharacters(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* Expose public API */
  window.OmegaKineticReveal = {
    init: initKineticReveal,
    wrap: wrapCharacters
  };

  /* Start initialization */
  deferInit();
  watchMediaQuery();
  watchDOM();
})();
