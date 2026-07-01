// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/workflow-stage-rejected.event.ts
// NEW FILE
// ============================================================================

export class WorkflowStageRejectedEvent{

    constructor(

        readonly workflowId:string,

        readonly stage:number

    ){}

}
