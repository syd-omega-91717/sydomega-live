// ============================================================================
// FILE:
// /core/identity/DeviceTrustEngine.ts
// ============================================================================

export class DeviceTrustEngine{

    trust(

        deviceId:string

    ){

        return{

            deviceId,

            trusted:true

        };

    }

}
