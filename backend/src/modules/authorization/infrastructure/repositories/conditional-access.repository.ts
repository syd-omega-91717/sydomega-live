// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/conditional-access.repository.ts
// NEW FILE
// ============================================================================

import { ConditionalAccessAggregate }
from "../../domain/aggregates/conditional-access.aggregate";

export interface ConditionalAccessRepository{

    save(

        aggregate:ConditionalAccessAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<ConditionalAccessAggregate|null>;

    enabled(

    ):Promise<ConditionalAccessAggregate[]>;

}
