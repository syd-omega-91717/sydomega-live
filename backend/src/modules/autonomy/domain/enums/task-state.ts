// ============================================================================
// FILE: /backend/src/modules/autonomy/domain/enums/task-state.ts
// NEW FILE
// ============================================================================

export enum TaskState{

    Pending="PENDING",

    Ready="READY",

    Executing="EXECUTING",

    Blocked="BLOCKED",

    Success="SUCCESS",

    Failure="FAILURE",

    Retry="RETRY"

}
