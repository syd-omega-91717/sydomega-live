// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/compliance-kpi.ts
// NEW FILE
// ============================================================================

export class ComplianceKPI{

    constructor(

        readonly metric:string,

        readonly value:number,

        readonly trend:number,

        readonly target:number,

        readonly measuredAt:Date

    ){}

}
