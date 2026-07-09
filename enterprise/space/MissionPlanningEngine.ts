// ============================================================================
// FILE:
// /enterprise/space/MissionPlanningEngine.ts
// ============================================================================

import { Mission } from "./Mission";

export class MissionPlanningEngine{

    schedule(

        mission:Mission

    ){

        return{

            mission,

            scheduled:true

        };

    }

}
