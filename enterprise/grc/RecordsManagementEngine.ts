// ============================================================================
// FILE:
// /enterprise/grc/RecordsManagementEngine.ts
// ============================================================================

export class RecordsManagementEngine{

    archive(

        recordId:string

    ){

        return{

            recordId,

            archived:true

        };

    }

}
