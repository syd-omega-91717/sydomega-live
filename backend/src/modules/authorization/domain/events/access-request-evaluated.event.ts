// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/access-request-evaluated.event.ts
// NEW FILE
// ============================================================================

export class AccessRequestEvaluatedEvent{

    constructor(

        readonly subjectId:string,

        readonly permitted:boolean

    ){}

}
