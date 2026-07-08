// ============================================================================
// FILE:
// /enterprise/command/MissionEngine.ts
// ============================================================================

import { Mission } from "./Mission";

export class MissionEngine{

    launch(

        mission:Mission

    ){

        mission.status="ACTIVE";

        return mission;

    }

    complete(

        mission:Mission

    ){

        mission.status="COMPLETED";

        return mission;

    }

}
