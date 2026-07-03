// ============================================================================
// FILE: /backend/src/modules/governance/domain/entities/compliance-report.ts
// NEW FILE
// ============================================================================

export class ComplianceReport{

    constructor(

        readonly reportId:string,

        readonly framework:string,

        readonly generatedAt:Date,

        readonly passed:number,

        readonly failed:number

    ){}

}
