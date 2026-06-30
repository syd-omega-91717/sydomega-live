// ============================================================================
// FILE: /backend/src/modules/identity/application/services/risk-engine.service.ts
// NEW FILE
// ============================================================================

import { RiskAssessment }
from "../../domain/entities/risk-assessment";

export interface RiskEngineService{

    evaluate(

        userId:string,

        sessionId:string

    ):Promise<RiskAssessment>;

}
