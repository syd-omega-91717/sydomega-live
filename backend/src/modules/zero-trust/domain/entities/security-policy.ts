// ============================================================================
// FILE: /backend/src/modules/zero-trust/domain/entities/security-policy.ts
// NEW FILE
// ============================================================================

import { SecurityPolicyId }
from "../value-objects/security-policy-id";

export class SecurityPolicy{

    constructor(

        readonly id:SecurityPolicyId,

        readonly name:string,

        readonly version:string,

        readonly enabled:boolean,

        readonly priority:number

    ){}

}
