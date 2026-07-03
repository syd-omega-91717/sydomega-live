// ============================================================================
// FILE:
// /backend/src/modules/governance/policy-engine.ts
// ============================================================================

export interface PolicyEngine{

    evaluatePolicy();

    validateCompliance();

    enforcePolicy();

    auditDecision();

}
