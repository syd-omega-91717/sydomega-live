// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/auditor-review.ts
// NEW FILE
// ============================================================================

export class AuditorReview{

    constructor(

        readonly reviewId:string,

        readonly auditorId:string,

        readonly certificationId:string,

        readonly approved:boolean,

        readonly comments:string,

        readonly reviewedAt:Date|null

    ){}

}
