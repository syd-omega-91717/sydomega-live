// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/redeem-authorization-code.command.ts
// NEW FILE
// ============================================================================

export class RedeemAuthorizationCodeCommand{

    constructor(

        readonly code:string,

        readonly codeVerifier:string

    ){}

}
