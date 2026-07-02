// ============================================================================
// FILE: /backend/src/modules/workflow/domain/enums/execution-state.ts
// NEW FILE
// ============================================================================

export enum ExecutionState{

    Pending="PENDING",

    Initializing="INITIALIZING",

    Executing="EXECUTING",

    Suspended="SUSPENDED",

    Completed="COMPLETED",

    Failed="FAILED",

    Timeout="TIMEOUT"

}
