// ============================================================================
// ENTERPRISE CORE EC-034
// FILE:
// /enterprise/defense/Threat.ts
// ============================================================================

export interface Threat{

    id:string;

    category:string;

    severity:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL";

    location:string;

    detectedAt:string;

}
