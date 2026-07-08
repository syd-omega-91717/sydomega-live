// ============================================================================
// FILE:
// /enterprise/manufacturing/OPCUAGateway.ts
// ============================================================================

export class OPCUAGateway{

    connect(

        endpoint:string

    ){

        return{

            endpoint,

            connected:true

        };

    }

}
