// ============================================================================
// FILE:
// /enterprise/intelligence/KPIEngine.ts
// ============================================================================

import { KPI } from "./KPI";

export class KPIEngine{

    calculate(

        kpi:KPI

    ){

        return{

            ...kpi,

            variance:

            kpi.value-kpi.target

        };

    }

}
