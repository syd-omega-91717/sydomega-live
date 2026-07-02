// ============================================================================
// FILE: /backend/src/modules/audit/application/services/event-store.service.ts
// NEW FILE
// ============================================================================

import { EventStoreRecord }
from "../../domain/entities/event-store-record";

export interface EventStoreService{

    append(

        event:EventStoreRecord

    ):Promise<void>;

    replay(

        aggregateId:string

    ):Promise<EventStoreRecord[]>;

}
