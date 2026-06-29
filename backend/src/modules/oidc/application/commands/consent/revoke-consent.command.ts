// ============================================================================
// FILE: /backend/src/modules/oidc/application/commands/consent/revoke-consent.command.ts
// NEW FILE
// ============================================================================

export class RevokeConsentCommand {

    constructor(

        readonly userId: string,

        readonly clientId: string

    ) {}

}
