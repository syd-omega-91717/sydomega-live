// ============================================================================
// FILE: /backend/src/modules/guardrails/domain/entities/risk-assessment.ts
// NEW FILE
// ============================================================================

import { RiskLevel }
from "../enums/risk-level";

export class RiskAssessment{

    constructor(

        readonly assessmentId:string,

        readonly score:number,

        readonly level:RiskLevel,

        readonly violations:string[],

        readonly requiresApproval:boolean

    ){}

}
