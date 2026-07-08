// ============================================================================
// FILE:
// /enterprise/security/SOCIncident.ts
// ============================================================================

export interface SOCIncident{

    id:string;

    title:string;

    severity:string;

    status:string;

    assignedTo:string;

    detectedAt:number;

}
