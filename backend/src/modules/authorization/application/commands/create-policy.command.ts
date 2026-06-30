// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-policy.command.ts
// NEW FILE
// ============================================================================

export class CreatePolicyCommand{

    constructor(

        readonly name:string,

        readonly resource:string,

        readonly action:string,

        readonly effect:string,

        readonly conditions:unknown[]

    ){}

}
