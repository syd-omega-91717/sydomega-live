// ============================================================================
// FILE: /backend/src/modules/compliance/infrastructure/repositories/remediation.repository.ts
// NEW FILE
// ============================================================================

import { RemediationAggregate }
from "../../domain/aggregates/remediation.aggregate";

export interface RemediationRepository{

    save(

        aggregate:RemediationAggregate

    ):Promise<void>;

    active(

    ):Promise<RemediationAggregate[]>;

}
