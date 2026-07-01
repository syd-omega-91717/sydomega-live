// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/grant-entitlement.command.ts
// NEW FILE
// ============================================================================

export class GrantEntitlementCommand{

    constructor(

        readonly principalId:string,

        readonly resource:string,

        readonly action:string,

        readonly expiresAt:Date|null

    ){}

}
