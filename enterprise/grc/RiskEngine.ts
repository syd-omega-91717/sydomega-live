// ============================================================================
// FILE:
// /enterprise/grc/RiskEngine.ts
// ============================================================================

import { RiskRecord } from "./RiskRecord";

export class RiskEngine{

    assess(

        risk:RiskRecord

    ){

        return{

            riskId:risk.id,

            score:risk.likelihood*risk.impact

        };

    }

}
