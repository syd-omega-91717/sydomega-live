// ============================================================================
// FILE:
// /enterprise/healthcare/ElectronicHealthRecord.ts
// ============================================================================

export interface ElectronicHealthRecord{

    id:string;

    patientId:string;

    allergies:string[];

    diagnoses:string[];

    medications:string[];

}
