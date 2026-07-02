// ============================================================================
// FILE: /backend/src/modules/ai/infrastructure/repositories/routing.repository.ts
// NEW FILE
// ============================================================================

import { RoutingAggregate }
from "../../domain/aggregates/routing.aggregate";

export interface RoutingRepository{

    save(

        aggregate:RoutingAggregate

    ):Promise<void>;

    history(

    ):Promise<RoutingAggregate[]>;

}
