// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/authorization-code-issued.event.ts
// NEW FILE
// ============================================================================

export class AuthorizationCodeIssuedEvent{

    constructor(

        readonly authorizationCodeId:string

    ){}

}
