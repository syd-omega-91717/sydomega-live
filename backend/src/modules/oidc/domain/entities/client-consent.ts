// ============================================================================
// FILE: /backend/src/modules/oidc/domain/entities/client-consent.ts
// NEW FILE
// ============================================================================

export class ClientConsent {

    constructor(

        readonly userId: string,

        readonly clientId: string,

        readonly scopes: string[],

        readonly grantedAt: Date

    ) {}

}
