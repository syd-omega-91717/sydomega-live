// ============================================================================
// FILE: /backend/src/modules/guardrails/infrastructure/repositories/policy.repository.ts
// NEW FILE
// ============================================================================

import { GuardrailAggregate }
from "../../domain/aggregates/guardrail.aggregate";

export interface PolicyRepository{

    save(

        aggregate:GuardrailAggregate

    ):Promise<void>;

    find(

        policyId:string

    ):Promise<GuardrailAggregate|null>;

}
