// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/risk-engine.service.ts
// NEW FILE
// ============================================================================

import { RiskAssessment }
from "../../domain/entities/risk-assessment";

export interface RiskEngineService{

    evaluate(

        principalId:string

    ):Promise<RiskAssessment>;

}
