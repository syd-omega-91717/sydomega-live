// ============================================================================
// FILE:
// /enterprise/healthcare/LaboratoryEngine.ts
// ============================================================================

import { LaboratoryResult } from "./LaboratoryResult";

export class LaboratoryEngine{

    validate(

        result:LaboratoryResult

    ){

        return{

            validated:true,

            result

        };

    }

}
