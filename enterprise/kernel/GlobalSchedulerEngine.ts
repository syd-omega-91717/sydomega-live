// ============================================================================
// FILE:
// /enterprise/kernel/GlobalSchedulerEngine.ts
// ============================================================================

export class GlobalSchedulerEngine{

    schedule(

        jobId:string

    ){

        return{

            jobId,

            scheduled:true

        };

    }

}
