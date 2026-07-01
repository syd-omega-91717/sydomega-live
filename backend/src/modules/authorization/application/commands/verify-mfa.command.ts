// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/verify-mfa.command.ts
// NEW FILE
// ============================================================================

export class VerifyMfaCommand{

    constructor(

        readonly challengeId:string,

        readonly response:string

    ){}

}
