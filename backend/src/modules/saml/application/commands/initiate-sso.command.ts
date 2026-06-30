// ============================================================================
// FILE: /backend/src/modules/saml/application/commands/initiate-sso.command.ts
// NEW FILE
// ============================================================================

export class InitiateSsoCommand {

    constructor(

        readonly providerId: string,

        readonly relayState?: string

    ) {}

}
