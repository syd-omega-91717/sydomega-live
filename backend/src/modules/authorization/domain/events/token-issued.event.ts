// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/token-issued.event.ts
// NEW FILE
// ============================================================================

export class TokenIssuedEvent{

    constructor(

        readonly tokenId:string

    ){}

}
