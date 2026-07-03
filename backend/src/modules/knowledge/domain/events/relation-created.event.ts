// ============================================================================
// FILE: /backend/src/modules/knowledge/domain/events/relation-created.event.ts
// NEW FILE
// ============================================================================

export class RelationCreatedEvent{

    constructor(

        readonly relationId:string,

        readonly source:string,

        readonly target:string

    ){}

}
