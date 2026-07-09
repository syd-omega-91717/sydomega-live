// ============================================================================
// FILE:
// /enterprise/space/DeepSpaceMissionControlEngine.ts
// ============================================================================

export class DeepSpaceMissionControlEngine{

    command(

        missionId:string

    ){

        return{

            missionId,

            commandAccepted:true

        };

    }

}
