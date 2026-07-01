// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/register-oauth-client.command.ts
// NEW FILE
// ============================================================================

export class RegisterOAuthClientCommand{

    constructor(

        readonly clientName:string,

        readonly clientType:string,

        readonly redirectUris:string[],

        readonly scopes:string[]

    ){}

}
