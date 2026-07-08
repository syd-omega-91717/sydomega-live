// ============================================================================
// FILE:
// /core/digital-twin/SimulationEngine.ts
// ============================================================================

import { TwinEntity } from "./TwinEntity";

export class SimulationEngine{

    simulate(

        entity:TwinEntity

    ){

        return{

            entity,

            simulated:true,

            timestamp:Date.now()

        };

    }

}
