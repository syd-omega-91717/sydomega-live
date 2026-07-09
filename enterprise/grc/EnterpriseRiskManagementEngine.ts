// ============================================================================
// FILE:
// /enterprise/grc/EnterpriseRiskManagementEngine.ts
// ============================================================================

import { Risk } from "./Risk";

export class EnterpriseRiskManagementEngine{

    assess(

        risk:Risk

    ){

        return{

            risk,

            assessed:true

        };

    }

}
