// ============================================================================
// FILE: /backend/src/modules/event-bus/domain/enums/event-status.ts
// NEW FILE
// ============================================================================

export enum EventStatus{

    Pending="PENDING",

    Published="PUBLISHED",

    Delivered="DELIVERED",

    Failed="FAILED",

    DeadLetter="DEAD_LETTER"

}
