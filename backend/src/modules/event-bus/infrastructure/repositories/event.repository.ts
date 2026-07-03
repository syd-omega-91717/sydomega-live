// ============================================================================
// FILE: /backend/src/modules/event-bus/infrastructure/repositories/event.repository.ts
// NEW FILE
// ============================================================================

import { EventBusAggregate }
from "../../domain/aggregates/event-bus.aggregate";

export interface EventRepository{

    save(

        aggregate:EventBusAggregate

    ):Promise<void>;

}
