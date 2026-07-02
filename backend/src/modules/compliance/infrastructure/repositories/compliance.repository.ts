// ============================================================================
// FILE: /backend/src/modules/compliance/infrastructure/repositories/compliance.repository.ts
// NEW FILE
// ============================================================================

import { ComplianceAggregate }
from "../../domain/aggregates/compliance.aggregate";

export interface ComplianceRepository{

    save(

        aggregate:ComplianceAggregate

    ):Promise<void>;

    find(

        controlId:string

    ):Promise<ComplianceAggregate|null>;

}
