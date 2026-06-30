// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-policy-set.command.ts
// NEW FILE
// ============================================================================

export class CreatePolicySetCommand{

    constructor(

        readonly name:string,

        readonly algorithm:string

    ){}

}
