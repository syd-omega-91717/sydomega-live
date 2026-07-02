// ============================================================================
// FILE: /backend/src/modules/workflow/domain/enums/workflow-status.ts
// NEW FILE
// ============================================================================

export enum WorkflowStatus{

    Draft="DRAFT",

    Scheduled="SCHEDULED",

    Running="RUNNING",

    Waiting="WAITING",

    Completed="COMPLETED",

    Failed="FAILED",

    Cancelled="CANCELLED"

}
