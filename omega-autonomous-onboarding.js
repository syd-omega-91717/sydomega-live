/**
 * Ω Autonomous Onboarding
 * AI-driven adaptive onboarding sequences personalized to member context
 */

window.OmegaAutonomousOnboarding = (() => {
  const onboardingSteps = {
    power_user: [
      "account_setup",
      "advanced_settings_intro",
      "api_documentation",
      "integration_setup",
      "team_collaboration",
    ],
    regular_user: [
      "account_setup",
      "feature_tour",
      "first_action",
      "customization",
      "help_resources",
    ],
    casual_user: [
      "account_setup",
      "simplified_tour",
      "first_success",
      "follow_up_tips",
    ],
    explorer: [
      "account_setup",
      "feature_discovery",
      "sandbox_environment",
      "tutorial_paths",
      "community_intro",
    ],
  };

  const steps = {
    account_setup: {
      title: "Welcome to Ω OMEGA",
      description: "Let's set up your account",
      estimated_duration_minutes: 5,
      components: ["profile_photo", "timezone", "preferences"],
      tags: ["core"],
    },
    feature_tour: {
      title: "Discover Your Dashboard",
      description: "Explore the main features",
      estimated_duration_minutes: 10,
      components: ["navigation", "main_features", "shortcuts"],
      tags: ["core"],
    },
    advanced_settings_intro: {
      title: "Advanced Configuration",
      description: "Configure advanced options",
      estimated_duration_minutes: 15,
      components: ["api_keys", "webhooks", "custom_domain"],
      tags: ["power_user"],
    },
    first_action: {
      title: "Take Your First Action",
      description: "Complete your first meaningful action",
      estimated_duration_minutes: 8,
      components: ["guided_action", "validation", "success_message"],
      tags: ["core"],
    },
    api_documentation: {
      title: "API & Integrations",
      description: "Learn about API capabilities",
      estimated_duration_minutes: 20,
      components: ["api_overview", "code_examples", "sandbox"],
      tags: ["power_user"],
    },
    customization: {
      title: "Personalize Your Experience",
      description: "Customize settings to your preferences",
      estimated_duration_minutes: 10,
      components: ["theme", "notifications", "workflow_preferences"],
      tags: ["core"],
    },
    help_resources: {
      title: "Get Help Anytime",
      description: "Learn about support resources",
      estimated_duration_minutes: 5,
      components: ["help_center", "contact_support", "community"],
      tags: ["core"],
    },
    simplified_tour: {
      title: "Quick Start",
      description: "Essential features overview",
      estimated_duration_minutes: 5,
      components: ["main_dashboard", "how_to_search"],
      tags: ["casual"],
    },
    first_success: {
      title: "Achieve Quick Win",
      description: "Complete a simple, rewarding task",
      estimated_duration_minutes: 5,
      components: ["easy_task", "celebration", "next_steps"],
      tags: ["casual"],
    },
    follow_up_tips: {
      title: "Helpful Tips",
      description: "Quick tips to get more value",
      estimated_duration_minutes: 3,
      components: ["tip_carousel", "resources_link"],
      tags: ["casual"],
    },
    feature_discovery: {
      title: "Explore Features",
      description: "Discover all available features",
      estimated_duration_minutes: 15,
      components: ["feature_list", "interactive_demo", "try_feature"],
      tags: ["explorer"],
    },
    sandbox_environment: {
      title: "Safe Practice Zone",
      description: "Experiment without consequences",
      estimated_duration_minutes: 10,
      components: ["sandbox_intro", "sample_data", "reset_button"],
      tags: ["explorer"],
    },
    tutorial_paths: {
      title: "Guided Learning Paths",
      description: "Choose your learning path",
      estimated_duration_minutes: 5,
      components: ["path_selection", "difficulty_levels"],
      tags: ["explorer"],
    },
    community_intro: {
      title: "Join the Community",
      description: "Connect with other users",
      estimated_duration_minutes: 5,
      components: ["community_channels", "user_profiles", "discussions"],
      tags: ["explorer"],
    },
    team_collaboration: {
      title: "Team Setup",
      description: "Invite team members and set permissions",
      estimated_duration_minutes: 15,
      components: ["invite_flow", "role_setup", "permissions"],
      tags: ["power_user"],
    },
    integration_setup: {
      title: "Connect Your Tools",
      description: "Set up integrations with external services",
      estimated_duration_minutes: 20,
      components: ["integration_list", "auth_flow", "test_connection"],
      tags: ["power_user"],
    },
  };

  const Onboarding = {
    /**
     * Get personalized onboarding sequence for member
     */
    async getPersonalizedSequence(memberId, memberContext) {
      try {
        // Determine persona from context
        const persona = memberContext?.persona || "regular_user";

        // Get base sequence for persona
        const baseSequence = onboardingSteps[persona] || onboardingSteps.regular_user;

        // Fetch member progress
        const sb = window.OmegaSupabase?.get?.();
        if (sb) {
          const { data: progress } = await sb
            .from("member_attributes")
            .select("onboarding_completed_steps")
            .eq("member_id", memberId)
            .single();

          const completedSteps = progress?.onboarding_completed_steps || [];
          return baseSequence.filter((step) => !completedSteps.includes(step));
        }

        return baseSequence;
      } catch (error) {
        console.error("Error getting personalized sequence:", error);
        return [];
      }
    },

    /**
     * Get current step details
     */
    getStepDetails(stepId) {
      return steps[stepId] || null;
    },

    /**
     * Mark step as completed
     */
    async completeStep(memberId, stepId) {
      try {
        const sb = window.OmegaSupabase?.get?.();
        if (!sb) return;

        const { data: current } = await sb
          .from("member_attributes")
          .select("onboarding_completed_steps")
          .eq("member_id", memberId)
          .single();

        const completed = current?.onboarding_completed_steps || [];
        if (!completed.includes(stepId)) {
          completed.push(stepId);
        }

        await sb
          .from("member_attributes")
          .update({
            onboarding_completed_steps: completed,
            last_onboarding_step_at: new Date().toISOString(),
          })
          .eq("member_id", memberId);

        // Record decision for analytics
        await sb.from("member_agent_interactions").insert({
          member_id: memberId,
          agent_id: "concierge",
          interaction_type: "onboarding_step_completed",
          member_input: stepId,
          agent_response: `Completed onboarding step: ${stepId}`,
          resolved: true,
        });

        return true;
      } catch (error) {
        console.error("Error marking step complete:", error);
        return false;
      }
    },

    /**
     * Get next recommended step based on current context
     */
    async getNextStep(memberId, memberContext) {
      try {
        const remaining = await this.getPersonalizedSequence(memberId, memberContext);
        if (remaining.length === 0) {
          return null; // Onboarding complete
        }

        // Call Concierge Agent to determine optimal next step
        const response = await fetch("/.netlify/functions/concierge-orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member_id: memberId,
            issue_type: "onboarding",
            context: memberContext,
            input: `What's the next onboarding step? Remaining: ${remaining.join(", ")}`,
          }),
        });

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error getting next step:", error);
        // Fallback to first remaining step
        const remaining = await this.getPersonalizedSequence(memberId, memberContext);
        return remaining[0];
      }
    },

    /**
     * Render onboarding step component
     */
    renderStep(stepId, container) {
      const step = steps[stepId];
      if (!step) return;

      const stepElement = document.createElement("div");
      stepElement.className = "onboarding-step";
      stepElement.innerHTML = `
        <div class="onboarding-card">
          <div class="step-header">
            <h2>${step.title}</h2>
            <div class="step-duration">${step.estimated_duration_minutes} min</div>
          </div>
          <p class="step-description">${step.description}</p>
          <div class="step-components">
            ${step.components.map((c) => `<div class="component" data-component="${c}"></div>`).join("")}
          </div>
          <div class="step-actions">
            <button class="btn btn-gold complete-step" data-step="${stepId}">
              Continue
            </button>
          </div>
        </div>
      `;

      container.appendChild(stepElement);

      // Add event listener
      stepElement.querySelector(".complete-step").addEventListener("click", () => {
        const event = new CustomEvent("onboarding-step-completed", { detail: { stepId } });
        window.dispatchEvent(event);
      });
    },

    /**
     * Calculate onboarding completion percentage
     */
    async getCompletionPercentage(memberId, persona = "regular_user") {
      try {
        const totalSteps = onboardingSteps[persona]?.length || 5;
        const completedSteps = await this.getPersonalizedSequence(memberId, { persona });
        const completed = totalSteps - completedSteps.length;

        return Math.round((completed / totalSteps) * 100);
      } catch (error) {
        console.error("Error calculating completion:", error);
        return 0;
      }
    },

    /**
     * Get all step metadata
     */
    getAllSteps() {
      return steps;
    },
  };

  return Onboarding;
})();
