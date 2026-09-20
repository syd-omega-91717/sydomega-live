/* omega-cinematic-animations-phase3.js
   Phase 3: Particle Systems Integration and State-Driven Effects

   Implements:
   - Particle emission state management (loading, processing, active, idle, error, success)
   - Constellation-particle cluster positioning and intensity
   - Data load indicator lifecycle and state transitions
   - Integration with omega-particles.js for dynamic emission control
   - Particle orbital synchronization with Phase 2 constellation orbits

   Performance: efficient state-based DOM updates, throttled intensity calculations,
   defers to prefers-reduced-motion detection. GPU-safe transforms only.

   Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
*/

(function() {
  'use strict';

  /* Check for reduced motion preference */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* State tracking */
  let currentParticleState = 'idle';
  let dataLoadIndicator = null;
  let particleClusters = [];

  /* ===== PARTICLE STATE MANAGEMENT ===================================== */

  function updateParticleState(state) {
    if (prefersReduced) return;

    currentParticleState = state;

    /* Find or create particle state container */
    let stateContainer = document.querySelector('[data-particle-state]');
    if (!stateContainer) {
      stateContainer = document.createElement('div');
      stateContainer.setAttribute('data-particle-state', state);
      stateContainer.style.position = 'fixed';
      stateContainer.style.top = '0';
      stateContainer.style.left = '0';
      stateContainer.style.width = '100%';
      stateContainer.style.height = '100%';
      stateContainer.style.pointerEvents = 'none';
      stateContainer.style.zIndex = '-1';
      document.body.appendChild(stateContainer);
    } else {
      stateContainer.setAttribute('data-particle-state', state);
    }
  }

  /* Listen to body class changes for state transitions */
  function watchBodyStateChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const classList = document.body.classList;

          if (classList.contains('omega-data-loading')) {
            updateParticleState('loading');
          } else if (classList.contains('omega-interaction-active')) {
            updateParticleState('active');
          } else if (classList.contains('omega-idle')) {
            updateParticleState('idle');
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /* ===== DATA LOAD INDICATOR =========================================== */

  function initDataLoadIndicator() {
    if (prefersReduced) return;

    /* Create data load indicator if it doesn't exist */
    if (!document.querySelector('.data-load-indicator')) {
      dataLoadIndicator = document.createElement('div');
      dataLoadIndicator.className = 'data-load-indicator';
      document.body.appendChild(dataLoadIndicator);
    } else {
      dataLoadIndicator = document.querySelector('.data-load-indicator');
    }
  }

  function showDataLoadIndicator() {
    if (!dataLoadIndicator || prefersReduced) return;

    document.body.classList.add('omega-data-loading');
    dataLoadIndicator.classList.remove('success', 'error');
    dataLoadIndicator.style.display = 'block';
  }

  function hideDataLoadIndicator(state = 'success') {
    if (!dataLoadIndicator || prefersReduced) return;

    document.body.classList.remove('omega-data-loading');
    dataLoadIndicator.classList.add(state);

    /* Auto-hide after animation completes */
    setTimeout(() => {
      dataLoadIndicator.style.display = 'none';
      dataLoadIndicator.classList.remove(state);
    }, 1000);
  }

  /* ===== PARTICLE CLUSTER MANAGEMENT ================================== */

  function initParticleClusters() {
    if (prefersReduced) return;

    /* Query constellation nodes and create particle clusters around them */
    const constellationNodes = document.querySelectorAll('.ocnbg-node');

    constellationNodes.forEach((node, idx) => {
      const cluster = document.createElement('div');
      cluster.className = 'particle-cluster';
      cluster.setAttribute('data-cluster-index', idx);

      /* Position cluster at node's location */
      const rect = node.getBoundingClientRect();
      cluster.style.left = rect.left + 'px';
      cluster.style.top = rect.top + 'px';

      /* Set intensity based on node index */
      const intensities = ['intensity-high', 'intensity-medium', 'intensity-low'];
      cluster.classList.add(intensities[idx % intensities.length]);

      document.body.appendChild(cluster);
      particleClusters.push(cluster);
    });

    /* Position clusters within visible viewport */
    repositionParticleClusters();
  }

  function repositionParticleClusters() {
    if (prefersReduced) return;

    const constellationNodes = document.querySelectorAll('.ocnbg-node');

    constellationNodes.forEach((node, idx) => {
      if (particleClusters[idx]) {
        const rect = node.getBoundingClientRect();
        const cluster = particleClusters[idx];

        /* Update position with viewport offset */
        cluster.style.transform = `translate(${rect.left + window.pageXOffset}px, ${rect.top + window.pageYOffset}px)`;
      }
    });
  }

  /* ===== INTEGRATION WITH OMEGA-PARTICLES ============================== */

  function setParticleEmissionRate(rate) {
    if (typeof window.tsParticles === 'undefined') return;

    /* Adjust particle emission based on state */
    const emissionRates = {
      'loading': 8,
      'processing': 12,
      'active': 15,
      'idle': 3,
      'error': 20,
      'success': 10
    };

    const targetRate = emissionRates[currentParticleState] || 5;

    /* If tsParticles container exists, update its configuration */
    if (window.tsParticles && window.tsParticles.dom()) {
      const container = window.tsParticles.domItem(0);
      if (container && container.actualOptions) {
        container.actualOptions.emitter = container.actualOptions.emitter || {};
        container.actualOptions.emitter.rate = {
          increment: targetRate / 60,
          value: targetRate
        };
      }
    }
  }

  /* ===== CONSTELLATION-PARTICLE SYNCHRONIZATION ======================= */

  function syncParticleOrbits() {
    if (prefersReduced) return;

    /* Synchronize particle cluster orbit timing with constellation orbits */
    const orbits = document.querySelectorAll('.ocnbg-orbit');
    const speeds = [60, 80, 100, 120, 90, 75]; /* seconds per rotation */

    orbits.forEach((orbit, idx) => {
      const speed = speeds[idx % speeds.length];

      /* Apply matching animation to clusters */
      if (particleClusters[idx]) {
        particleClusters[idx].style.animationDuration = (speed * 2) + 's';
      }
    });
  }

  /* ===== INTERACTION FEEDBACK ========================================== */

  function initInteractionFeedback() {
    if (prefersReduced) return;

    /* Listen for user interactions */
    document.addEventListener('click', (e) => {
      /* Trigger particle burst on interactive elements */
      if (e.target.matches('[data-interactive], .btn, .btn-fill, .tab-btn, input, textarea, select')) {
        updateParticleState('active');
        setParticleEmissionRate(20);

        /* Return to idle after interaction */
        setTimeout(() => {
          updateParticleState('idle');
          setParticleEmissionRate(3);
        }, 800);
      }
    }, true);
  }

  /* ===== MEDIA QUERY LISTENER ========================================== */

  function watchReducedMotion() {
    const mq = window.matchMedia('(prefers-reduced-motion:reduce)');

    mq.addListener((e) => {
      if (e.matches) {
        /* Disable particle animations */
        particleClusters.forEach(cluster => {
          cluster.style.opacity = '0.3';
          cluster.style.animation = 'none';
        });
      } else {
        /* Re-enable if toggled back on */
        particleClusters.forEach(cluster => {
          cluster.style.opacity = '0.7';
        });
      }
    });
  }

  /* ===== INITIALIZATION ================================================ */

  function init() {
    if (prefersReduced) {
      console.debug('[OmegaPhase3] Reduced motion preference detected; animations disabled');
      return;
    }

    /* Defer until DOM is ready */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.debug('[OmegaPhase3] Initializing particle systems, state management, data indicators');

    /* Initialize all Phase 3 systems */
    initDataLoadIndicator();
    initParticleClusters();
    initInteractionFeedback();

    /* Watch for state changes */
    watchBodyStateChanges();
    watchReducedMotion();

    /* Synchronize with Phase 2 orbits */
    syncParticleOrbits();

    /* Set initial state */
    updateParticleState('idle');
    setParticleEmissionRate(3);
  }

  /* Expose public API */
  window.OmegaPhase3 = {
    init: init,
    updateState: updateParticleState,
    showDataLoadIndicator: showDataLoadIndicator,
    hideDataLoadIndicator: hideDataLoadIndicator,
    setEmissionRate: setParticleEmissionRate,
    repositionClusters: repositionParticleClusters
  };

  /* Start initialization */
  init();
})();
