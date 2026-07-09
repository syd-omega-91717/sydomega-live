// ============================================================================
// FILE:
// /enterprise/healthcare/LIMSEngine.ts
// ============================================================================

import { LaboratorySample } from "./LaboratorySample";

export class LIMSEngine{

    process(

        sample:LaboratorySample

    ){

        return{

            completed:true,

            sample

        };

    }

}
