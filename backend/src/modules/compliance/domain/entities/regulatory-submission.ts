// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/regulatory-submission.ts
// NEW FILE
// ============================================================================

export class RegulatorySubmission{

    constructor(

        readonly submissionId:string,

        readonly authority:string,

        readonly reportId:string,

        readonly status:string,

        readonly submittedAt:Date|null

    ){}

}
