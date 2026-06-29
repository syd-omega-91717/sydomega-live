// ============================================================================
// FILE: /backend/src/modules/oidc/application/commands/consent/grant-consent.command.ts
// NEW FILE
// ============================================================================

export class GrantConsentCommand {

    constructor(

        readonly userId: string,

        readonly clientId: string,

        readonly scopes: string[]

    ) {}

}
