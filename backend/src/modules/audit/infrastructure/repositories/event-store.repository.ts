// ============================================================================
// FILE: /backend/src/modules/audit/infrastructure/repositories/event-store.repository.ts
// NEW FILE
// ============================================================================

import { EventStoreAggregate }
from "../../domain/aggregates/event-store.aggregate";

export interface EventStoreRepository{

    save(

        aggregate:EventStoreAggregate

    ):Promise<void>;

    stream(

        aggregateId:string

    ):Promise<EventStoreAggregate[]>;

}
