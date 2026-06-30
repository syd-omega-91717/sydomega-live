// ============================================================================
// FILE: /backend/src/modules/saml/domain/events/saml-logout.event.ts
// NEW FILE
// ============================================================================

export class SamlLogoutEvent {

    constructor(

        readonly sessionId: string

    ) {}

}
