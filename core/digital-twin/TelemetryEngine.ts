// ============================================================================
// FILE:
// /core/digital-twin/TelemetryEngine.ts
// ============================================================================

import { TwinSensor } from "./TwinSensor";

export class TelemetryEngine{

    ingest(

        sensor:TwinSensor

    ){

        return{

            accepted:true,

            sensor

        };

    }

}
