// ============================================================================
// FILE:
// /enterprise/automation/WorkflowBotEngine.ts
// ============================================================================

export class WorkflowBotEngine{

    start(

        workflowId:string

    ){

        return{

            workflowId,

            running:true

        };

    }

}
