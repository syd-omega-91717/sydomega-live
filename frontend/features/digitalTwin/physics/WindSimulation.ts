// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/WindSimulation.ts
// ============================================================================

export interface WindField{

    speed:number;

    direction:number;

}

export class WindSimulation{

    sample():WindField{

        return{

            speed:12,

            direction:180

        };

    }

}
