(function (global) {
  "use strict";

  var TRUTH = Object.freeze({
    CALCULATED: "CALCULATED",
    LIVE: "LIVE",
    UNKNOWN: "UNKNOWN",
    UNVERIFIED: "UNVERIFIED",
    BLOCKED: "BLOCKED",
    READY: "READY_FOR_PRODUCTION"
  });

  var CRITICAL_GATES = Object.freeze([
    "architecture_health",
    "identity_authorization",
    "event_fabric",
    "evidence_fabric",
    "provider_health",
    "deployment_health",
    "security_hardening",
    "verification"
  ]);

  function asBool(value) {
    return value === true;
  }

  function normalizeGate(gate) {
    return {
      id: String(gate && gate.id || "unknown"),
      severity: String(gate && gate.severity || "HIGH"),
      passed: asBool(gate && gate.passed),
      waived: asBool(gate && gate.waived),
      evidence: Array.isArray(gate && gate.evidence) ? gate.evidence.slice() : [],
      reasons: Array.isArray(gate && gate.reasons) ? gate.reasons.slice() : []
    };
  }

  function assess(input) {
    input = input || {};
    var gates = Array.isArray(input.gates) ? input.gates.map(normalizeGate) : [];
    var gateMap = Object.create(null);

    gates.forEach(function (gate) {
      gateMap[gate.id] = gate;
    });

    var missing = [];
    var blocked = [];
    var warnings = [];

    CRITICAL_GATES.forEach(function (id) {
      var gate = gateMap[id];
      if (!gate) {
        missing.push(id);
        blocked.push(id + ": missing critical gate");
        return;
      }
      if (!gate.passed && !gate.waived) {
        blocked.push(id + ": " + (gate.reasons.join("; ") || "not verified"));
      }
    });

    gates.forEach(function (gate) {
      if (gate.waived && gate.evidence.length === 0) {
        blocked.push(gate.id + ": waiver has no evidence");
      }
      if (!gate.passed && gate.severity !== "CRITICAL" && !gate.waived) {
        warnings.push(gate.id + ": " + (gate.reasons.join("; ") || "remediation required"));
      }
    });

    var state = blocked.length === 0 ? TRUTH.READY : TRUTH.BLOCKED;

    return {
      truth: TRUTH.CALCULATED,
      state: state,
      promotionAllowed: state === TRUTH.READY,
      gates: gates,
      missingCriticalGates: missing,
      blockers: blocked,
      warnings: warnings,
      evaluatedAt: new Date().toISOString()
    };
  }

  function assessCapability(input) {
    input = input || {};
    var base = assess(input);
    var truthState = String(input.capabilityTruth || TRUTH.UNKNOWN);
    var liveEvidence = asBool(input.productionEvidence);
    var runtimeImplemented = asBool(input.runtimeImplemented);

    if (truthState === "SIMULATED" || truthState === "LORE" || truthState === "DESIGN_PROPOSAL") {
      base.state = TRUTH.BLOCKED;
      base.promotionAllowed = false;
      base.blockers.push("capability truth state cannot be LIVE: " + truthState);
    }

    if (!runtimeImplemented) {
      base.state = TRUTH.BLOCKED;
      base.promotionAllowed = false;
      base.blockers.push("runtime implementation is not verified");
    }

    if (!liveEvidence) {
      base.state = TRUTH.BLOCKED;
      base.promotionAllowed = false;
      base.blockers.push("production evidence is missing");
    }

    base.capabilityTruth = truthState;
    return base;
  }

  function buildEvidenceBundle(input) {
    input = input || {};
    var required = Array.isArray(input.requiredEvidence) ? input.requiredEvidence : [];
    var supplied = Array.isArray(input.suppliedEvidence) ? input.suppliedEvidence : [];
    var suppliedSet = Object.create(null);

    supplied.forEach(function (item) {
      suppliedSet[String(item)] = true;
    });

    var missing = required.filter(function (item) {
      return !suppliedSet[String(item)];
    });

    return {
      truth: TRUTH.CALCULATED,
      complete: missing.length === 0,
      required: required.slice(),
      supplied: supplied.slice(),
      missing: missing,
      state: missing.length === 0 ? TRUTH.READY : TRUTH.BLOCKED
    };
  }

  function cycleCompleteness(deliverables) {
    var list = Array.isArray(deliverables) ? deliverables : [];
    var seen = Object.create(null);

    list.forEach(function (item) {
      if (item && item.id && item.complete === true) {
        seen[String(item.id)] = true;
      }
    });

    var total = 20;
    var complete = Object.keys(seen).length;
    return {
      truth: TRUTH.CALCULATED,
      complete,
      total,
      percentage: Math.round((complete / total) * 10000) / 100,
      closed: complete === total
    };
  }

  function createReleaseDecision(input) {
    input = input || {};
    var capability = assessCapability(input);
    var evidence = buildEvidenceBundle({
      requiredEvidence: input.requiredEvidence,
      suppliedEvidence: input.suppliedEvidence
    });
    var cycle = cycleCompleteness(input.deliverables);

    var blockers = capability.blockers.slice();
    if (!evidence.complete) {
      blockers.push("evidence bundle incomplete");
    }

    if (input.requireCycleClosure === true && !cycle.closed) {
      blockers.push("enhancement cycle incomplete: " + cycle.complete + "/20 deliverables");
    }

    var allowed = blockers.length === 0;
    return {
      truth: TRUTH.CALCULATED,
      state: allowed ? TRUTH.READY : TRUTH.BLOCKED,
      promotionAllowed: allowed,
      capability: capability,
      evidence: evidence,
      cycle: cycle,
      blockers: blockers,
      release: {
        commit: input.commit ? String(input.commit) : null,
        environment: input.environment ? String(input.environment) : null,
        provider: input.provider ? String(input.provider) : null
      }
    };
  }

  global.OmegaProductionAssurance = Object.freeze({
    TRUTH: TRUTH,
    assess: assess,
    assessCapability: assessCapability,
    buildEvidenceBundle: buildEvidenceBundle,
    cycleCompleteness: cycleCompleteness,
    createReleaseDecision: createReleaseDecision
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
