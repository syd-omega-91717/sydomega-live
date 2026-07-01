// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/conditional-access-evaluated.event.ts
// NEW FILE
// ============================================================================

export class ConditionalAccessEvaluatedEvent{

    constructor(

        readonly principalId:string,

        readonly result:string

    ){}

}
