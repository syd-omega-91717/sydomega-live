// ============================================================================
// FILE:
// /enterprise/operations/Incident.ts
// ============================================================================

export interface Incident{

    id:string;

    title:string;

    severity:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL";

    status:string;

    createdAt:string;

}
