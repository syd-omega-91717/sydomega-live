// ============================================================================
// FILE:
// /enterprise/energy/PowerGenerationEngine.ts
// ============================================================================

import { PowerPlant } from "./PowerPlant";

export class PowerGenerationEngine{

    monitor(

        plant:PowerPlant

    ){

        return{

            plant,

            monitored:true

        };

    }

}
