// ============================================================================
// FILE:
// /enterprise/manufacturing/SCADAEngine.ts
// ============================================================================

export class SCADAEngine{

    monitor(

        controllerId:string

    ){

        return{

            controllerId,

            connected:true

        };

    }

}
