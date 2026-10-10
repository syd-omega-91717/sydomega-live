const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const runtime = fs.readFileSync("omega-production-assurance.js", "utf8");
const context = { console, Date, globalThis: {} };
vm.runInNewContext(runtime, context);

const api = context.globalThis.OmegaProductionAssurance;
assert.ok(api, "OmegaProductionAssurance must be exposed");

const criticalPass = [
  "architecture_health",
  "identity_authorization",
  "event_fabric",
  "evidence_fabric",
  "provider_health",
  "deployment_health",
  "security_hardening",
  "verification"
].map((id) => ({ id, severity: "CRITICAL", passed: true, evidence: [id] }));

const baseInput = {
  capabilityTruth: "LIVE",
  runtimeImplemented: true,
  productionEvidence: true,
  requiredEvidence: ["automated_contract_tests", "deployment_evidence"],
  suppliedEvidence: ["automated_contract_tests", "deployment_evidence"],
  deliverables: Array.from({ length: 20 }, (_, i) => ({
    id: [
      "current_state_assessment","gap_analysis","benchmark_comparison","improvement_opportunities",
      "architectural_recommendations","technical_specifications","database_modifications","codebase_impact",
      "security_implications","legal_compliance_considerations","ui_ux_enhancements","ai_integration_opportunities",
      "performance_improvements","risk_assessment","cost_benefit_analysis","implementation_roadmap",
      "migration_strategy","testing_strategy","documentation_updates","future_scalability_recommendations"
    ][i],
    complete: true
  })),
  commit: "test-sha",
  environment: "production",
  provider: "verified-provider"
};

const ready = api.createReleaseDecision({
  ...baseInput,
  gates: criticalPass,
  requireCycleClosure: true
});
assert.equal(ready.state, "READY_FOR_PRODUCTION");
assert.equal(ready.promotionAllowed, true);
assert.equal(ready.cycle.closed, true);

const blocked = api.createReleaseDecision({
  ...baseInput,
  gates: criticalPass.filter((gate) => gate.id !== "provider_health"),
  requireCycleClosure: false
});
assert.equal(blocked.state, "BLOCKED");
assert.ok(blocked.blockers.some((x) => x.includes("provider_health")));

const simulated = api.createReleaseDecision({
  ...baseInput,
  gates: criticalPass,
  capabilityTruth: "SIMULATED"
});
assert.equal(simulated.state, "BLOCKED");
assert.equal(simulated.promotionAllowed, false);

const incompleteEvidence = api.createReleaseDecision({
  ...baseInput,
  gates: criticalPass,
  suppliedEvidence: ["deployment_evidence"]
});
assert.equal(incompleteEvidence.state, "BLOCKED");
assert.ok(incompleteEvidence.blockers.includes("evidence bundle incomplete"));

const incompleteCycle = api.createReleaseDecision({
  ...baseInput,
  gates: criticalPass,
  requireCycleClosure: true,
  deliverables: baseInput.deliverables.slice(0, 19)
});
assert.equal(incompleteCycle.state, "BLOCKED");
assert.equal(incompleteCycle.cycle.complete, 19);

console.log("OMEGA_PRODUCTION_ASSURANCE=PASS");
