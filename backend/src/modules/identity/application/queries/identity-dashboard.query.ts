// ============================================================================
// FILE: /backend/src/modules/identity/application/queries/identity-dashboard.query.ts
// NEW FILE
// ============================================================================

export class IdentityDashboardQuery{

    constructor(

        readonly tenantId:string,

        readonly from:Date,

        readonly to:Date

    ){}

}
