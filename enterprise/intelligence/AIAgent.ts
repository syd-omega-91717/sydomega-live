// ============================================================================
// ENTERPRISE CORE EC-054
// FILE:
// /enterprise/intelligence/AIAgent.ts
// ============================================================================

export interface AIAgent{

    id:string;

    name:string;

    role:string;

    model:string;

    status:"ONLINE"|"OFFLINE"|"BUSY";

}
