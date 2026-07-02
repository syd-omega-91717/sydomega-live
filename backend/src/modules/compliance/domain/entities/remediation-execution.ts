// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/remediation-execution.ts
// NEW FILE
// ============================================================================

export class RemediationExecution{

    constructor(

        readonly executionId:string,

        readonly playbookId:string,

        readonly resourceId:string,

        readonly initiatedBy:string,

        readonly startedAt:Date,

        readonly finishedAt:Date|null

    ){}

}
