// ============================================================================
// FILE: /backend/src/modules/guardrails/domain/entities/security-policy.ts
// NEW FILE
// ============================================================================

import { PolicyId }
from "../value-objects/policy-id";

import { PolicyAction }
from "../enums/policy-action";

export class SecurityPolicy{

    constructor(

        readonly id:PolicyId,

        readonly name:string,

        readonly category:string,

        readonly action:PolicyAction,

        readonly enabled:boolean,

        readonly version:number

    ){}

}
