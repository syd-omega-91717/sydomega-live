// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/risk.repository.ts
// NEW FILE
// ============================================================================

import { RiskAggregate }
from "../../domain/aggregates/risk.aggregate";

export interface RiskRepository{

    save(

        aggregate:RiskAggregate

    ):Promise<void>;

    find(

        userId:string

    ):Promise<RiskAggregate|null>;

}
