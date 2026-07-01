// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/workflow-stage-approved.event.ts
// NEW FILE
// ============================================================================

export class WorkflowStageApprovedEvent{

    constructor(

        readonly workflowId:string,

        readonly stage:number

    ){}

}
