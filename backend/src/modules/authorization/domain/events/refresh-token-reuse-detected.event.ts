// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/refresh-token-reuse-detected.event.ts
// NEW FILE
// ============================================================================

export class RefreshTokenReuseDetectedEvent{

    constructor(

        readonly refreshTokenId:string,

        readonly principalId:string

    ){}

}
