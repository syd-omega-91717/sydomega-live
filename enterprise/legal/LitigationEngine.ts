// ============================================================================
// FILE:
// /enterprise/legal/LitigationEngine.ts
// ============================================================================

export class LitigationEngine{

    track(

        caseId:string

    ){

        return{

            caseId,

            tracked:true

        };

    }

}
