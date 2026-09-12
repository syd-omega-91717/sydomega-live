/**
 * Ω Feature Gates
 * Real-time feature flag management driven by Product Agent
 */

window.OmegaFeatureGates = (() => {
  const cache = new Map();
  let initialized = false;

  const FeatureGates = {
    /**
     * Initialize feature gates for current member
     */
    async init() {
      if (initialized) return;

      try {
        const sb = window.OmegaSupabase?.get?.();
        if (!sb) return;

        const { data: flags } = await sb
          .from("member_feature_flags")
          .select("feature_id,enabled,variant")
          .eq("enabled", true);

        flags?.forEach((flag) => {
          cache.set(flag.feature_id, {
            enabled: flag.enabled,
            variant: flag.variant,
          });
        });

        initialized = true;
        return cache;
      } catch (error) {
        console.error("Error initializing feature gates:", error);
      }
    },

    /**
     * Check if a feature is enabled for current member
     */
    isEnabled(featureId) {
      const flag = cache.get(featureId);
      return flag?.enabled || false;
    },

    /**
     * Get feature variant (A/B test variant)
     */
    getVariant(featureId) {
      const flag = cache.get(featureId);
      return flag?.variant || "default";
    },

    /**
     * Set feature flag (for Product Agent)
     */
    async setFlag(featureId, enabled, variant = null) {
      try {
        const sb = window.OmegaSupabase?.get?.();
        if (!sb) return;

        const { data: profile } = await sb.auth.getUser();
        if (!profile) return;

        const { error: upsertError } = await sb.from("member_feature_flags").upsert({
          member_id: profile.id,
          feature_id: featureId,
          enabled: enabled,
          variant: variant,
          set_by_agent: true,
          set_reason: "product_agent_adaptation",
        });

        if (upsertError) {
          throw new Error(`Failed to upsert feature flag: ${upsertError.message}`);
        }

        cache.set(featureId, { enabled, variant });
      } catch (error) {
        console.error("Error setting feature flag:", error);
      }
    },

    /**
     * Conditionally show element based on feature flag
     */
    showIf(elementId, featureId) {
      const element = document.getElementById(elementId);
      if (!element) return;

      if (this.isEnabled(featureId)) {
        element.style.display = "";
      } else {
        element.style.display = "none";
      }
    },

    /**
     * Conditionally show elements by class based on feature flag
     */
    showClassIf(className, featureId) {
      const elements = document.querySelectorAll(`.${className}`);
      const enabled = this.isEnabled(featureId);

      elements.forEach((el) => {
        el.style.display = enabled ? "" : "none";
      });
    },

    /**
     * Get all active features
     */
    getActiveFeatures() {
      return Array.from(cache.entries()).reduce((acc, [id, flag]) => {
        if (flag.enabled) acc.push(id);
        return acc;
      }, []);
    },

    /**
     * Subscribe to feature flag changes (via Supabase realtime)
     */
    subscribe(callback) {
      try {
        const sb = window.OmegaSupabase?.get?.();
        if (!sb) return;

        const { data: profile } = sb.auth.getUser();
        if (!profile) return;

        const subscription = sb
          .from("member_feature_flags")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "member_feature_flags",
              filter: `member_id=eq.${profile.id}`,
            },
            (payload) => {
              if (payload.new) {
                cache.set(payload.new.feature_id, {
                  enabled: payload.new.enabled,
                  variant: payload.new.variant,
                });
              } else if (payload.old) {
                cache.delete(payload.old.feature_id);
              }
              callback?.(payload);
            }
          )
          .subscribe();

        return subscription;
      } catch (error) {
        console.error("Error subscribing to feature flags:", error);
      }
    },

    /**
     * Predefined feature flags for common use cases
     */
    features: {
      ADVANCED_SETTINGS: "advanced_settings",
      BATCH_OPERATIONS: "batch_operations",
      API_DOCS: "api_documentation",
      BETA_FEATURES: "beta_features",
      ANALYTICS_DEEP_DIVE: "analytics_deep_dive",
      COMMUNITY_FEATURES: "community_features",
      MULTI_WORKSPACE: "multi_workspace",
      CUSTOM_INTEGRATIONS: "custom_integrations",
      DATA_EXPORT_ENHANCED: "data_export_enhanced",
      AI_INSIGHTS_PRO: "ai_insights_pro",
    },
  };

  // Auto-initialize on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => FeatureGates.init());
  } else {
    FeatureGates.init();
  }

  return FeatureGates;
})();
