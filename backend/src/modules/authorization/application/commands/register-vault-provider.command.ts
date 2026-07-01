// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/register-vault-provider.command.ts
// NEW FILE
// ============================================================================

export class RegisterVaultProviderCommand{

    constructor(

        readonly name:string,

        readonly type:string,

        readonly endpoint:string

    ){}

}
