// ============================================================================
// FILE:
// /enterprise/education/CertificationEngine.ts
// ============================================================================

export class CertificationEngine{

    issue(

        studentId:string,

        certificateId:string

    ){

        return{

            studentId,

            certificateId,

            issued:true

        };

    }

}
