// ============================================================================
// FILE: /backend/src/modules/guardrails/domain/events/policy-triggered.event.ts
// NEW FILE
// ============================================================================

export class PolicyTriggeredEvent{

    constructor(

        readonly policyId:string,

        readonly action:string

    ){}

}
