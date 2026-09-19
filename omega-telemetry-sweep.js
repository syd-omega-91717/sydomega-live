/**
 * Ω TELEMETRY SWEEP — Animated Line Sweep on Data Load
 *
 * Brief, purposeful animation for:
 * - Data fetch completion
 * - Form submission
 * - State transitions
 * - Real-time updates
 *
 * Usage:
 *   const sweep = new OmegaTelemetrySweep();
 *   await sweep.sweep(element, 300); // 300ms duration
 *
 * Performance: One-time animation per action (not perpetual)
 * GPU-accelerated: Uses transform (left position via GPU)
 * Accessibility: Respects prefers-reduced-motion (instant skip)
 */

(function() {
  'use strict';

  class TelemetrySweep {
    constructor() {
      this.duration = 300; // ms
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Listen for motion preference changes
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
      });

      // Inject animation keyframes if not present
      this.ensureKeyframes();
    }

    ensureKeyframes() {
      // Check if animation already exists
      if (document.getElementById('omega-telemetry-keyframes')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'omega-telemetry-keyframes';
      style.textContent = `
        @keyframes omega-telemetry-sweep {
          0% {
            left: -100%;
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0.3;
          }
        }

        @keyframes omega-telemetry-sweep-quick {
          0% {
            left: -100%;
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes omega-telemetry-sweep {
            0%, 100% { left: 100%; opacity: 0; }
          }
          @keyframes omega-telemetry-sweep-quick {
            0%, 100% { left: 100%; opacity: 0; }
          }
        }
      `;
      document.head.appendChild(style);
    }

    /**
     * Sweep an element (typically a card, form, or data container)
     * @param {HTMLElement} element - Target element
     * @param {number} duration - Animation duration in ms (default: 300)
     * @returns {Promise} Resolves when animation completes
     */
    sweep(element, duration = this.duration) {
      if (!element) {
        return Promise.resolve();
      }

      // Skip animation if reduced motion is enabled
      if (this.isReducedMotion) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        // Ensure element has position context
        const originalPosition = window.getComputedStyle(element).position;
        if (originalPosition === 'static') {
          element.style.position = 'relative';
        }

        // Create sweep bar
        const sweepBar = document.createElement('div');
        sweepBar.className = 'telemetry-sweep-bar';
        sweepBar.style.cssText = `
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--gold, #ccaa6a) 40%,
            var(--cyan, #00ffff) 50%,
            var(--gold, #ccaa6a) 60%,
            transparent 100%
          );
          box-shadow: 0 0 12px var(--gold, rgba(204, 169, 106, 0.6));
          pointer-events: none;
          z-index: 10;
          animation: omega-telemetry-sweep ${duration}ms ease-out forwards;
          border-radius: 1px;
        `;

        element.appendChild(sweepBar);

        // Remove bar and resolve when animation completes
        const cleanup = () => {
          sweepBar.removeEventListener('animationend', cleanup);
          sweepBar.remove();

          // Restore original position if we changed it
          if (originalPosition === 'static') {
            element.style.position = originalPosition;
          }

          resolve();
        };

        sweepBar.addEventListener('animationend', cleanup);

        // Fallback cleanup in case animationend doesn't fire
        setTimeout(cleanup, duration + 50);
      });
    }

    /**
     * Sweep multiple elements in sequence
     * @param {HTMLElement[]} elements - Target elements
     * @param {number} duration - Animation duration per element
     * @returns {Promise} Resolves when all animations complete
     */
    sweepSequence(elements, duration = this.duration) {
      return elements.reduce((promise, el) => {
        return promise.then(() => this.sweep(el, duration));
      }, Promise.resolve());
    }

    /**
     * Sweep multiple elements in parallel
     * @param {HTMLElement[]} elements - Target elements
     * @param {number} duration - Animation duration
     * @returns {Promise} Resolves when all animations complete
     */
    sweepParallel(elements, duration = this.duration) {
      return Promise.all(elements.map((el) => this.sweep(el, duration)));
    }
  }

  // Expose to window
  window.OmegaTelemetrySweep = TelemetrySweep;

  // Create global instance
  window.omegaSweep = new TelemetrySweep();
})();
