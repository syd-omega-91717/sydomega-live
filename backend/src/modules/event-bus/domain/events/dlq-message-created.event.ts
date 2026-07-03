// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/events/dlq-message-created.event.ts
// NEW FILE
// ============================================================================

export class DLQMessageCreatedEvent{

    constructor(

        readonly messageId:string,

        readonly topic:string

    ){}

}
