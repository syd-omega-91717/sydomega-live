// ============================================================================
// FILE: /backend/src/modules/cost/application/services/cost-optimizer.service.ts
// NEW FILE
// ============================================================================

import { CostForecast }
from "../../domain/entities/cost-forecast";

export interface CostOptimizerService{

    estimate(

        model:string

    ):Promise<number>;

    optimize(

        request:string

    ):Promise<string>;

    forecast(

    ):Promise<CostForecast>;

}
