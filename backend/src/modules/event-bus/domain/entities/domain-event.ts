// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/entities/domain-event.ts
// NEW FILE
// ============================================================================

import { EventId }
from "../value-objects/event-id";

import { EventStatus }
from "../enums/event-status";

export class DomainEvent{

    constructor(

        readonly id:EventId,

        readonly topic:string,

        readonly aggregateId:string,

        readonly version:number,

        readonly status:EventStatus,

        readonly occurredAt:Date

    ){}

}
