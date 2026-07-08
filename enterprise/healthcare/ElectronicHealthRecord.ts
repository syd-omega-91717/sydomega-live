// ============================================================================
// FILE:
// /enterprise/healthcare/ElectronicHealthRecord.ts
// ============================================================================

export interface ElectronicHealthRecord{

    id:string;

    patientId:string;

    encounterId:string;

    diagnosis:string[];

    medications:string[];

    allergies:string[];

}
