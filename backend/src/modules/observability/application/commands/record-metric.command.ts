// ============================================================================
// FILE: /backend/src/modules/observability/application/commands/record-metric.command.ts
// NEW FILE
// ============================================================================

export class RecordMetricCommand{

    constructor(

        readonly metric:string,

        readonly value:number

    ){}

}
