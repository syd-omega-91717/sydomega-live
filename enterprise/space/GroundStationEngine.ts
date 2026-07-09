// ============================================================================
// FILE:
// /enterprise/space/GroundStationEngine.ts
// ============================================================================

import { GroundStation } from "./GroundStation";

export class GroundStationEngine{

    connect(

        station:GroundStation

    ){

        return{

            station,

            connected:true

        };

    }

}
