// ============================================================================
// FILE:
// /enterprise/energy/RenewablePlant.ts
// ============================================================================

export interface RenewablePlant{

    id:string;

    technology:"SOLAR"|"WIND"|"HYDRO"|"GEOTHERMAL"|"BIOMASS";

    generationMW:number;

    location:string;

}
