// ============================================================================
// FILE: /backend/src/modules/iam/infrastructure/repositories/identity.repository.ts
// NEW FILE
// ============================================================================

import { IdentityAggregate }
from "../../domain/aggregates/identity.aggregate";

export interface IdentityRepository{

    save(

        aggregate:IdentityAggregate

    ):Promise<void>;

}
