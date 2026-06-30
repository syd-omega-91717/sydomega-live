// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/identity-event.repository.ts
// NEW FILE
// ============================================================================

import { IdentityEventAggregate }
from "../../domain/aggregates/identity-event.aggregate";

export interface IdentityEventRepository{

    save(

        aggregate:IdentityEventAggregate

    ):Promise<void>;

    findTimeline(

        userId:string

    ):Promise<IdentityEventAggregate[]>;

}
