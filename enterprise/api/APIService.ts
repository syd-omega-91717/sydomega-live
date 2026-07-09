// ============================================================================
// ENTERPRISE CORE EC-051
// FILE:
// /enterprise/api/APIService.ts
// ============================================================================

export interface APIService{

    id:string;

    name:string;

    version:string;

    visibility:"PUBLIC"|"PRIVATE"|"PARTNER";

    endpoint:string;

}
