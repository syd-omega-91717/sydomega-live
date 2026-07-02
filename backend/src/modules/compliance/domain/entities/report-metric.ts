// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/report-metric.ts
// NEW FILE
// ============================================================================

export class ReportMetric{

    constructor(

        readonly metric:string,

        readonly value:number,

        readonly previous:number,

        readonly variance:number

    ){}

}
