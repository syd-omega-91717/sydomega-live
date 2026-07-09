// ============================================================================
// FILE:
// /enterprise/space/TelemetryEngine.ts
// ============================================================================

export class TelemetryEngine{

    receive(

        satelliteId:string

    ){

        return{

            satelliteId,

            telemetryReceived:true

        };

    }

}
