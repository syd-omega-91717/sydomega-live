// ============================================================================
// FILE: /backend/src/kernel/scheduler/schedule.ts
// NEW FILE
// ============================================================================

export interface Schedule {

    readonly id: string;

    readonly name: string;

    readonly expression: string;

    readonly enabled: boolean;

}
