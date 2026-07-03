// ============================================================================
// FILE: /backend/src/modules/governance/domain/entities/governance-policy.ts
// NEW FILE
// ============================================================================

import { GovernancePolicyId }
from "../value-objects/governance-policy-id";

import { GovernancePolicyStatus }
from "../enums/governance-policy-status";

export class GovernancePolicy{

    constructor(

        readonly id:GovernancePolicyId,

        readonly title:string,

        readonly version:string,

        readonly owner:string,

        readonly status:GovernancePolicyStatus,

        readonly effectiveDate:Date

    ){}

}
