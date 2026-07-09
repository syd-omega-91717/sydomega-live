// ============================================================================
// FILE:
// /enterprise/communications/VoIPEngine.ts
// ============================================================================

export class VoIPEngine{

    initiateCall(

        callerId:string,

        receiverId:string

    ){

        return{

            callerId,

            receiverId,

            connected:true

        };

    }

}
