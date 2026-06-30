// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/add-policy-rule.command.ts
// NEW FILE
// ============================================================================

export class AddPolicyRuleCommand{

    constructor(

        readonly policySetId:string,

        readonly rule:unknown

    ){}

}
