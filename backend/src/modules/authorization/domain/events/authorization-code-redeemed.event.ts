// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/authorization-code-redeemed.event.ts
// NEW FILE
// ============================================================================

export class AuthorizationCodeRedeemedEvent{

    constructor(

        readonly authorizationCodeId:string

    ){}

}
