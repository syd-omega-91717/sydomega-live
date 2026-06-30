// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/access-evaluated.event.ts
// NEW FILE
// ============================================================================

export class AccessEvaluatedEvent{

    constructor(

        readonly subjectId:string,

        readonly resource:string,

        readonly decision:boolean

    ){}

}
