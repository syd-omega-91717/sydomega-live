// ============================================================================
// FILE:
// /enterprise/agriculture/SmartFarmingEngine.ts
// ============================================================================

import { Farm } from "./Farm";

export class SmartFarmingEngine{

    monitor(

        farm:Farm

    ){

        return{

            farm,

            monitored:true

        };

    }

}
