// ============================================================================
// FILE:
// /enterprise/operations/MetricsCollectionEngine.ts
// ============================================================================

import { SystemMetric } from "./SystemMetric";

export class MetricsCollectionEngine{

    collect(

        metric:SystemMetric

    ){

        return{

            metric,

            stored:true

        };

    }

}
