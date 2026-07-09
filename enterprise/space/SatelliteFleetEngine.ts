// ============================================================================
// FILE:
// /enterprise/space/SatelliteFleetEngine.ts
// ============================================================================

import { Satellite } from "./Satellite";

export class SatelliteFleetEngine{

    register(

        satellite:Satellite

    ){

        return{

            satellite,

            registered:true

        };

    }

}
