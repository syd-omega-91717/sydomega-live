// ============================================================================
// FILE:
// /enterprise/iot/DeviceProvisioningEngine.ts
// ============================================================================

export class DeviceProvisioningEngine{

    provision(

        deviceId:string

    ){

        return{

            deviceId,

            provisioned:true

        };

    }

}
