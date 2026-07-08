// ============================================================================
// FILE:
// /enterprise/healthcare/FHIRResource.ts
// ============================================================================

export interface FHIRResource{

    resourceType:string;

    id:string;

    version:string;

    payload:Record<string,unknown>;

}
