// ============================================================================
// FILE:
// /enterprise/education/LearningManagementEngine.ts
// ============================================================================

export class LearningManagementEngine{

    enroll(

        studentId:string,

        courseId:string

    ){

        return{

            studentId,

            courseId,

            enrolled:true

        };

    }

}
