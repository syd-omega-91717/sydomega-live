// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/conditional-access-policy.ts
// NEW FILE
// ============================================================================

import { ConditionalAccessPolicyId }
from "../value-objects/conditional-access-policy-id";

import { ConditionalAccessResult }
from "../enums/conditional-access-result";

export class ConditionalAccessPolicy{

    constructor(

        readonly id:ConditionalAccessPolicyId,

        readonly name:string,

        readonly priority:number,

        readonly enabled:boolean,

        readonly result:ConditionalAccessResult

    ){}

}
