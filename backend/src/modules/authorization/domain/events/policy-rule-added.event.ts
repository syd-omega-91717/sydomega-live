// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/policy-rule-added.event.ts
// NEW FILE
// ============================================================================

export class PolicyRuleAddedEvent{

    constructor(

        readonly policySetId:string,

        readonly ruleId:string

    ){}

}
