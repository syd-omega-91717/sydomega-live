// ============================================================================
// FILE:
// /enterprise/assets/IoTIntegrationEngine.ts
// ============================================================================

export class IoTIntegrationEngine{

    connect(

        deviceId:string

    ){

        return{

            deviceId,

            connected:true

        };

    }

}
