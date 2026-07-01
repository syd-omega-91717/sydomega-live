// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/add-sod-rule.command.ts
// NEW FILE
// ============================================================================

export class AddSodRuleCommand{

    constructor(

        readonly policyId:string,

        readonly leftRoleId:string,

        readonly rightRoleId:string,

        readonly severity:string

    ){}

}
