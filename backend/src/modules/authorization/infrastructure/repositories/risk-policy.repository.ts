// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/risk-policy.repository.ts
// NEW FILE
// ============================================================================

import { RiskPolicyAggregate }
from "../../domain/aggregates/risk-policy.aggregate";

export interface RiskPolicyRepository{

    save(

        aggregate:RiskPolicyAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<RiskPolicyAggregate|null>;

}
