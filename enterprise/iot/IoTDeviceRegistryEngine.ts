// ============================================================================
// FILE:
// /enterprise/iot/IoTDeviceRegistryEngine.ts
// ============================================================================

import { IoTDevice } from "./IoTDevice";

export class IoTDeviceRegistryEngine{

    register(

        device:IoTDevice

    ){

        return{

            device,

            registered:true

        };

    }

}
