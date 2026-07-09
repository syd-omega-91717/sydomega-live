// ============================================================================
// FILE:
// /enterprise/transport/AirportOperationsEngine.ts
// ============================================================================

export class AirportOperationsEngine{

    allocateGate(

        gateId:string,

        flightId:string

    ){

        return{

            gateId,

            flightId,

            allocated:true

        };

    }

}
