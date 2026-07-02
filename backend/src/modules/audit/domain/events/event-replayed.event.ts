// ============================================================================
// FILE: /backend/src/modules/audit/domain/events/event-replayed.event.ts
// NEW FILE
// ============================================================================

export class EventReplayedEvent{

    constructor(

        readonly aggregateId:string

    ){}

}
