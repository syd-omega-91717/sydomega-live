// ============================================================================
// FILE:
// /enterprise/healthcare/LaboratoryResult.ts
// ============================================================================

export interface LaboratoryResult{

    id:string;

    patientId:string;

    test:string;

    value:string;

    unit:string;

    referenceRange:string;

}
