// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/mfa-policy.repository.ts
// NEW FILE
// ============================================================================

import { MfaPolicyAggregate }
from "../../domain/aggregates/mfa-policy.aggregate";

export interface MfaPolicyRepository{

    save(

        aggregate:MfaPolicyAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<MfaPolicyAggregate|null>;

}
