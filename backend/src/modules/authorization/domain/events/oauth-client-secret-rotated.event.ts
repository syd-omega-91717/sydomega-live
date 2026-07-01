// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/oauth-client-secret-rotated.event.ts
// NEW FILE
// ============================================================================

export class OAuthClientSecretRotatedEvent{

    constructor(

        readonly clientId:string

    ){}

}
