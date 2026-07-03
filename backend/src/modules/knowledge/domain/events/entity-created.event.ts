// ============================================================================
// FILE: /backend/src/modules/knowledge/domain/events/entity-created.event.ts
// NEW FILE
// ============================================================================

export class EntityCreatedEvent{

    constructor(

        readonly entityId:string,

        readonly entityType:string

    ){}

}
