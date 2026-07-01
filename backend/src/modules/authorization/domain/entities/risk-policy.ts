// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/risk-policy.ts
// NEW FILE
// ============================================================================

import { RiskPolicyId }
from "../value-objects/risk-policy-id";

import { RiskRule }
from "./risk-rule";

export class RiskPolicy{

    constructor(

        readonly id:RiskPolicyId,

        readonly name:string,

        readonly rules:RiskRule[]

    ){}

}
