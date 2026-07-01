// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-conditional-access-policy.command.ts
// NEW FILE
// ============================================================================

export class CreateConditionalAccessPolicyCommand{

    constructor(

        readonly name:string,

        readonly priority:number,

        readonly result:string

    ){}

}
