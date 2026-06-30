// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/policy-rule.ts
// NEW FILE
// ============================================================================

import { PolicyEffect }
from "../enums/policy-effect";

import { PolicyCondition }
from "./policy-condition";

export class PolicyRule{

    constructor(

        readonly id:string,

        readonly name:string,

        readonly effect:PolicyEffect,

        readonly priority:number,

        readonly conditions:PolicyCondition[]

    ){}

}
