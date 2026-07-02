// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/risk-score.ts
// NEW FILE
// ============================================================================

import { RiskScoreId }
from "../value-objects/risk-score-id";

import { RiskLevel }
from "../enums/risk-level";

import { RiskStatus }
from "../enums/risk-status";

export class RiskScore{

    constructor(

        readonly id:RiskScoreId,

        readonly assetId:string,

        readonly controlId:string,

        readonly likelihood:number,

        readonly impact:number,

        readonly score:number,

        readonly level:RiskLevel,

        readonly status:RiskStatus,

        readonly calculatedAt:Date

    ){}

}
