// ============================================================================
// FILE:
// /enterprise/automation/DigitalWorkerEngine.ts
// ============================================================================

export class DigitalWorkerEngine{

    assign(

        workerId:string,

        task:string

    ){

        return{

            workerId,

            task,

            accepted:true

        };

    }

}
