// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/id-token-issued.event.ts
// NEW FILE
// ============================================================================

export class IdTokenIssuedEvent{

    constructor(

        readonly subject:string

    ){}

}
