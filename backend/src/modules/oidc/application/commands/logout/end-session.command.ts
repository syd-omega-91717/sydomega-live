// ============================================================================
// FILE: /backend/src/modules/oidc/application/commands/logout/end-session.command.ts
// NEW FILE
// ============================================================================

export class EndSessionCommand {

    constructor(

        readonly idTokenHint: string,

        readonly postLogoutRedirectUri?: string,

        readonly state?: string

    ) {}

}
