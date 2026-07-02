// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/rollback-plan.ts
// NEW FILE
// ============================================================================

export class RollbackPlan{

    constructor(

        readonly rollbackId:string,

        readonly executionId:string,

        readonly version:string,

        readonly rollbackSteps:number,

        readonly approved:boolean

    ){}

}
