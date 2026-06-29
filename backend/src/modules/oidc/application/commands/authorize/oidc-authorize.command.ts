// ============================================================================
// FILE: /backend/src/modules/oidc/application/commands/authorize/oidc-authorize.command.ts
// NEW FILE
// ============================================================================

export class OidcAuthorizeCommand {

    constructor(

        readonly clientId: string,

        readonly redirectUri: string,

        readonly scope: string,

        readonly state: string,

        readonly nonce: string,

        readonly codeChallenge?: string

    ) {}

}
