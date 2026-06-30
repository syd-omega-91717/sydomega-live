// ============================================================================
// FILE: /backend/src/modules/saml/domain/events/saml-login.event.ts
// NEW FILE
// ============================================================================

export class SamlLoginEvent {

    constructor(

        readonly sessionId: string,

        readonly subject: string

    ) {}

}
