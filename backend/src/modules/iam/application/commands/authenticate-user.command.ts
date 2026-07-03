// ============================================================================
// FILE: /backend/src/modules/iam/application/commands/authenticate-user.command.ts
// NEW FILE
// ============================================================================

export class AuthenticateUserCommand{

    constructor(

        readonly username:string,

        readonly credential:string

    ){}

}
