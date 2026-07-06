// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/BACnetClient.ts
// ============================================================================

export class BACnetClient{

    async discover(){

        return[];

    }

    async readObject(

        objectId:string

    ){

        return{

            objectId,

            value:null

        };

    }

}
