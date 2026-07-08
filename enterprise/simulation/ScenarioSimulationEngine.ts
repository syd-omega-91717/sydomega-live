// ============================================================================
// FILE:
// /enterprise/simulation/ScenarioSimulationEngine.ts
// ============================================================================

import { SimulationScenario } from "./SimulationScenario";

export class ScenarioSimulationEngine{

    execute(

        scenario:SimulationScenario

    ){

        return{

            scenario,

            started:true,

            timestamp:Date.now()

        };

    }

}
