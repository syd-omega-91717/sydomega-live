// ============================================================================
// FILE: /backend/src/kernel/scheduler/scheduled-job.ts
// NEW FILE
// ============================================================================

export interface ScheduledJob {

    readonly id: string;

    readonly scheduleId: string;

    execute(): Promise<void>;

}
