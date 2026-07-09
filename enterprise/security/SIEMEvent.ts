// ============================================================================
// ENTERPRISE CORE EC-052
// FILE:
// /enterprise/security/SIEMEvent.ts
// ============================================================================

export interface SIEMEvent{

    id:string;

    source:string;

    severity:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL";

    timestamp:string;

    status:string;

}
