// ============================================================================
// ENTERPRISE CORE EC-007
// FILE:
// /enterprise/security/SIEMEvent.ts
// ============================================================================

export interface SIEMEvent{

    id:string;

    source:string;

    severity:string;

    category:string;

    message:string;

    timestamp:number;

}
