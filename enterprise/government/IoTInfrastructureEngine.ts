// ============================================================================
// FILE:
// /enterprise/government/IoTInfrastructureEngine.ts
// ============================================================================

import { IoTDevice } from "./IoTDevice";

export class IoTInfrastructureEngine{

    onboard(

        device:IoTDevice

    ){

        return{

            device,

            connected:true

        };

    }

}
