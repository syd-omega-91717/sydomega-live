// ============================================================================
// ENTERPRISE CORE EC-040
// FILE:
// /enterprise/energy/PowerPlant.ts
// ============================================================================

export interface PowerPlant{

    id:string;

    name:string;

    type:"SOLAR"|"WIND"|"HYDRO"|"NUCLEAR"|"THERMAL"|"GAS";

    capacityMW:number;

    operational:boolean;

}
