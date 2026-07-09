// ============================================================================
// FILE:
// /enterprise/quantum/SimulationEngine.ts
// ============================================================================

import { SimulationModel } from "./SimulationModel";

export class SimulationEngine{

    run(

        model:SimulationModel

    ){

        return{

            completed:true,

            model

        };

    }

}
