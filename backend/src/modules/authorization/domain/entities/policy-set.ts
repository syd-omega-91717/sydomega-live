// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/policy-set.ts
// NEW FILE
// ============================================================================

import { PolicySetId }
from "../value-objects/policy-set-id";

import { PolicyRule }
from "./policy-rule";

import { PolicyCombiningAlgorithm }
from "../enums/policy-combining-algorithm";

export class PolicySet{

    constructor(

        readonly id:PolicySetId,

        readonly name:string,

        readonly algorithm:PolicyCombiningAlgorithm,

        readonly rules:PolicyRule[]

    ){}

}
