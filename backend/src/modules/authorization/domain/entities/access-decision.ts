// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-decision.ts
// NEW FILE
// ============================================================================

export class AccessDecision{

    constructor(

        readonly permitted:boolean,

        readonly reason:string,

        readonly evaluatedPolicies:string[],

        readonly obligations:string[]

    ){}

}
