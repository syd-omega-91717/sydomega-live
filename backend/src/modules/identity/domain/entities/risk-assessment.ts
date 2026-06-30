// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/risk-assessment.ts
// NEW FILE
// ============================================================================

import { RiskLevel } from "../enums/risk-level";
import { RiskScore } from "../value-objects/risk-score";

export class RiskAssessment{

    constructor(

        readonly score:RiskScore,

        readonly level:RiskLevel,

        readonly factors:RiskFactor[],

        readonly createdAt:Date

    ){}

}
