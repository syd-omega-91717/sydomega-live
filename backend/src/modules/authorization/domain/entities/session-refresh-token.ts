// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/session-refresh-token.ts
// NEW FILE
// ============================================================================

export class SessionRefreshToken{

    constructor(

        readonly sessionId:string,

        readonly tokenId:string,

        readonly expiresAt:Date,

        readonly revoked:boolean

    ){}

}
