// ============================================================================
// FILE: /backend/src/modules/governance/domain/events/policy-approved.event.ts
// NEW FILE
// ============================================================================

export class PolicyApprovedEvent{

    constructor(

        readonly policyId:string,

        readonly approver:string

    ){}

}
