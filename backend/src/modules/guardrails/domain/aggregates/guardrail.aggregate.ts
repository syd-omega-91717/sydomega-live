// ============================================================================
// FILE: /backend/src/modules/guardrails/domain/aggregates/guardrail.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { PolicyId }
from "../value-objects/policy-id";

export class GuardrailAggregate
extends AggregateRoot<PolicyId>{

    validateInput(){}

    detectThreats(){}

    calculateRisk(){}

    enforcePolicy(){}

    audit(){}

}
