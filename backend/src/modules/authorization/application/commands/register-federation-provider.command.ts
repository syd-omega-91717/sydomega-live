// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/register-federation-provider.command.ts
// NEW FILE
// ============================================================================

export class RegisterFederationProviderCommand{

    constructor(

        readonly name:string,

        readonly protocol:string,

        readonly issuer:string,

        readonly metadataUrl:string

    ){}

}
