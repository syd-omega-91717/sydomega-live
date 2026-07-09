// ============================================================================
// FILE:
// /enterprise/security/EDREngine.ts
// ============================================================================

export class EDREngine{

    isolateEndpoint(

        endpointId:string

    ){

        return{

            endpointId,

            isolated:true

        };

    }

}
