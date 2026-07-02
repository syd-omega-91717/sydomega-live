// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/refresh-token-issued.event.ts
// NEW FILE
// ============================================================================

export class RefreshTokenIssuedEvent{

    constructor(

        readonly refreshTokenId:string

    ){}

}
