// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/ProcessController.ts
// ============================================================================

export class ProcessController{

    start(

        processId:string

    ){

        return{

            processId,

            state:"RUNNING"

        };

    }

    stop(

        processId:string

    ){

        return{

            processId,

            state:"STOPPED"

        };

    }

}
