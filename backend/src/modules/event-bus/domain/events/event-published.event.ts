// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/events/event-published.event.ts
// NEW FILE
// ============================================================================

export class EventPublishedEvent{

    constructor(

        readonly eventId:string,

        readonly topic:string

    ){}

}
