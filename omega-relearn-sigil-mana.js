/* Ω SYD OMEGA 91717 — Relearn · Sigil · Mana Civilization Layer */
(function (root) {
  "use strict";

  const TRUTH = Object.freeze({
    USER_CREATED: "USER_CREATED",
    OBSERVED: "OBSERVED",
    CALCULATED: "CALCULATED",
    VERIFIED: "VERIFIED",
    SIMULATED: "SIMULATED",
    UNAVAILABLE: "UNAVAILABLE",
    BLOCKED: "BLOCKED"
  });

  const LIFECYCLE = Object.freeze([
    "CAPTURE", "REFLECT", "UNDERSTAND", "RETRY", "VERIFY", "INTEGRATE"
  ]);

  const EVENTS = Object.freeze({
    RELEARN_CAPTURED: "learning_captured",
    RELEARN_STARTED: "relearn_started",
    RELEARN_VERIFIED: "relearn_verified",
    SIGIL_CREATED: "sigil_created",
    SIGIL_EVOLVED: "sigil_evolved",
    SIGIL_ARCHIVED: "sigil_archived",
    MANA_CALCULATED: "mana_calculated",
    MANA_SPENT: "mana_spent",
    MANA_RECOVERED: "mana_recovered"
  });

  const now = () => new Date().toISOString();

  function required(input, fields) {
    return fields.every((field) =>
      input && input[field] !== undefined && input[field] !== null && input[field] !== ""
    );
  }

  function stableScore(parts) {
    const text = parts.map((part) => String(part ?? "")).join("|");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  function createRelearn(input) {
    if (!required(input, ["userId", "learningId", "lesson"])) {
      return { truth: TRUTH.BLOCKED, reason: "userId, learningId and lesson are required" };
    }
    const current = input.currentStage || "CAPTURE";
    const index = Math.max(0, LIFECYCLE.indexOf(current));
    const next = LIFECYCLE[Math.min(index + 1, LIFECYCLE.length - 1)];
    return {
      truth: TRUTH.USER_CREATED,
      id: input.id || "relearn-" + stableScore([input.userId, input.learningId, input.lesson]),
      userId: input.userId,
      learningId: input.learningId,
      lesson: String(input.lesson).slice(0, 2000),
      sourceReferences: Array.isArray(input.sourceReferences) ? input.sourceReferences.slice(0, 20) : [],
      currentStage: current,
      nextStage: next,
      event: EVENTS.RELEARN_STARTED,
      createdAt: now()
    };
  }

  function verifyRelearn(input) {
    if (!required(input, ["relearnId", "evidenceId", "outcome"])) {
      return { truth: TRUTH.BLOCKED, reason: "relearnId, evidenceId and outcome are required" };
    }
    return {
      truth: TRUTH.VERIFIED,
      relearnId: input.relearnId,
      evidenceId: input.evidenceId,
      outcome: String(input.outcome).slice(0, 2000),
      event: EVENTS.RELEARN_VERIFIED,
      verifiedAt: now()
    };
  }

  function createSigil(input) {
    if (!required(input, ["userId"])) {
      return { truth: TRUTH.BLOCKED, reason: "userId is required" };
    }
    const declared = Array.isArray(input.declaredTraits) ? input.declaredTraits.slice(0, 12) : [];
    const milestones = Array.isArray(input.verifiedMilestones) ? input.verifiedMilestones.slice(0, 20) : [];
    return {
      truth: TRUTH.CALCULATED,
      id: input.id || "sigil-" + stableScore([input.userId, declared.join(","), milestones.join(",")]),
      userId: input.userId,
      symbolSeed: stableScore([input.userId, declared.join("|"), milestones.join("|")]),
      declaredTraits: declared,
      verifiedMilestones: milestones,
      affiliations: Array.isArray(input.affiliations) ? input.affiliations.slice(0, 12) : [],
      version: 1,
      event: EVENTS.SIGIL_CREATED,
      securityNote: "Visual representation only; not an authentication credential or authorization grant.",
      calculatedAt: now()
    };
  }

  function evolveSigil(input) {
    if (!required(input, ["sigilId", "verifiedMilestone"])) {
      return { truth: TRUTH.BLOCKED, reason: "sigilId and verifiedMilestone are required" };
    }
    return {
      truth: TRUTH.VERIFIED,
      sigilId: input.sigilId,
      verifiedMilestone: input.verifiedMilestone,
      version: Number(input.version || 1) + 1,
      event: EVENTS.SIGIL_EVOLVED,
      evolvedAt: now()
    };
  }

  function calculateMana(input) {
    if (!required(input, ["userId"])) {
      return { truth: TRUTH.BLOCKED, reason: "userId is required" };
    }
    const capabilities = Array.isArray(input.verifiedCapabilities) ? input.verifiedCapabilities : [];
    const missions = Array.isArray(input.activeMissions) ? input.activeMissions : [];
    const learning = Array.isArray(input.verifiedLearning) ? input.verifiedLearning : [];
    const explicit = Array.isArray(input.explicitPreferences) ? input.explicitPreferences : [];
    const capacity = input.systemCapacity && typeof input.systemCapacity === "object"
      ? input.systemCapacity
      : {};
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const values = {
      FOCUS: clamp((capabilities.length * 8) + (explicit.length * 3)),
      LEARNING: clamp(learning.length * 10),
      CREATIVE: clamp((explicit.length * 4) + (learning.length * 2)),
      COLLABORATION: clamp(missions.length * 7),
      EXECUTION: clamp((capabilities.length * 6) + (missions.length * 4))
    };
    const total = Math.round(Object.values(values).reduce((a, b) => a + b, 0) / 5);
    return {
      truth: TRUTH.CALCULATED,
      userId: input.userId,
      components: values,
      total,
      sources: {
        verifiedCapabilities: capabilities.length,
        activeMissions: missions.length,
        verifiedLearning: learning.length,
        explicitPreferences: explicit.length,
        systemCapacityProvided: Object.keys(capacity).length > 0
      },
      disclaimer: "Mana is a non-financial capacity abstraction. It does not determine authority, creditworthiness, health, employment, legal status, or social worth.",
      event: EVENTS.MANA_CALCULATED,
      calculatedAt: now()
    };
  }

  function spendMana(input) {
    if (!required(input, ["userId", "component", "amount", "authorizationId"])) {
      return { truth: TRUTH.BLOCKED, reason: "userId, component, amount and authorizationId are required" };
    }
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100) {
      return { truth: TRUTH.BLOCKED, reason: "amount must be between 0 and 100" };
    }
    return {
      truth: TRUTH.CALCULATED,
      userId: input.userId,
      component: String(input.component),
      amount,
      authorizationId: input.authorizationId,
      event: EVENTS.MANA_SPENT,
      spentAt: now()
    };
  }

  function recoverMana(input) {
    if (!required(input, ["userId", "component", "amount", "evidenceId"])) {
      return { truth: TRUTH.BLOCKED, reason: "userId, component, amount and evidenceId are required" };
    }
    return {
      truth: TRUTH.VERIFIED,
      userId: input.userId,
      component: String(input.component),
      amount: Math.max(0, Math.min(100, Number(input.amount) || 0)),
      evidenceId: input.evidenceId,
      event: EVENTS.MANA_RECOVERED,
      recoveredAt: now()
    };
  }

  function representCivilization(input) {
    if (!required(input, ["userId", "visibility"])) {
      return { truth: TRUTH.BLOCKED, reason: "userId and visibility are required" };
    }
    const allowed = ["PRIVATE", "SHARED", "CIVILIZATION_AGGREGATE", "PUBLIC"];
    if (!allowed.includes(input.visibility)) {
      return { truth: TRUTH.BLOCKED, reason: "invalid visibility" };
    }
    return {
      truth: input.verified ? TRUTH.VERIFIED : TRUTH.USER_CREATED,
      userId: input.userId,
      visibility: input.visibility,
      city: input.city || null,
      country: input.country || null,
      civilization: input.civilization || null,
      services: Array.isArray(input.services) ? input.services.slice(0, 20) : [],
      roles: Array.isArray(input.roles) ? input.roles.slice(0, 12) : [],
      relationships: Array.isArray(input.relationships) ? input.relationships.slice(0, 20) : [],
      privacyRule: "Civilization representation never implies legal citizenship, sovereignty, ownership, rank, or authority.",
      generatedAt: now()
    };
  }

  root.OmegaRelearnSigilMana = Object.freeze({
    TRUTH, LIFECYCLE, EVENTS, createRelearn, verifyRelearn, createSigil,
    evolveSigil, calculateMana, spendMana, recoverMana, representCivilization
  });
})(typeof globalThis !== "undefined" ? globalThis : window);