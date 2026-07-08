// ============================================================================
// FILE:
// /enterprise/digital-twin/TelemetryEngine.ts
// ============================================================================

import { TelemetryPacket } from "./TelemetryPacket";

export class TelemetryEngine{

    ingest(

        packet:TelemetryPacket

    ){

        return{

            accepted:true,

            packet

        };

    }

}
