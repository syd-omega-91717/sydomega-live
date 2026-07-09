// ============================================================================
// FILE:
// /enterprise/transport/RailOperationsEngine.ts
// ============================================================================

export class RailOperationsEngine{

    dispatch(

        trainId:string

    ){

        return{

            trainId,

            dispatched:true

        };

    }

}
