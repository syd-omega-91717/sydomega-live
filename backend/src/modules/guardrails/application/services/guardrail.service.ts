// ============================================================================
// FILE: /backend/src/modules/guardrails/application/services/guardrail.service.ts
// NEW FILE
// ============================================================================

import { RiskAssessment }
from "../../domain/entities/risk-assessment";

export interface GuardrailService{

    validateInput(

        prompt:string

    ):Promise<RiskAssessment>;

    validateOutput(

        response:string

    ):Promise<RiskAssessment>;

}
