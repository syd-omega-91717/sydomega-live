// ============================================================================
// FILE:
// /core/academy/AssignmentEngine.ts
// ============================================================================

export class AssignmentEngine{

    submit(

        assignmentId:string,

        userId:string

    ){

        return{

            assignmentId,

            userId,

            submittedAt:Date.now()

        };

    }

}
