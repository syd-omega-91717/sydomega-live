// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/entitlement-grant.ts
// NEW FILE
// ============================================================================

export class EntitlementGrant{

    constructor(

        readonly grantedBy:string,

        readonly justification:string,

        readonly ticket:string|null

    ){}

}
