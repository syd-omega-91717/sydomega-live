// ============================================================================
// ENTERPRISE CORE EC-047
// FILE:
// /enterprise/operations/LogEntry.ts
// ============================================================================

export interface LogEntry{

    id:string;

    service:string;

    level:"INFO"|"WARN"|"ERROR"|"DEBUG";

    timestamp:string;

    message:string;

}
