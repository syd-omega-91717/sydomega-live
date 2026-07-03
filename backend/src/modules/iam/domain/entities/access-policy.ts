// ============================================================================
// FILE: /backend/src/modules/iam/domain/entities/access-policy.ts
// NEW FILE
// ============================================================================

export class AccessPolicy{

    constructor(

        readonly policyId:string,

        readonly resource:string,

        readonly action:string,

        readonly effect:"ALLOW"|"DENY"

    ){}

}
