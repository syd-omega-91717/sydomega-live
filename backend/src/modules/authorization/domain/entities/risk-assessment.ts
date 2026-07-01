// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/risk-assessment.ts
// NEW FILE
// ============================================================================

import { RiskLevel }
from "../enums/risk-level";

import { RiskFactor }
from "../enums/risk-factor";

export class RiskAssessment{

    constructor(

        readonly principalId:string,

        readonly score:number,

        readonly level:RiskLevel,

        readonly factors:RiskFactor[],

        readonly evaluatedAt:Date

    ){}

}
