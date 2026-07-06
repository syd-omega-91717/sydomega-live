// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/ThermalSimulation.ts
// ============================================================================

export class ThermalSimulation{

    evolve(

        temperature:number,

        ambient:number

    ){

        return temperature+

        ((ambient-temperature)

        *0.02);

    }

}
