// ============================================================================
// FILE: /backend/src/modules/workflow/domain/entities/workflow-log.ts
// NEW FILE
// ============================================================================

export class WorkflowLog{

    constructor(

        readonly executionId:string,

        readonly stepId:string,

        readonly level:string,

        readonly message:string,

        readonly timestamp:Date

    ){}

}
