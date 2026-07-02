// ============================================================================
// FILE: /backend/src/modules/audit/domain/events/event-appended.event.ts
// NEW FILE
// ============================================================================

export class EventAppendedEvent{

    constructor(

        readonly eventStoreId:string,

        readonly aggregateId:string

    ){}

}
