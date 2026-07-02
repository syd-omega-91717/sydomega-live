// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/jwk-rotated.event.ts
// NEW FILE
// ============================================================================

export class JwkRotatedEvent{

    constructor(

        readonly keyId:string

    ){}

}
