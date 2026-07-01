// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/risk-rule.ts
// NEW FILE
// ============================================================================

import { RiskFactor }
from "../enums/risk-factor";

import { RiskLevel }
from "../enums/risk-level";

export class RiskRule{

    constructor(

        readonly id:string,

        readonly factor:RiskFactor,

        readonly score:number,

        readonly level:RiskLevel,

        readonly enabled:boolean

    ){}

}
