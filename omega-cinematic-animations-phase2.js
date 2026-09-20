/* omega-cinematic-animations-phase2.js
   Phase 2: Scroll-Driven Parallax and Constellation Animations

   Implements:
   - Parallax tracking via scroll offset (IntersectionObserver for efficiency)
   - Constellation orbital mechanics and timing
   - 3D depth card tilt calculation
   - Volumetric lighting responsiveness

   Performance: rAF-throttled scroll listener, 60fps target, defers to
   prefers-reduced-motion detection. GPU-safe transforms only.

   Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
*/

(function() {
  'use strict';

  /* Check for reduced motion preference */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* Store scroll position for parallax */
  let scrollY = 0;
  let rafId = null;

  /* ===== PARALLAX TRACKING =============================================== */

  function updateParallaxOffsets() {
    if (prefersReduced) return;

    /* Query all parallax-enabled elements */
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    parallaxElements.forEach(el => {
      const factor = parseFloat(el.dataset.parallax) || 0.3;
      const offset = scrollY * factor;
      el.style.transform = `translateY(${offset}px)`;
    });

    /* Update custom properties for CSS-driven parallax */
    document.documentElement.style.setProperty('--scroll-y', scrollY + 'px');
  }

  function onScroll() {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;

    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        updateParallaxOffsets();
        rafId = null;
      });
    }
  }

  /* ===== CONSTELLATION ORBITAL MECHANICS ================================= */

  function initConstellationOrbits() {
    if (prefersReduced) return;

    const orbits = document.querySelectorAll('.ocnbg-orbit');

    orbits.forEach((orbit, idx) => {
      /* Set orbital speed based on index (vary speeds for visual interest) */
      const speeds = [60, 80, 100, 120, 90, 75]; /* seconds per rotation */
      const speed = speeds[idx % speeds.length];

      orbit.style.animationDuration = speed + 's';
    });
  }

  /* Update constellation node timing for staggered pulse */
  function updateConstellationNodes() {
    const nodes = document.querySelectorAll('.ocnbg-node');

    nodes.forEach((node, idx) => {
      const delays = [0, 1.5, 0.8, 1.3, 0.5, 1.1];
      const delay = delays[idx % delays.length];

      node.style.animationDelay = delay + 's';
    });
  }

  /* ===== 3D DEPTH CARD TILT =============================================== */

  function init3DCardTilt() {
    if (prefersReduced) return;

    const cards = document.querySelectorAll('.omega-depth-card .card, .omega-depth-card .kpi-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        /* Calculate tilt angles based on mouse position */
        const tiltX = ((y / rect.height) - 0.5) * 10; /* -5 to +5 degrees */
        const tiltY = ((x / rect.width) - 0.5) * -10;  /* -5 to +5 degrees */

        /* Store for CSS or direct transform application */
        card.style.setProperty('--tilt-x', tiltX + 'deg');
        card.style.setProperty('--tilt-y', tiltY + 'deg');
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  /* ===== VOLUMETRIC LIGHTING RESPONSIVENESS ============================== */

  function initVolumetricLighting() {
    if (prefersReduced) return;

    const volumetricElements = document.querySelectorAll('.omega-volumetric-light, .omega-volumetric-bloom');

    /* Optional: bind volumetric intensity to scroll or time */
    volumetricElements.forEach(el => {
      /* Could add scroll-responsive opacity or scale here */
      /* For now, CSS animations handle the effect */
    });
  }

  /* ===== PARALLAX INTERSECTION OBSERVER ==================================
     More efficient than scroll listener on long pages: only update
     parallax elements that are near the viewport.
  */

  function initParallaxIntersectionObserver() {
    if (prefersReduced) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('parallax-active');
        } else {
          entry.target.classList.remove('parallax-active');
        }
      });
    }, {
      rootMargin: '100px 0px'
    });

    document.querySelectorAll('[data-parallax], .omega-parallax-text, .omega-parallax-card')
      .forEach(el => observer.observe(el));
  }

  /* ===== MEDIA QUERY LISTENER =========================================== */

  function watchReducedMotion() {
    const mq = window.matchMedia('(prefers-reduced-motion:reduce)');

    mq.addListener((e) => {
      if (e.matches) {
        /* Disable parallax and animations */
        if (rafId) cancelAnimationFrame(rafId);
        document.removeEventListener('scroll', onScroll);
      } else {
        /* Re-enable if toggled back on */
        document.addEventListener('scroll', onScroll);
      }
    });
  }

  /* ===== DOM OBSERVATION FOR DYNAMIC CONTENT ============================= */

  function observeDynamicContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { /* Element node */
              /* Re-initialize if new parallax or constellation elements added */
              if (node.dataset && (
                node.dataset.parallax !== undefined ||
                node.classList.contains('ocnbg-node') ||
                node.classList.contains('omega-depth-card')
              )) {
                initParallaxIntersectionObserver();
                updateConstellationNodes();
                init3DCardTilt();
              }
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

  /* ===== INITIALIZATION ================================================== */

  function init() {
    if (prefersReduced) {
      console.debug('[OmegaPhase2] Reduced motion preference detected; animations disabled');
      return;
    }

    /* Defer until DOM is ready */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.debug('[OmegaPhase2] Initializing scroll parallax, constellation orbits, 3D tilt');

    /* Initialize parallax tracking */
    document.addEventListener('scroll', onScroll, { passive: true });
    updateParallaxOffsets(); /* Initial state */

    /* Initialize constellation mechanics */
    initConstellationOrbits();
    updateConstellationNodes();

    /* Initialize 3D card tilt */
    init3DCardTilt();

    /* Initialize volumetric lighting responsiveness */
    initVolumetricLighting();

    /* Use IntersectionObserver for efficient parallax */
    initParallaxIntersectionObserver();

    /* Watch for reduced-motion changes */
    watchReducedMotion();

    /* Watch for dynamically added content */
    observeDynamicContent();
  }

  /* Expose public API */
  window.OmegaPhase2 = {
    init: init,
    updateParallax: updateParallaxOffsets,
    updateConstellations: updateConstellationNodes,
    scrollY: () => scrollY
  };

  /* Start initialization */
  init();
})();
