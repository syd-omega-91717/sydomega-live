// ============================================================================
// FILE: /backend/src/modules/workflow/domain/events/workflow-started.event.ts
// NEW FILE
// ============================================================================

export class WorkflowStartedEvent{

    constructor(

        readonly executionId:string,

        readonly workflowId:string

    ){}

}
