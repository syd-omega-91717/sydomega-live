// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/update-policy.command.ts
// NEW FILE
// ============================================================================

export class UpdatePolicyCommand{

    constructor(

        readonly policyId:string,

        readonly changes:unknown

    ){}

}
