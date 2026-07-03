// ============================================================================
// FILE: /backend/src/modules/governance/domain/events/compliance-report-generated.event.ts
// NEW FILE
// ============================================================================

export class ComplianceReportGeneratedEvent{

    constructor(

        readonly reportId:string,

        readonly framework:string

    ){}

}
