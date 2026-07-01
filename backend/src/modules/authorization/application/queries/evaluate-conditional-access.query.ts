// ============================================================================
// FILE: /backend/src/modules/authorization/application/queries/evaluate-conditional-access.query.ts
// NEW FILE
// ============================================================================

export class EvaluateConditionalAccessQuery{

    constructor(

        readonly principalId:string,

        readonly applicationId:string,

        readonly ipAddress:string

    ){}

}
