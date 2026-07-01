// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/mfa-policy.ts
// NEW FILE
// ============================================================================

import { MfaPolicyId }
from "../value-objects/mfa-policy-id";

import { MfaMethod }
from "../enums/mfa-method";

import { MfaPolicyStatus }
from "../enums/mfa-policy-status";

export class MfaPolicy{

    constructor(

        readonly id:MfaPolicyId,

        readonly name:string,

        readonly methods:MfaMethod[],

        readonly status:MfaPolicyStatus,

        readonly adaptive:boolean

    ){}

}
