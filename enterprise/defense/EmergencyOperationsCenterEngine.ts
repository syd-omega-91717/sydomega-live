// ============================================================================
// FILE:
// /enterprise/defense/EmergencyOperationsCenterEngine.ts
// ============================================================================

export class EmergencyOperationsCenterEngine{

    activate(

        operationId:string

    ){

        return{

            operationId,

            active:true

        };

    }

}
