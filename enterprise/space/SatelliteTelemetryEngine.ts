// ============================================================================
// FILE:
// /enterprise/space/SatelliteTelemetryEngine.ts
// ============================================================================

import { TelemetryPacket } from "./TelemetryPacket";

export class SatelliteTelemetryEngine{

    ingest(

        packet:TelemetryPacket

    ){

        return{

            accepted:true,

            packet

        };

    }

}
