// ============================================================================
// FILE:
// /enterprise/workflow/SchedulerEngine.ts
// ============================================================================

export class SchedulerEngine{

    schedule(

        workflowId:string,

        execution:number

    ){

        return{

            workflowId,

            execution

        };

    }

}
