/* ==========================================================================
   Ω SYD OMEGA 91717 — SCULPTURE DATA VIZ LAYER (omega-sculpture-dataviz.js)
   Proposal #26: Real-Time Geometry Binding

   Synchronize WebGL sculpture transforms to live member data:
   - Realm sphere pulses with active task count
   - Ascension sculpture rotates with tier progress (0–100%)
   - Element sigils scale with element mastery scores
   - Orbit cycles synchronize with particle pulse from Phase 3

   No new tables/RPCs: reads existing profiles.rank, profiles.current_tier,
   public.user_achievements. Data flows through the live member profile that
   gated pages already load.

   Respects prefers-reduced-motion: geometry fixed at neutral values.
   ========================================================================== */
(function(){
  if(window.__omegaSculptureDataViz) return;
  window.__omegaSculptureDataViz = true;

  var prefersReduced = false;
  try { prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) {}

  /* State: live member data */
  var state = {
    profile: null,
    achievements: null,
    activeTaskCount: 0,
    tierProgress: 0,        /* 0-100% through current tier */
    elementMasteryScores: {}, /* element -> 0-100 */
    lastUpdate: 0
  };

  /* Read member data from what the page already loaded */
  function readMemberData() {
    try {
      var profile = window.__omegaProfile || (window.OmegaAuth && window.OmegaAuth.getProfile && window.OmegaAuth.getProfile());
      if (profile && profile.current_tier !== undefined) {
        state.profile = profile;
        state.tierProgress = (profile.current_tier_progress || 0);
        if (typeof state.tierProgress !== 'number') state.tierProgress = 0;
        state.tierProgress = Math.max(0, Math.min(100, state.tierProgress));
      }
    } catch(e) {}

    try {
      /* Active task count: count incomplete tasks in real-time data */
      var taskCount = 0;
      if (window.__omegaTasks && Array.isArray(window.__omegaTasks)) {
        taskCount = window.__omegaTasks.filter(function(t) { return t && !t.completed; }).length;
      }
      state.activeTaskCount = Math.max(0, Math.min(100, taskCount));
    } catch(e) {}

    try {
      /* Element mastery scores: read from user achievements per element */
      state.elementMasteryScores = {};
      if (window.__omegaAchievements && typeof window.__omegaAchievements === 'object') {
        var achievements = window.__omegaAchievements;
        /* Normalize achievement data to 0-100 scale per element */
        for (var element in achievements) {
          if (achievements.hasOwnProperty(element)) {
            var val = achievements[element];
            if (typeof val === 'number') {
              state.elementMasteryScores[element] = Math.max(0, Math.min(100, val));
            } else if (typeof val === 'object' && val.score !== undefined) {
              state.elementMasteryScores[element] = Math.max(0, Math.min(100, val.score));
            }
          }
        }
      }
    } catch(e) {}

    state.lastUpdate = Date.now();
  }

  /* Initialize once on load */
  function init() {
    readMemberData();

    /* Listen for data changes */
    try {
      document.addEventListener('omega:data-updated', function() {
        readMemberData();
      });
      document.addEventListener('omega:profile-updated', function() {
        readMemberData();
      });
      document.addEventListener('omega:tasks-updated', function() {
        readMemberData();
      });
      document.addEventListener('omega:achievements-updated', function() {
        readMemberData();
      });
    } catch(e) {}
  }

  /* Public API for omega-sculpture.js */
  window.OmegaSculptureDataViz = {
    /**
     * Get the member's current tier progress as a percentage (0-100)
     * Used by ascension sculpture to rotate tower based on climb progress
     */
    getTierProgress: function() {
      if (prefersReduced) return 0;
      readMemberData();
      return state.tierProgress;
    },

    /**
     * Get the member's active task count (0-based)
     * Used by realm sphere to pulse based on workload
     * Scaled to 0-10 for gentle pulsation (clamped at 10 tasks)
     */
    getActiveTaskCount: function() {
      if (prefersReduced) return 0;
      readMemberData();
      return state.activeTaskCount / 10; /* Normalize to 0-1 scale for pulse */
    },

    /**
     * Get element mastery score (0-100)
     * Used by element sigils to scale proportional to mastery
     */
    getElementMastery: function(elementName) {
      if (prefersReduced) return 0;
      readMemberData();
      return (state.elementMasteryScores[elementName] || 0) / 100; /* Normalize to 0-1 */
    },

    /**
     * Get all element mastery scores as a map
     */
    getAllElementMasteries: function() {
      if (prefersReduced) return {};
      readMemberData();
      var result = {};
      for (var key in state.elementMasteryScores) {
        if (state.elementMasteryScores.hasOwnProperty(key)) {
          result[key] = state.elementMasteryScores[key] / 100;
        }
      }
      return result;
    },

    /**
     * Get the profile object directly
     */
    getProfile: function() {
      if (prefersReduced) return null;
      readMemberData();
      return state.profile;
    },

    /**
     * Get full state (for debugging)
     */
    getState: function() {
      return state;
    }
  };

  /* Initialize on page load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
