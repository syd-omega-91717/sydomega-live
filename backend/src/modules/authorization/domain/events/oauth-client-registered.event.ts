// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/oauth-client-registered.event.ts
// NEW FILE
// ============================================================================

export class OAuthClientRegisteredEvent{

    constructor(

        readonly clientId:string

    ){}

}
