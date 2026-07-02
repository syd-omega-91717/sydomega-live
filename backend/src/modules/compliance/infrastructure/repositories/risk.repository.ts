// ============================================================================
// FILE: /backend/src/modules/compliance/infrastructure/repositories/risk.repository.ts
// NEW FILE
// ============================================================================

import { RiskAggregate }
from "../../domain/aggregates/risk.aggregate";

export interface RiskRepository{

    save(

        aggregate:RiskAggregate

    ):Promise<void>;

    find(

        riskId:string

    ):Promise<RiskAggregate|null>;

    highestRisk(

    ):Promise<RiskAggregate[]>;

}
