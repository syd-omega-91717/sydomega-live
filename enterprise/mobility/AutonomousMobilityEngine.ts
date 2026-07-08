// ============================================================================
// FILE:
// /enterprise/mobility/AutonomousMobilityEngine.ts
// ============================================================================

export class AutonomousMobilityEngine{

    coordinate(

        vehicleId:string

    ){

        return{

            vehicleId,

            autonomous:true

        };

    }

}
