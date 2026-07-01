// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/sod-policy.ts
// NEW FILE
// ============================================================================

import { SodPolicyId }
from "../value-objects/sod-policy-id";

import { SodPolicyType }
from "../enums/sod-policy-type";

import { SodRule }
from "./sod-rule";

export class SodPolicy{

    constructor(

        readonly id:SodPolicyId,

        readonly name:string,

        readonly type:SodPolicyType,

        readonly enabled:boolean,

        readonly rules:SodRule[]

    ){}

}
