// ============================================================================
// FILE: /backend/src/modules/workflow/application/commands/start-workflow.command.ts
// NEW FILE
// ============================================================================

export class StartWorkflowCommand{

    constructor(

        readonly workflowId:string,

        readonly triggerType:string

    ){}

}
