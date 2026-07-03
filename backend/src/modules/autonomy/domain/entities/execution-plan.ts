// ============================================================================
// FILE: /backend/src/modules/autonomy/domain/entities/execution-plan.ts
// NEW FILE
// ============================================================================

export class ExecutionPlan{

    constructor(

        readonly missionId:string,

        readonly graphVersion:number,

        readonly estimatedDuration:number,

        readonly parallelGroups:number,

        readonly generatedAt:Date

    ){}

}
