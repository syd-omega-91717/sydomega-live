// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/token-revoked.event.ts
// NEW FILE
// ============================================================================

export class TokenRevokedEvent{

    constructor(

        readonly tokenId:string

    ){}

}
