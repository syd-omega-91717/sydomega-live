// ============================================================================
// FILE:
// /enterprise/mobility/AirportOperationsEngine.ts
// ============================================================================

export class AirportOperationsEngine{

    assignGate(

        flightId:string,

        gate:string

    ){

        return{

            flightId,

            gate,

            assigned:true

        };

    }

}
