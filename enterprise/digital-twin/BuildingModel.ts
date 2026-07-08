// ============================================================================
// FILE:
// /enterprise/digital-twin/BuildingModel.ts
// ============================================================================

export interface BuildingModel{

    id:string;

    facilityId:string;

    bimModel:string;

    floors:number;

    zones:number;

    synchronized:boolean;

}
