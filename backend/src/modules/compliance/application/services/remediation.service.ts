// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/remediation.service.ts
// NEW FILE
// ============================================================================

export interface RemediationService{

    execute(

        playbookId:string,

        resourceId:string

    ):Promise<void>;

    rollback(

        executionId:string

    ):Promise<void>;

}
