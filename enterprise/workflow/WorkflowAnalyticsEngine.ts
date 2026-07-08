// ============================================================================
// FILE:
// /enterprise/workflow/WorkflowAnalyticsEngine.ts
// ============================================================================

export class WorkflowAnalyticsEngine{

    summarize(

        workflowId:string

    ){

        return{

            workflowId,

            completed:0,

            running:0,

            failed:0

        };

    }

}
