// ============================================================================
// FILE:
// /enterprise/strategy/KPIPerformanceEngine.ts
// ============================================================================

import { KPI } from "./KPI";

export class KPIPerformanceEngine{

    evaluate(

        indicator:KPI

    ){

        return{

            indicator,

            evaluated:true

        };

    }

}
