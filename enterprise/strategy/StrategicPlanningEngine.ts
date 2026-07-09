// ============================================================================
// FILE:
// /enterprise/strategy/StrategicPlanningEngine.ts
// ============================================================================

import { StrategicObjective } from "./StrategicObjective";

export class StrategicPlanningEngine{

    publish(

        objective:StrategicObjective

    ){

        return{

            objective,

            planned:true

        };

    }

}
