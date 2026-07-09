// ============================================================================
// FILE:
// /enterprise/energy/EnvironmentalMonitoringEngine.ts
// ============================================================================

import { EnvironmentalSensor } from "./EnvironmentalSensor";

export class EnvironmentalMonitoringEngine{

    collect(

        sensor:EnvironmentalSensor

    ){

        return{

            sensor,

            collected:true

        };

    }

}
