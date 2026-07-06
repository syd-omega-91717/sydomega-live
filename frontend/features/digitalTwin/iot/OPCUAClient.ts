// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/OPCUAClient.ts
// ============================================================================

export class OPCUAClient{

    async connect(endpoint:string){

        return endpoint;

    }

    async read(nodeId:string){

        return{

            nodeId,

            value:null

        };

    }

    async write(

        nodeId:string,

        value:unknown

    ){

        return{

            nodeId,

            value

        };

    }

}
