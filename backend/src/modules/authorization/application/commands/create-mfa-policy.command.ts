// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-mfa-policy.command.ts
// NEW FILE
// ============================================================================

export class CreateMfaPolicyCommand{

    constructor(

        readonly name:string,

        readonly methods:string[],

        readonly adaptive:boolean

    ){}

}
