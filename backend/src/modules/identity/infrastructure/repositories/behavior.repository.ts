// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/behavior.repository.ts
// NEW FILE
// ============================================================================

import { BehaviorAggregate }
from "../../domain/aggregates/behavior.aggregate";

export interface BehaviorRepository{

    save(

        aggregate:BehaviorAggregate

    ):Promise<void>;

    find(

        userId:string

    ):Promise<BehaviorAggregate|null>;

}
