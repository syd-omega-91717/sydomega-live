// Server-side feature and consent gate for Graphify AI.
// Missing settings, missing preference rows and query errors all fail closed.
export async function checkGraphifyAiConsent(
  serviceClient: any,
  userId: string,
): Promise<{ allowed: boolean; reason: string }> {
  try {
    const [feature, preferences] = await Promise.all([
      serviceClient.from("platform_settings")
        .select("bool_value")
        .eq("key", "graphify_ai_enabled")
        .maybeSingle(),
      serviceClient.from("omega_personal_context_preferences")
        .select("ai_personalization_enabled,sensitive_data_processing_enabled")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (feature.error || feature.data?.bool_value !== true) {
      return { allowed: false, reason: "graphify_ai_disabled" };
    }
    if (preferences.error || preferences.data?.ai_personalization_enabled !== true) {
      return { allowed: false, reason: "ai_personalization_consent_required" };
    }
    if (preferences.data?.sensitive_data_processing_enabled !== true) {
      return { allowed: false, reason: "sensitive_data_processing_consent_required" };
    }
    return { allowed: true, reason: "enabled" };
  } catch {
    return { allowed: false, reason: "graphify_ai_policy_unavailable" };
  }
}
