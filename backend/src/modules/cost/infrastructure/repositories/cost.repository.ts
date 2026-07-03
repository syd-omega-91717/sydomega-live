// ============================================================================
// FILE: /backend/src/modules/cost/infrastructure/repositories/cost.repository.ts
// NEW FILE
// ============================================================================

import { CostAggregate }
from "../../domain/aggregates/cost.aggregate";

export interface CostRepository{

    save(

        aggregate:CostAggregate

    ):Promise<void>;

    currentBudget(

        tenantId:string

    ):Promise<CostAggregate|null>;

}
