// ============================================================================
// FILE: /backend/src/modules/digital-twin/domain/entities/simulation-job.ts
// NEW FILE
// ============================================================================

export class SimulationJob{

    constructor(

        readonly jobId:string,

        readonly twinId:string,

        readonly scenario:string,

        readonly startedAt:Date,

        readonly completed:boolean

    ){}

}
