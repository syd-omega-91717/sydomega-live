// ============================================================================
// FILE:
// /backend/src/modules/oauth/domain/aggregates/oauth-client.aggregate.ts
// NEW FILE
// ============================================================================

export class OAuthClientAggregate
extends AggregateRoot<ClientId>{

    register(){}

    rotateSecret(){}

    revoke(){}

    addRedirectUri(){}

    removeRedirectUri(){}

}
