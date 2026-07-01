// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/approve-workflow-stage.command.ts
// NEW FILE
// ============================================================================

export class ApproveWorkflowStageCommand{

    constructor(

        readonly workflowId:string,

        readonly approverId:string

    ){}

}
