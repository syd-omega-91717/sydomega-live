// ============================================================================
// FILE: /backend/src/modules/governance/infrastructure/repositories/governance.repository.ts
// NEW FILE
// ============================================================================

import { GovernanceAggregate }
from "../../domain/aggregates/governance.aggregate";

export interface GovernanceRepository{

    save(

        aggregate:GovernanceAggregate

    ):Promise<void>;

    find(

        policyId:string

    ):Promise<GovernanceAggregate|null>;

}
