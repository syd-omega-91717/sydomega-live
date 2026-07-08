// ============================================================================
// FILE:
// /core/academy/AcademyCertificateEngine.ts
// ============================================================================

export class AcademyCertificateEngine{

    issue(

        userId:string,

        courseId:string

    ){

        return{

            id:crypto.randomUUID(),

            userId,

            courseId,

            issuedAt:Date.now()

        };

    }

}
