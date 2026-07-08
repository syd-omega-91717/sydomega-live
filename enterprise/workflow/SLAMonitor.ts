// ============================================================================
// FILE:
// /enterprise/workflow/SLAMonitor.ts
// ============================================================================

export class SLAMonitor{

    monitor(

        workflowId:string

    ){

        return{

            workflowId,

            healthy:true,

            checkedAt:Date.now()

        };

    }

}
