// ============================================================================
// FILE:
// /enterprise/iot/DigitalSensorNetworkEngine.ts
// ============================================================================

import { Sensor } from "./Sensor";

export class DigitalSensorNetworkEngine{

    activate(

        sensor:Sensor

    ){

        return{

            sensor,

            active:true

        };

    }

}
