// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/FluidSimulation.ts
// ============================================================================

export interface FluidCell{

    velocity:number;

    pressure:number;

}

export class FluidSimulation{

    update(

        cells:FluidCell[]

    ){

        return cells.map(cell=>({

            ...cell,

            pressure:

            cell.pressure*0.995

        }));

    }

}
