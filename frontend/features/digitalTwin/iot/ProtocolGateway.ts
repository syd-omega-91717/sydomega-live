// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/ProtocolGateway.ts
// ============================================================================

export class ProtocolGateway{

    route(

        protocol:string,

        payload:unknown

    ){

        return{

            protocol,

            payload

        };

    }

}
