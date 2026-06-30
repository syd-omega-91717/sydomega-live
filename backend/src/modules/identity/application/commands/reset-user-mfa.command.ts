// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/reset-user-mfa.command.ts
// NEW FILE
// ============================================================================

export class ResetUserMfaCommand{

    constructor(

        readonly administratorId:string,

        readonly userId:string

    ){}

}
