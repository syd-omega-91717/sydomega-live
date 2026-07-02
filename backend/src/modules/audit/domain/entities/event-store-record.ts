// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/event-store-record.ts
// NEW FILE
// ============================================================================

import { EventStoreId }
from "../value-objects/event-store-id";

import { EventStoreStatus }
from "../enums/event-store-status";

export class EventStoreRecord{

    constructor(

        readonly id:EventStoreId,

        readonly aggregateId:string,

        readonly aggregateType:string,

        readonly eventType:string,

        readonly eventVersion:number,

        readonly payload:string,

        readonly checksum:string,

        readonly status:EventStoreStatus,

        readonly occurredAt:Date

    ){}

}
