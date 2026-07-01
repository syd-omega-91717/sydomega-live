// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-review-item.ts
// NEW FILE
// ============================================================================

export class AccessReviewItem{

    constructor(

        readonly assignmentId:string,

        readonly userId:string,

        readonly roleId:string,

        readonly approved:boolean|null,

        readonly comment:string|null

    ){}

}
