// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/risk-engine.service.ts
// NEW FILE
// ============================================================================

import { RiskScore }
from "../../domain/entities/risk-score";

export interface RiskEngineService{

    calculate(

        assetId:string,

        controlId:string

    ):Promise<RiskScore>;

    recalculateAll():Promise<void>;

}
