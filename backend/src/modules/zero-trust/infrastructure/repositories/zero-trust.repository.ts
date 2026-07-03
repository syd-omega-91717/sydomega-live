// ============================================================================
// FILE: /backend/src/modules/zero-trust/infrastructure/repositories/zero-trust.repository.ts
// NEW FILE
// ============================================================================

import { ZeroTrustAggregate }
from "../../domain/aggregates/zero-trust.aggregate";

export interface ZeroTrustRepository{

    save(

        aggregate:ZeroTrustAggregate

    ):Promise<void>;

}
