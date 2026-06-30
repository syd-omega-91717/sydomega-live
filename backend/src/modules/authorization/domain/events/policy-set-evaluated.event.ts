// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/policy-set-evaluated.event.ts
// NEW FILE
// ============================================================================

export class PolicySetEvaluatedEvent{

    constructor(

        readonly subjectId:string,

        readonly policySetId:string,

        readonly decision:boolean

    ){}

}
