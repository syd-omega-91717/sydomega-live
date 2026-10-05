(function (global) {
  "use strict";

  var TRUTH = Object.freeze({
    USER_CREATED: "USER_CREATED",
    OBSERVED: "OBSERVED",
    CALCULATED: "CALCULATED",
    INFERRED: "INFERRED",
    VERIFIED: "VERIFIED",
    BLOCKED: "BLOCKED",
    UNAVAILABLE: "UNAVAILABLE"
  });

  var RISK = Object.freeze({
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL"
  });

  var MODES = Object.freeze({
    ADVISORY: "ADVISORY",
    ASSISTED: "ASSISTED",
    SUPERVISED_AUTOMATION: "SUPERVISED_AUTOMATION",
    AUTOMATION: "AUTOMATION"
  });

  function text(value, fallback) {
    return value === undefined || value === null ? fallback : String(value);
  }

  function list(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function createIdea(input) {
    input = input || {};
    var title = text(input.title, "").trim();
    if (!title) {
      return { truth: TRUTH.BLOCKED, state: "REJECTED", reasons: ["idea title is required"] };
    }

    return {
      truth: TRUTH.USER_CREATED,
      state: "CAPTURED",
      idea: {
        id: text(input.id, "idea-" + Date.now()),
        title: title,
        description: text(input.description, ""),
        domain: text(input.domain, "general"),
        author: text(input.author, "authenticated-user"),
        tags: list(input.tags),
        createdAt: new Date().toISOString()
      },
      next: ["CLARIFY", "EVALUATE"]
    };
  }

  function buildLifeGoal(input) {
    input = input || {};
    var goal = text(input.goal, "").trim();
    if (!goal) {
      return { truth: TRUTH.BLOCKED, state: "REJECTED", reasons: ["goal is required"] };
    }

    return {
      truth: TRUTH.USER_CREATED,
      state: "USER_DEFINED",
      goal: goal,
      domain: text(input.domain, "general"),
      constraints: list(input.constraints),
      desiredOutcome: text(input.desiredOutcome, ""),
      reviewDate: input.reviewDate ? String(input.reviewDate) : null
    };
  }

  function classifyAction(input) {
    input = input || {};
    var category = text(input.category, "informational").toLowerCase();
    var irreversible = input.irreversible === true;
    var physical = input.physical === true;
    var financial = input.financial === true;
    var legal = input.legal === true;
    var privileged = input.privileged === true;

    if (physical || legal || privileged || (financial && irreversible)) {
      return RISK.CRITICAL;
    }
    if (financial || irreversible) {
      return RISK.HIGH;
    }
    if (category === "account" || category === "communication" || category === "device") {
      return RISK.MEDIUM;
    }
    return RISK.LOW;
  }

  function authorizeAgentAction(input) {
    input = input || {};
    var risk = classifyAction(input);
    var mode = text(input.mode, MODES.ADVISORY);
    var authorized = input.authorized === true;
    var humanApproved = input.humanApproved === true;
    var capabilityEnabled = input.capabilityEnabled === true;
    var scopeGranted = input.scopeGranted === true;

    var reasons = [];
    if (!authorized) reasons.push("authorization missing");
    if (!capabilityEnabled) reasons.push("capability disabled");
    if (!scopeGranted) reasons.push("scope not granted");

    if ((risk === RISK.HIGH || risk === RISK.CRITICAL) && !humanApproved) {
      reasons.push("human approval required");
    }

    var allowed = reasons.length === 0 && (
      mode === MODES.ADVISORY ||
      mode === MODES.ASSISTED ||
      mode === MODES.SUPERVISED_AUTOMATION ||
      mode === MODES.AUTOMATION
    );

    return {
      truth: TRUTH.CALCULATED,
      risk: risk,
      mode: mode,
      state: allowed ? "AUTHORIZED_FOR_RUNTIME" : TRUTH.BLOCKED,
      allowed: allowed,
      reasons: reasons
    };
  }

  function createRobotCommand(input) {
    input = input || {};
    var robotId = text(input.robotId, "").trim();
    var command = text(input.command, "").trim();
    var safetyState = text(input.safetyState, "UNKNOWN").toUpperCase();

    if (!robotId || !command) {
      return { truth: TRUTH.BLOCKED, state: "REJECTED", reasons: ["robotId and command are required"] };
    }

    var risk = classifyAction({
      physical: true,
      irreversible: input.irreversible === true,
      category: "robotics"
    });

    var blockers = [];
    if (input.identityVerified !== true) blockers.push("device identity not verified");
    if (input.capabilityEnabled !== true) blockers.push("robot capability not enabled");
    if (input.authorizationVerified !== true) blockers.push("command authorization not verified");
    if (input.humanApproved !== true) blockers.push("human approval not verified");
    if (safetyState !== "SAFE") blockers.push("robot safety state is not SAFE");

    return {
      truth: TRUTH.CALCULATED,
      state: blockers.length === 0 ? "READY_FOR_GOVERNED_EXECUTION" : TRUTH.BLOCKED,
      allowed: blockers.length === 0,
      risk: risk,
      robotId: robotId,
      command: command,
      safetyState: safetyState,
      blockers: blockers,
      requiredEvents: ["action_started", "action_completed"],
      requiredEvidence: ["device_identity", "authorization", "safety_state", "telemetry", "result"]
    };
  }

  function summarizePersona(input) {
    input = input || {};
    return {
      truth: TRUTH.USER_CREATED,
      state: "USER_AUTHORED",
      name: text(input.name, "Ω User"),
      values: list(input.values),
      communicationStyle: text(input.communicationStyle, "user-defined"),
      interests: list(input.interests),
      boundaries: list(input.boundaries),
      preferredAgents: list(input.preferredAgents),
      note: "This is a user-authored preference surface, not a psychological diagnosis or hidden behavioral profile."
    };
  }

  global.OmegaHumanAgency = Object.freeze({
    TRUTH: TRUTH,
    RISK: RISK,
    MODES: MODES,
    createIdea: createIdea,
    buildLifeGoal: buildLifeGoal,
    classifyAction: classifyAction,
    authorizeAgentAction: authorizeAgentAction,
    createRobotCommand: createRobotCommand,
    summarizePersona: summarizePersona
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
