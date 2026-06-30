// ============================================================================
// FILE: /backend/src/modules/audit/application/queries/audit-search.query.ts
// NEW FILE
// ============================================================================

export class AuditSearchQuery{

    constructor(

        readonly tenantId:string,

        readonly actorId?:string,

        readonly resource?:string,

        readonly from?:Date,

        readonly to?:Date

    ){}

}
