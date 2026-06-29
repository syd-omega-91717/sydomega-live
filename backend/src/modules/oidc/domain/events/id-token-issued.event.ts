// ============================================================================
// FILE: /backend/src/modules/oidc/domain/events/id-token-issued.event.ts
// NEW FILE
// ============================================================================

export class IdTokenIssuedEvent {

    constructor(

        readonly sessionId: string,

        readonly subject: string

    ) {}

}
