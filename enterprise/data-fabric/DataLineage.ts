// ============================================================================
// FILE:
// /enterprise/data-fabric/DataLineage.ts
// ============================================================================

export interface DataLineage{

    id:string;

    source:string;

    destination:string;

    operation:string;

    timestamp:number;

}
