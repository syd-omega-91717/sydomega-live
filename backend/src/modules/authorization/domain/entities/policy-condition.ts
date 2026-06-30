// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/policy-condition.ts
// NEW FILE
// ============================================================================

export class PolicyCondition{

    constructor(

        readonly attribute:string,

        readonly operator:string,

        readonly value:unknown

    ){}

}
