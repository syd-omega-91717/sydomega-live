// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/oauth-client-secret.ts
// NEW FILE
// ============================================================================

export class OAuthClientSecret{

    constructor(

        readonly clientId:string,

        readonly secretHash:string,

        readonly createdAt:Date,

        readonly expiresAt:Date|null

    ){}

}
