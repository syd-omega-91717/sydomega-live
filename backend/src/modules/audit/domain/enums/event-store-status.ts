// ============================================================================
// FILE: /backend/src/modules/audit/domain/enums/event-store-status.ts
// NEW FILE
// ============================================================================

export enum EventStoreStatus{

    Appended="APPENDED",

    Archived="ARCHIVED",

    Replayed="REPLAYED",

    Corrupted="CORRUPTED"

}
