// ============================================================================
// FILE:
// /enterprise/healthcare/PACSEngine.ts
// ============================================================================

export class PACSEngine{

    archive(

        studyId:string

    ){

        return{

            studyId,

            archived:true

        };

    }

}
