// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-policy.ts
// NEW FILE
// ============================================================================

import { PolicyId }
from "../value-objects/policy-id";

import { PolicyEffect }
from "../enums/policy-effect";

import { PolicyCondition }
from "./policy-condition";

export class AccessPolicy{

    constructor(

        readonly id:PolicyId,

        readonly name:string,

        readonly resource:string,

        readonly action:string,

        readonly effect:PolicyEffect,

        readonly conditions:PolicyCondition[]

    ){}

}
